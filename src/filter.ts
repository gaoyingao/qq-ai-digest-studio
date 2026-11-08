import { OneBotMessageEvent, StoredMessage, MessageChunk, AppConfig } from './types.js';

// 记录每个群最近几条消息用于识别“复读机”刷屏
const recentGroupTexts = new Map<string, string[]>();

const NOISE_EXACT_SET = new Set([
  '6', '66', '666', '6666', '?', '？', '？？', '？？？',
  '+1', '1', '111', '哈哈', '哈哈哈', '哈哈哈哈', '草', '艹',
  '牛', '牛逼', 'nb', 'NB', '确实', '蹲', '插眼', 'cy',
  '[图片]', '[动画表情]', '[表情]', '[语音]', '[戳一戳]'
]);

export function parseAndFilterOneBotEvent(
  event: OneBotMessageEvent,
  config: AppConfig
): StoredMessage | null {
  if (event.post_type !== 'message') return null;
  if (!event.message_id || !event.user_id) return null;
  // 仅关注群聊消息，忽略所有私聊消息
  if (event.message_type !== 'group' || !event.group_id) return null;

  const groupId = String(event.group_id);
  const senderName =
    event.sender?.card?.trim() ||
    event.sender?.nickname?.trim() ||
    String(event.user_id);
  const groupName =
    event.group_name || config.filter.monitoredGroups[groupId]?.groupName || `群聊(${groupId})`;

  const selfId = String(event.self_id || config.napcat.selfQqId || '3076836236');
  const isSelfMsg = String(event.user_id) === selfId || String(event.user_id) === '3076836236';

  let isAtMe = 0;
  let replyToId: string | null = null;
  const textParts: string[] = [];

  if (Array.isArray(event.message)) {
    for (const seg of event.message) {
      if (seg.type === 'text') {
        textParts.push(seg.data?.text || '');
      } else if (seg.type === 'at') {
        const qq = String(seg.data?.qq || '');
        if (qq === 'all') {
          isAtMe = 1;
          textParts.push('[@全体成员] ');
        } else if (selfId && qq === selfId) {
          isAtMe = 1;
          textParts.push('[@我] ');
        } else {
          const atName = seg.data?.name || qq;
          textParts.push(`[@${atName}] `);
        }
      } else if (seg.type === 'reply') {
        replyToId = String(seg.data?.id || '');
      } else if (seg.type === 'image') {
        const subType = Number(seg.data?.sub_type || 0);
        // sub_type !== 0 通常是动画表情包；sub_type === 0 是真实聊天图片/截图/海报
        if (subType !== 0 || (seg.data?.summary && seg.data.summary.includes('表情'))) {
          textParts.push('[动画表情]');
        } else {
          const imgUrl =
            seg.data?.url ||
            (typeof seg.data?.file === 'string' && seg.data.file.startsWith('http')
              ? seg.data.file
              : '');
          if (imgUrl) {
            textParts.push(`[图片: ${imgUrl}]`);
          } else {
            textParts.push('[图片]');
          }
        }
      } else if (seg.type === 'face') {
        textParts.push('[表情]');
      } else if (seg.type === 'file') {
        const fileName = seg.data?.file || seg.data?.name || '未知文件';
        textParts.push(`[群文件: ${fileName}]`);
      } else if (seg.type === 'json') {
        try {
          const rawJson = JSON.parse(seg.data?.data || '{}');
          const title = rawJson?.meta?.news?.title || rawJson?.meta?.detail_1?.desc || rawJson?.prompt || '分享卡片';
          const url = rawJson?.meta?.news?.jumpUrl || rawJson?.meta?.detail_1?.qqdocurl || '';
          textParts.push(`[分享: ${title}${url ? ` (${url})` : ''}]`);
        } catch {
          textParts.push('[卡片消息]');
        }
      }
    }
  } else if (typeof event.raw_message === 'string') {
    if (event.raw_message.includes(`[CQ:at,qq=all]`) || (selfId && event.raw_message.includes(`[CQ:at,qq=${selfId}]`))) {
      isAtMe = 1;
    }
    const replyMatch = event.raw_message.match(/\[CQ:reply,id=(\d+)\]/);
    if (replyMatch) {
      replyToId = replyMatch[1];
    }
    const cleaned = event.raw_message
      .replace(/\[CQ:reply,id=\d+\]/g, '')
      .replace(/\[CQ:at,qq=all[^\]]*\]/g, '[@全体成员] ')
      .replace(/\[CQ:at,qq=(\d+)[^\]]*\]/g, '[@$1] ')
      .replace(/\[CQ:image,[^\]]*sub_type=[1-9][^\]]*\]/g, '[动画表情]')
      .replace(/\[CQ:image,[^\]]*\]/g, '[图片]')
      .replace(/\[CQ:face,[^\]]*\]/g, '[表情]');
    textParts.push(cleaned);
  }

  const cleanText = textParts.join('').trim();
  const timestamp = (event.time ? event.time * 1000 : Date.now());

  // 检查高优条件
  let isHighPriority = 0;
  const reasons: string[] = [];

  if (isAtMe) {
    isHighPriority = 1;
    reasons.push('提及@我/@全体');
  }

  for (const kw of config.filter.highPriorityKeywords) {
    if (kw && cleanText.toLowerCase().includes(kw.toLowerCase())) {
      isHighPriority = 1;
      reasons.push(`命中关键词[${kw}]`);
      break;
    }
  }

  if (event.sender?.role === 'owner' || event.sender?.role === 'admin') {
    if (cleanText.length >= 10) {
      reasons.push(event.sender.role === 'owner' ? '群主发言' : '管理员发言');
    }
  }

  // L1 过滤判定：
  // 1) 本人自己发送的消息无需 AI 总结
  // 2) 过滤纯动画表情包、系统表情、无链接图片占位及毫无信息量的纯水群符号/口水词
  let filterStatus: 'kept' | 'filtered_noise' = 'kept';
  let filterReason: string | null = null;

  if (isSelfMsg) {
    isHighPriority = 0;
    filterStatus = 'filtered_noise';
    filterReason = '本人发送消息免总结';
  } else if (!isHighPriority) {
    const trimmed = cleanText.trim();
    if (!trimmed || /^(\[动画表情\]|\[表情\]|\[语音\]|\[戳一戳\]|\[空消息\]|\s)+$/.test(trimmed)) {
      filterStatus = 'filtered_noise';
      filterReason = '纯表情包';
    } else if (/^(\[图片\]|\s)+$/.test(trimmed)) {
      filterStatus = 'filtered_noise';
      filterReason = '无链接图片占位';
    } else if (
      NOISE_EXACT_SET.has(trimmed) ||
      /^[0-9?？!！.。,，~～+＋=＝ha哈呵草艹牛6\s]+$/i.test(trimmed)
    ) {
      filterStatus = 'filtered_noise';
      filterReason = '无意义水群短语';
    }
  }

  return {
    message_id: String(event.message_id),
    chat_type: 'group',
    group_id: groupId,
    group_name: groupName,
    user_id: String(event.user_id),
    sender_name: senderName,
    sender_role: event.sender?.role || 'member',
    clean_text: cleanText || '[空消息]',
    reply_to_id: replyToId,
    is_at_me: isAtMe,
    is_high_priority: isHighPriority,
    priority_reason: reasons.length > 0 ? reasons.join(', ') : null,
    filter_status: filterStatus,
    filter_reason: filterReason,
    timestamp,
  };
}

