import WebSocket from 'ws';
import { AppConfig, OneBotMessageEvent, OneBotSegment } from './types.js';
import { parseAndFilterOneBotEvent } from './filter.js';
import {
  insertMessage,
  getDigestWatermarkState,
  getGroupMessagesFromDb,
  getDiscoveredGroups,
} from './db.js';
import { enrichMessageWithAiVision } from './ai.js';
import { pushUrgentMessageToMobile } from './notifier.js';

export interface NapCatStatus {
  connected: boolean;
  mode: 'forward_ws' | 'reverse_ws' | 'disconnected';
  selfQqId: string;
  selfNickname: string;
  lastHeartbeatTime: number | null;
  lastMessageTime: number | null;
  receivedCountSession: number;
  lastError: string | null;
}

export interface ContactItem {
  id: string;
  name: string;
  type: 'group' | 'private';
  avatar: string;
  subTitle?: string;
  lastActive?: number;
  lastPreview?: string;
}

export interface FormattedChatMsg {
  message_id: string;
  user_id: string;
  sender_name: string;
  sender_role?: string;
  is_self: boolean;
  timestamp: number;
  text: string;
  images: string[];
  reply_to_id: string | null;
}

const groupNameCache = new Map<string, string>();
export const groupListCache = new Map<string, ContactItem>();
export const friendListCache = new Map<string, ContactItem>();
const chatHistoryCache = new Map<string, FormattedChatMsg[]>();

let forwardWs: WebSocket | null = null;
let reverseWs: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let keepAliveTimer: NodeJS.Timeout | null = null;
let savedGetConfig: (() => AppConfig) | null = null;
let isBackfilling = false;

function sanitizeName(str: string): string {
  return String(str || '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

function appendToChatCache(chatType: 'group' | 'private', targetId: string, msg: FormattedChatMsg): void {
  const key = `${chatType}_${targetId}`;
  const list = chatHistoryCache.get(key) || [];
  if (msg.message_id && list.some((m) => m.message_id === msg.message_id)) {
    return;
  }
  list.push(msg);
  if (list.length > 60) {
    list.splice(0, list.length - 60);
  }
  chatHistoryCache.set(key, list);
}

// 等待响应的 RPC Map
const pendingEchoes = new Map<
  string,
  { resolve: (val: any) => void; reject: (err: Error) => void; timer: NodeJS.Timeout }
>();

export const napcatStatus: NapCatStatus = {
  connected: false,
  mode: 'disconnected',
  selfQqId: '',
  selfNickname: '',
  lastHeartbeatTime: null,
  lastMessageTime: null,
  receivedCountSession: 0,
  lastError: null,
};

function getActiveSocket(): WebSocket | null {
  if (forwardWs && forwardWs.readyState === WebSocket.OPEN) return forwardWs;
  if (reverseWs && reverseWs.readyState === WebSocket.OPEN) return reverseWs;
  return null;
}

async function ensureActiveSocket(waitMs = 2500): Promise<WebSocket | null> {
  const existing = getActiveSocket();
  if (existing) return existing;
  if (savedGetConfig) {
    startForwardNapCatClient(savedGetConfig);
  }
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 150));
    const ws = getActiveSocket();
    if (ws) return ws;
  }
  return getActiveSocket();
}

export async function callOneBotApi(
  action: string,
  params: Record<string, any> = {},
  timeoutMs = 7000
): Promise<any> {
  const ws = (await ensureActiveSocket(1800)) || getActiveSocket();
  if (!ws) {
    throw new Error('NapCat WebSocket 当前未连接（如处于官方 QQ 模式，请点击右上角“⚡ 挂载 AI 模式”）');
  }
  const echo = `rpc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingEchoes.delete(echo);
      reject(new Error(`调用 OneBot 接口 ${action} 超时`));
    }, timeoutMs);

    pendingEchoes.set(echo, { resolve, reject, timer });
    try {
      ws.send(JSON.stringify({ action, params, echo }));
    } catch (err: any) {
      clearTimeout(timer);
      pendingEchoes.delete(echo);
      reject(new Error(`WebSocket 发送失败: ${err?.message || '未知错误'}`));
    }
  });
}

function parseRawOneBotMsgForChatView(raw: any): FormattedChatMsg {
  const selfId = String(napcatStatus.selfQqId || raw.self_id || '');
  const userId = String(raw.user_id || raw.sender?.user_id || '');
  const senderName =
    raw.sender?.card?.trim() ||
    raw.sender?.nickname?.trim() ||
    userId;

  const textParts: string[] = [];
  const images: string[] = [];
  let replyToId: string | null = null;

  const segments: OneBotSegment[] = Array.isArray(raw.message) ? raw.message : [];
  for (const seg of segments) {
    if (seg.type === 'text') {
      textParts.push(seg.data?.text || '');
    } else if (seg.type === 'at') {
      const qq = String(seg.data?.qq || '');
      const name = seg.data?.name || (qq === 'all' ? '全体成员' : qq);
      textParts.push(`@${name} `);
    } else if (seg.type === 'reply') {
      replyToId = String(seg.data?.id || '');
    } else if (seg.type === 'image') {
      const url = seg.data?.url || seg.data?.file || '';
      if (url && url.startsWith('http')) {
        images.push(url);
      } else {
        textParts.push('[图片]');
      }
    } else if (seg.type === 'face') {
      textParts.push('[表情]');
    } else if (seg.type === 'file') {
      textParts.push(`[文件: ${seg.data?.file || seg.data?.name || '附件'}]`);
    } else if (seg.type === 'json') {
      textParts.push('[卡片分享]');
    }
  }

  if (segments.length === 0 && typeof raw.raw_message === 'string') {
    textParts.push(raw.raw_message);
  }

  return {
    message_id: String(raw.message_id || ''),
    user_id: userId,
    sender_name: senderName,
    sender_role: raw.sender?.role || 'member',
    is_self: Boolean(selfId && userId === selfId),
    timestamp: (raw.time ? Number(raw.time) * 1000 : Date.now()),
    text: textParts.join('').trim(),
    images,
    reply_to_id: replyToId,
  };
}

export async function fetchChatHistory(
  chatType: 'group' | 'private',
  targetId: string,
  count = 35
): Promise<FormattedChatMsg[]> {
  const cacheKey = `${chatType}_${targetId}`;
  try {
    const action = chatType === 'group' ? 'get_group_msg_history' : 'get_friend_msg_history';
    const paramKey = chatType === 'group' ? 'group_id' : 'user_id';
    const historyParams = {
      [paramKey]: String(targetId),
      count,
      disable_get_url: true,
      parse_mult_msg: false,
    };
    let res: any;
    try {
      res = await callOneBotApi(action, historyParams, 6000);
    } catch {
      // 偶发 IPC 忙或瞬断时自动重试一次
      await new Promise((r) => setTimeout(r, 300));
      res = await callOneBotApi(action, historyParams, 6000);
    }
    const list = Array.isArray(res?.messages) ? res.messages : [];
    const parsedList: FormattedChatMsg[] = list.map(parseRawOneBotMsgForChatView);

    // 合并内存缓存中可能刚发出的最新消息
    const cached = chatHistoryCache.get(cacheKey) || [];
    const seenIds = new Set(parsedList.map((m) => m.message_id));
    for (const c of cached) {
      if (c.message_id && !seenIds.has(c.message_id) && c.timestamp >= (parsedList[0]?.timestamp || 0)) {
        parsedList.push(c);
      }
    }
    parsedList.sort((a, b) => a.timestamp - b.timestamp);
    const finalSlice = parsedList.slice(-count);
    chatHistoryCache.set(cacheKey, finalSlice);
    return finalSlice;
  } catch (err) {
    // 兜底机制：当 NapCat 暂时断线、切回官方 QQ 或某个会话历史拉取超时，自动回退至内存缓存 + 本地 SQLite 历史记录，绝不崩溃！
    const cached = chatHistoryCache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached.slice(-count);
    }
    if (chatType === 'group') {
      const dbRows = getGroupMessagesFromDb(targetId, count);
      const selfId = String(napcatStatus.selfQqId || '3076836236');
      return dbRows.map((r) => {
        const imgs: string[] = [];
        const imgMatch = r.clean_text.match(/\[图片:\s*(https?:\/\/[^\]\s]+)\]/);
        if (imgMatch) imgs.push(imgMatch[1]);
        return {
          message_id: r.message_id,
          user_id: r.user_id,
          sender_name: sanitizeName(r.sender_name),
          sender_role: r.sender_role,
          is_self: r.user_id === selfId,
          timestamp: r.timestamp,
          text: r.clean_text.replace(/\[图片:\s*https?:\/\/[^\]\s]+\]/g, '').trim(),
          images: imgs,
          reply_to_id: r.reply_to_id,
        };
      });
    }
    return [];
  }
}

/**
 * 历史消息回溯补齐 (Auto-Backfill)：
 * 当用户切回官方 QQ 使用一段时间后重新挂载，或者电脑刚开机时，
 * 自动拉取最近活跃群聊的历史消息补齐到本地数据库，确保切回官方 QQ 期间的群消息 0 遗漏！
 */
export async function backfillRecentGroupHistory(
  config: AppConfig,
  maxGroups = 60,
  countPerGroup = 60
): Promise<{ scannedGroups: number; newlyInserted: number }> {
  if (isBackfilling || !getActiveSocket()) {
    return { scannedGroups: 0, newlyInserted: 0 };
  }
  isBackfilling = true;
  try {
    const targetGroupIds = new Set<string>();

    // 1. 优先通过 get_recent_contact 获取最近有新消息的群聊（按最新活跃排序）
    try {
      const recentList = await callOneBotApi('get_recent_contact', { count: 60 }, 8000);
      if (Array.isArray(recentList)) {
        const groupItems = recentList
          .filter((item) => Number(item?.chatType) === 2 && item?.peerUin)
          .sort((a, b) => Number(b.msgTime || 0) - Number(a.msgTime || 0));
        for (const item of groupItems) {
          const gid = String(item.peerUin);
          if (item.peerName && !groupNameCache.has(gid)) {
            groupNameCache.set(gid, sanitizeName(item.peerName));
          }
          targetGroupIds.add(gid);
        }
      }
    } catch (err: any) {
      console.warn('[Backfill] get_recent_contact 暂未就绪，自动使用已知活跃群列表回溯:', err?.message || err);
    }

    // 2. 补充本地 SQLite 已知活跃群（按最近活跃时间降序）
    try {
      const discovered = getDiscoveredGroups();
      for (const g of discovered) {
        if (g.group_id) {
          targetGroupIds.add(String(g.group_id));
        }
      }
    } catch {}

    // 3. 补充用户已配置监控的群和 QQ 群列表缓存中的群
    if (config.filter.monitoredGroups && typeof config.filter.monitoredGroups === 'object') {
      for (const gid of Object.keys(config.filter.monitoredGroups)) {
        if (config.filter.monitoredGroups[gid]?.enabled !== false) {
          targetGroupIds.add(gid);
        }
      }
    }
    for (const gid of groupNameCache.keys()) {
      targetGroupIds.add(gid);
    }

    // 过滤掉被用户显式关闭监控的群
    const allGroupIds = Array.from(targetGroupIds).filter((gid) => {
      if (config.filter.monitoredGroups && typeof config.filter.monitoredGroups === 'object') {
        const rule = config.filter.monitoredGroups[gid];
        if (rule && rule.enabled === false) return false;
      }
      return true;
    });

    const groupIds = allGroupIds.slice(0, maxGroups);
    let newlyInserted = 0;

    // 重要修复：必须以“上次已总结时间锚点 (lastSummarizedAt)”作为回溯起点，而不能用 lastMessageTs！
    // 否则一旦刚开机收到 1 条实时新消息，lastMessageTs 跳到当前时间，会导致中间数小时的离线未读消息被误跳过！
    const watermark = getDigestWatermarkState();
    const minAllowedTs = Math.max(
      Date.now() - 36 * 3600_000,
      watermark.lastSummarizedAt || 0
    );

    for (const gid of groupIds) {
      if (!getActiveSocket()) break;
      try {
        await new Promise((r) => setTimeout(r, 40));
        const res = await callOneBotApi(
          'get_group_msg_history',
          {
            group_id: String(gid),
            count: countPerGroup,
            disable_get_url: true,
            parse_mult_msg: false,
          },
          6000
        );
        const rawMsgs: OneBotMessageEvent[] = res?.messages || [];
        for (const ev of rawMsgs) {
          const evTimeMs = ev.time ? ev.time * 1000 : Date.now();
          if (evTimeMs <= minAllowedTs) continue;
          ev.post_type = 'message';
          ev.message_type = 'group';
          ev.group_id = Number(gid);
          if (!ev.group_name) {
            ev.group_name = groupNameCache.get(gid) || `群聊(${gid})`;
          }
          const parsed = parseAndFilterOneBotEvent(ev, config);
          if (parsed && parsed.timestamp > minAllowedTs && insertMessage(parsed)) {
            newlyInserted++;
            napcatStatus.receivedCountSession += 1;
            napcatStatus.lastMessageTime = Math.max(napcatStatus.lastMessageTime || 0, parsed.timestamp);
            if (/\[图片:\s*https?:\/\/[^\]\s]+\]/.test(parsed.clean_text)) {
              enrichMessageWithAiVision(parsed, config).catch(() => {});
            }
          }
        }
      } catch {}
    }

    if (newlyInserted > 0) {
      console.log(`[Backfill] 已自动从 ${groupIds.length} 个群回溯补齐了 ${newlyInserted} 条离线/漏收的新增群消息！`);
    }
    return { scannedGroups: groupIds.length, newlyInserted };
  } finally {
    isBackfilling = false;
  }
}

export async function sendChatMessage(
  chatType: 'group' | 'private',
  targetId: string,
  text: string,
  replyToMessageId?: string,
  atUserId?: string
): Promise<any> {
  const buildSegments = (includeReply: boolean): OneBotSegment[] => {
    const segs: OneBotSegment[] = [];
    if (includeReply && replyToMessageId) {
      segs.push({ type: 'reply', data: { id: String(replyToMessageId) } });
    }
    if (chatType === 'group' && atUserId && String(atUserId) !== String(napcatStatus.selfQqId || '3076836236')) {
      segs.push({ type: 'at', data: { qq: String(atUserId) } });
      segs.push({ type: 'text', data: { text: ' ' } });
    }
    segs.push({ type: 'text', data: { text } });
    return segs;
  };

  const action = chatType === 'group' ? 'send_group_msg' : 'send_private_msg';
  const paramKey = chatType === 'group' ? 'group_id' : 'user_id';

  let sendRes: any;
  try {
    sendRes = await callOneBotApi(
      action,
      {
        [paramKey]: Number(targetId),
        message: buildSegments(true),
      },
      7000
    );
  } catch (err) {
    // 若因引用历史消息 ID 过期导致 NTQQ 拒绝，自动降级为纯 @ + 文本重试，确保消息 100% 发出
    if (replyToMessageId) {
      sendRes = await callOneBotApi(
        action,
        {
          [paramKey]: Number(targetId),
          message: buildSegments(false),
        },
        7000
      );
    } else {
      throw err;
    }
  }

  const sentMsgId = String(sendRes?.message_id || `local_${Date.now()}`);
  const formattedSent: FormattedChatMsg = {
    message_id: sentMsgId,
    user_id: String(napcatStatus.selfQqId || '3076836236'),
    sender_name: napcatStatus.selfNickname || '我',
    sender_role: 'member',
    is_self: true,
    timestamp: Date.now(),
    text,
    images: [],
    reply_to_id: replyToMessageId || null,
  };
  appendToChatCache(chatType, targetId, formattedSent);
  return { ...sendRes, formattedMsg: formattedSent };
}

export function getContactsSnapshot(): {
  groups: ContactItem[];
  friends: ContactItem[];
} {
  // 将 SQLite 已发现的活跃群合并进 groupListCache，确保哪怕刚重启或断线期间左侧群列表也永不为空
  try {
    const dbGroups = getDiscoveredGroups();
    for (const dg of dbGroups) {
      const existing = groupListCache.get(dg.group_id);
      if (!existing) {
        groupListCache.set(dg.group_id, {
          id: dg.group_id,
          name: sanitizeName(dg.group_name),
          type: 'group',
          avatar: `https://p.qlogo.cn/gh/${dg.group_id}/${dg.group_id}/100`,
          subTitle: `${dg.total_count}条记录`,
          lastActive: dg.last_timestamp || 0,
          lastPreview: '',
        });
      } else if ((dg.last_timestamp || 0) > (existing.lastActive || 0)) {
        existing.lastActive = dg.last_timestamp;
      }
    }
  } catch {}

  const groups = Array.from(groupListCache.values()).sort(
    (a, b) => (b.lastActive || 0) - (a.lastActive || 0)
  );
  const friends = Array.from(friendListCache.values()).sort(
    (a, b) => (b.lastActive || 0) - (a.lastActive || 0)
  );
  return { groups, friends };
}