/**
 * L2 会话切片：将保留下来的消息按群聊与时间窗口（如 15 分钟）聚合成对话块，保留引用关系和消息 ID 以便溯源
 */
export function buildConversationChunks(
  messages: StoredMessage[],
  config: AppConfig
): MessageChunk[] {
  const kept = messages.filter((m) => {
    if (m.chat_type !== 'group') return false;
    if (m.filter_status !== 'kept') return false;
    const grpRule = config.filter.monitoredGroups[m.group_id];
    if (grpRule && grpRule.enabled === false) return false;
    if (!config.filter.watchAllGroupsByDefault && (!grpRule || !grpRule.enabled)) {
      return false;
    }
    return true;
  });

  // 按群分组
  const byGroup = new Map<string, StoredMessage[]>();
  for (const m of kept) {
    const list = byGroup.get(m.group_id) || [];
    list.push(m);
    byGroup.set(m.group_id, list);
  }

  const gapMs = (config.filter.sessionGapMinutes || 15) * 60 * 1000;
  const chunks: MessageChunk[] = [];

  for (const [groupId, groupMsgs] of byGroup.entries()) {
    groupMsgs.sort((a, b) => a.timestamp - b.timestamp);
    let currentBatch: StoredMessage[] = [];

    const flushBatch = () => {
      if (currentBatch.length === 0) return;
      const startTime = currentBatch[0].timestamp;
      const endTime = currentBatch[currentBatch.length - 1].timestamp;
      const groupName =
        config.filter.monitoredGroups[groupId]?.groupName ||
        currentBatch[currentBatch.length - 1].group_name;
      const chunkId = `${groupId}_${startTime}`;
      const hasHighPriority = currentBatch.some((m) => m.is_high_priority === 1);

      const lines = currentBatch.map((m) => {
        const bj = new Date(m.timestamp + 8 * 3600_000);
        const mm = String(bj.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(bj.getUTCDate()).padStart(2, '0');
        const hm = `${mm}-${dd} ${String(bj.getUTCHours()).padStart(2, '0')}:${String(bj.getUTCMinutes()).padStart(2, '0')}`;
        const roleTag = m.sender_role === 'owner' ? '[群主]' : m.sender_role === 'admin' ? '[管理员]' : '';
        const hpTag = m.is_high_priority ? `🔥(${m.priority_reason})` : '';
        const replyTag = m.reply_to_id ? `[回复->#${m.reply_to_id}] ` : '';
        return `[#${m.message_id} ${hm}] ${roleTag}${m.sender_name}${hpTag}: ${replyTag}${m.clean_text}`;
      });

      chunks.push({
        chunkId,
        groupId,
        groupName,
        startTime,
        endTime,
        hasHighPriority,
        messages: [...currentBatch],
        formattedTranscript: lines.join('\n'),
      });
      currentBatch = [];
    };

    for (const msg of groupMsgs) {
      if (currentBatch.length === 0) {
        currentBatch.push(msg);
      } else {
        const prev = currentBatch[currentBatch.length - 1];
        // 如果超过时间窗口 或 单个切片消息数达到 60 条，则切分
        if (msg.timestamp - prev.timestamp > gapMs || currentBatch.length >= 60) {
          flushBatch();
        }
        currentBatch.push(msg);
      }
    }
    flushBatch();
  }

  return chunks.sort((a, b) => a.startTime - b.startTime);
}