export function handleIncomingOneBotPacket(
  rawStr: string,
  getConfig: () => AppConfig
): void {
  try {
    const data = JSON.parse(rawStr);

    // 处理 RPC 回调响应
    if (data.echo) {
      const pending = pendingEchoes.get(String(data.echo));
      if (pending) {
        clearTimeout(pending.timer);
        pendingEchoes.delete(String(data.echo));
        if (data.status === 'failed' || (data.retcode && data.retcode !== 0)) {
          pending.reject(new Error(data.wording || data.message || `OneBot retcode ${data.retcode}`));
        } else {
          pending.resolve(data.data);
        }
        return;
      }

      if (data.echo === 'init_login_info' && data.data) {
        napcatStatus.selfQqId = String(data.data.user_id || '');
        napcatStatus.selfNickname = sanitizeName(data.data.nickname || '');
        console.log(`[NapCat] 已识别当前登录账号: ${napcatStatus.selfNickname} (${napcatStatus.selfQqId})`);
      } else if (data.echo === 'init_group_list' && Array.isArray(data.data)) {
        for (const grp of data.data) {
          if (grp.group_id && grp.group_name) {
            const gid = String(grp.group_id);
            const gname = sanitizeName(grp.group_name);
            groupNameCache.set(gid, gname);
            const existing = groupListCache.get(gid);
            groupListCache.set(gid, {
              id: gid,
              name: gname,
              type: 'group',
              avatar: `https://p.qlogo.cn/gh/${gid}/${gid}/100`,
              subTitle: `${grp.member_count || ''}人`,
              lastActive: existing?.lastActive || 0,
              lastPreview: existing?.lastPreview || '',
            });
          }
        }
        console.log(`[NapCat] 已同步 ${groupNameCache.size} 个 QQ 群名称缓存`);
        // 群列表同步完成后，立即回溯补齐离线或未运行期间的新增群消息
        setTimeout(() => {
          backfillRecentGroupHistory(getConfig(), 65, 65).catch(() => {});
        }, 800);
      } else if (data.echo === 'init_friend_list' && Array.isArray(data.data)) {
        for (const fr of data.data) {
          if (fr.user_id) {
            const uid = String(fr.user_id);
            const fname = sanitizeName((fr.remark && fr.remark.trim()) || fr.nickname || uid);
            const existing = friendListCache.get(uid);
            friendListCache.set(uid, {
              id: uid,
              name: fname,
              type: 'private',
              avatar: `https://q1.qlogo.cn/g?b=qq&nk=${uid}&s=100`,
              subTitle: sanitizeName(fr.nickname !== fname ? fr.nickname : uid),
              lastActive: existing?.lastActive || 0,
              lastPreview: existing?.lastPreview || '',
            });
          }
        }
        console.log(`[NapCat] 已同步 ${friendListCache.size} 个 QQ 好友列表缓存（仅用于实时聊天回消息，不纳入日报）`);
      }
      return;
    }

    if (data.post_type === 'meta_event') {
      napcatStatus.lastHeartbeatTime = Date.now();
      if (data.self_id && !napcatStatus.selfQqId) {
        napcatStatus.selfQqId = String(data.self_id);
      }
      return;
    }

    if (data.post_type === 'message' || data.post_type === 'message_sent') {
      const event = data as OneBotMessageEvent;
      const nowMs = event.time ? event.time * 1000 : Date.now();
      const previewMsg = parseRawOneBotMsgForChatView(event);

      // 更新实时会话列表预览（群聊与好友私聊均可在实时聊天台查看和回复）
      if (event.message_type === 'group' && event.group_id) {
        const gid = String(event.group_id);
        const cachedName = sanitizeName(groupNameCache.get(gid) || event.group_name || `群聊(${gid})`);
        event.group_name = cachedName;
        appendToChatCache('group', gid, previewMsg);
        const gItem = groupListCache.get(gid);
        groupListCache.set(gid, {
          id: gid,
          name: cachedName,
          type: 'group',
          avatar: `https://p.qlogo.cn/gh/${gid}/${gid}/100`,
          subTitle: gItem?.subTitle || '',
          lastActive: nowMs,
          lastPreview: `${previewMsg.sender_name}: ${previewMsg.text || '[图片/媒体]'}`,
        });
      } else if (event.message_type === 'private') {
        const peerId = String(
          event.target_id && String(event.user_id) === String(event.self_id)
            ? event.target_id
            : event.user_id
        );
        appendToChatCache('private', peerId, previewMsg);
        const fItem = friendListCache.get(peerId);
        const fName = sanitizeName(fItem?.name || previewMsg.sender_name || peerId);
        friendListCache.set(peerId, {
          id: peerId,
          name: fName,
          type: 'private',
          avatar: `https://q1.qlogo.cn/g?b=qq&nk=${peerId}&s=100`,
          subTitle: peerId,
          lastActive: nowMs,
          lastPreview: previewMsg.text || '[图片/媒体]',
        });
      }

      // AI 日报与 SQLite 数据库严格只收录群聊消息（parseAndFilterOneBotEvent 内部已拦截私聊）
      event.post_type = 'message';
      const config = getConfig();
      const parsed = parseAndFilterOneBotEvent(event, config);
      if (parsed) {
        const inserted = insertMessage(parsed);
        if (inserted) {
          napcatStatus.receivedCountSession += 1;
          napcatStatus.lastMessageTime = Date.now();
          const tag = parsed.filter_status === 'kept' ? '✅保留' : `🗑️过滤(${parsed.filter_reason})`;
          const hp = parsed.is_high_priority ? ` 🔥[${parsed.priority_reason}]` : '';
          console.log(`[QQ消息] [${parsed.group_name}] ${parsed.sender_name}: ${parsed.clean_text.slice(0, 50)} -> ${tag}${hp}`);

          if (/\[图片:\s*https?:\/\/[^\]\s]+\]/.test(parsed.clean_text)) {
            enrichMessageWithAiVision(parsed, config).catch(() => {});
          }

          if (parsed.is_high_priority === 1) {
            pushUrgentMessageToMobile(parsed, config).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.error('[NapCat] 解析数据包出错:', err);
  }
}

function requestInitialMetadata(ws: WebSocket): void {
  try {
    ws.send(JSON.stringify({ action: 'get_login_info', params: {}, echo: 'init_login_info' }));
    ws.send(JSON.stringify({ action: 'get_group_list', params: {}, echo: 'init_group_list' }));
    ws.send(JSON.stringify({ action: 'get_friend_list', params: {}, echo: 'init_friend_list' }));
  } catch {}
}

export function attachReverseWebSocketClient(ws: WebSocket, getConfig: () => AppConfig): void {
  console.log('[NapCat] 收到来自 NapCat 的反向 WebSocket 连接！');
  reverseWs = ws;
  napcatStatus.connected = true;
  napcatStatus.mode = 'reverse_ws';
  napcatStatus.lastError = null;
  requestInitialMetadata(ws);

  ws.on('message', (buf) => {
    handleIncomingOneBotPacket(buf.toString('utf-8'), getConfig);
  });

  ws.on('close', () => {
    if (reverseWs === ws) reverseWs = null;
    if (!getActiveSocket()) {
      napcatStatus.connected = false;
      napcatStatus.mode = 'disconnected';
    }
  });
}

export function startForwardNapCatClient(
  getConfig: () => AppConfig,
  forceReconnect = false
): void {
  savedGetConfig = getConfig;
  if (
    !forceReconnect &&
    forwardWs &&
    (forwardWs.readyState === WebSocket.OPEN || forwardWs.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  if (forwardWs) {
    try {
      forwardWs.removeAllListeners();
      forwardWs.close();
    } catch {}
    forwardWs = null;
  }

  const config = getConfig();
  const wsUrl = config.napcat.wsUrl?.trim();
  if (!wsUrl) return;

  const headers: Record<string, string> = {};
  if (config.napcat.accessToken) {
    headers['Authorization'] = `Bearer ${config.napcat.accessToken}`;
  }

  try {
    const ws = new WebSocket(wsUrl, { headers });
    forwardWs = ws;

    ws.on('open', () => {
      console.log(`[NapCat] 已成功连接到正向 WebSocket: ${wsUrl}`);
      napcatStatus.connected = true;
      napcatStatus.mode = 'forward_ws';
      napcatStatus.lastError = null;
      requestInitialMetadata(ws);

      if (keepAliveTimer) clearInterval(keepAliveTimer);
      keepAliveTimer = setInterval(() => {
        if (forwardWs && forwardWs.readyState === WebSocket.OPEN) {
          try {
            forwardWs.ping();
          } catch {}
        }
      }, 20000);
    });

    ws.on('message', (buf) => {
      handleIncomingOneBotPacket(buf.toString('utf-8'), getConfig);
    });

    ws.on('error', (err) => {
      napcatStatus.lastError = `连接 ${wsUrl} 尚未就绪 (${err.message})`;
    });

    ws.on('close', () => {
      if (forwardWs === ws) forwardWs = null;
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      if (!getActiveSocket()) {
        napcatStatus.connected = false;
        napcatStatus.mode = 'disconnected';
      }
      reconnectTimer = setTimeout(() => startForwardNapCatClient(getConfig), 2000);
    });
  } catch (err: any) {
    napcatStatus.lastError = err?.message || '连接异常';
    reconnectTimer = setTimeout(() => startForwardNapCatClient(getConfig), 2000);
  }
}
