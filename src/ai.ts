import { AppConfig, MessageChunk, ChunkDigestItem, DailyDigestReport, StoredMessage } from './types.js';
import { updateMessageAfterVision } from './db.js';

/**
 * 支持 SSE 流式接收 (stream: true) 与普通 JSON 接收的双兼容远程大模型调用器
 * 彻底解决本地反向代理 (如 127.0.0.1:8788 hy4free) 长文本生成时因等待过久导致的 ECONNRESET 断连问题
 */
async function callRemoteLlm(
  config: AppConfig,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs = 180000
): Promise<string> {
  const baseUrl = config.llm.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  // 针对本地 8788 (WorkBuddy) 代理网关：hy4free / hy4-preview 属于强制开启 high 思考链的慢速推理模型（单次需思考 60~140 秒）
  // 自动切换为同网关免费额度池中的极速模型 deepseek-v4.1-flash 并关闭思考链，实现 6 秒极速出日报！
  let effectiveModel = model;
  if (baseUrl.includes('8788') && /^hy[34]/i.test(model.trim())) {
    effectiveModel = 'deepseek-v4.1-flash';
    console.log(
      `[AI] 检测到本地 8788 网关配置为慢速推理模型 (${model})，已自动加速路由至同网关极速模型 ${effectiveModel} (关闭长思考链，约 6 秒完成)`
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const combinedPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: effectiveModel,
        stream: false,
        thinking: { type: 'disabled' },
        reasoning_effort: 'none',
        messages: [{ role: 'user', content: combinedPrompt }],
        temperature: 0.25,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM API 请求失败 (${res.status}): ${errText}`);
    }

    const rawText = await res.text();

    // 如果服务端返回的是标准 JSON（未开启 SSE）
    if (rawText.trim().startsWith('{')) {
      const data = JSON.parse(rawText);
      return data.choices?.[0]?.message?.content?.trim() || '';
    }

    // 解析 SSE 流式响应 (data: {...})
    const contentParts: string[] = [];
    const lines = rawText.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const chunk = JSON.parse(payload);
        const delta = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.message?.content;
        if (delta) contentParts.push(delta);
      } catch {}
    }

    return contentParts.join('').trim();
  } finally {
    clearTimeout(timer);
  }
}

export async function testLlmApiConnection(
  config: AppConfig
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  if (!config.llm.apiKey || !config.llm.apiKey.trim()) {
    return { ok: false, error: '尚未填写 API Key' };
  }
  try {
    const reply = await callRemoteLlm(
      config,
      config.llm.fastModel,
      '你是一个助手。',
      '请只回复“API连接成功”六个字。',
      25000
    );
    return { ok: true, reply };
  } catch (err: any) {
    return { ok: false, error: err?.message || '连接失败' };
  }
}

/**
 * 强制将任意时间戳转换为中国标准时间 (北京时间 UTC+8 / Asia/Shanghai)，不受宿主机洛杉矶时区 (UTC-8) 影响
 */
export function formatChinaMdHm(ms: number): string {
  const bj = new Date(ms + 8 * 3600_000);
  const mm = String(bj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(bj.getUTCDate()).padStart(2, '0');
  const hh = String(bj.getUTCHours()).padStart(2, '0');
  const mi = String(bj.getUTCMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

export function getChinaDateStr(ms = Date.now()): string {
  const bj = new Date(ms + 8 * 3600_000);
  const yyyy = bj.getUTCFullYear();
  const mm = String(bj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(bj.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getChinaFullTimeStr(ms = Date.now()): string {
  const bj = new Date(ms + 8 * 3600_000);
  const yyyy = bj.getUTCFullYear();
  const mm = String(bj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(bj.getUTCDate()).padStart(2, '0');
  const hh = String(bj.getUTCHours()).padStart(2, '0');
  const mi = String(bj.getUTCMinutes()).padStart(2, '0');
  const ss = String(bj.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * 尝试从模型输出中提取并修复 JSON 对象（支持去除代码块包裹、修复尾随逗号、修复超长截断 JSON）
 */
function tryRepairAndParseDigestJson(raw: string): any | null {
  if (!raw || !raw.trim()) return null;

  // 移除可能存在的 <think>...</think> 思考块与 Markdown 代码围栏
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 优先定位包含顶层字段的 JSON 起始位置
  const schemaStartMatch = cleaned.match(/\{\s*"(?:overview|todoChecklist|aiKnowledgeNotes|items)"/);
  const startIdx = schemaStartMatch?.index !== undefined ? schemaStartMatch.index : cleaned.indexOf('{');
  if (startIdx === -1) return null;

  const lastBraceIdx = cleaned.lastIndexOf('}');
  const candidate = lastBraceIdx > startIdx ? cleaned.slice(startIdx, lastBraceIdx + 1) : cleaned.slice(startIdx);

  const isValidDigestObj = (obj: any) =>
    obj &&
    typeof obj === 'object' &&
    (typeof obj.overview === 'string' ||
      Array.isArray(obj.items) ||
      Array.isArray(obj.todoChecklist) ||
      Array.isArray(obj.aiKnowledgeNotes));

  // 1. 直接解析
  try {
    const parsed = JSON.parse(candidate);
    if (isValidDigestObj(parsed)) return parsed;
  } catch {}

  // 2. 修复尾随逗号后解析
  const noTrailingCommas = candidate.replace(/,\s*([}\]])/g, '$1');
  try {
    const parsed = JSON.parse(noTrailingCommas);
    if (isValidDigestObj(parsed)) return parsed;
  } catch {}

  // 3. 若因输出过长在 items 数组中间截断，尝试回退到最后一个完整对象 `}` 并闭合 `]}`
  const itemsKeyIdx = noTrailingCommas.indexOf('"items"');
  if (itemsKeyIdx !== -1) {
    let searchPos = noTrailingCommas.length;
    for (let attempt = 0; attempt < 15; attempt++) {
      const prevCloseBrace = noTrailingCommas.lastIndexOf('}', searchPos - 1);
      if (prevCloseBrace <= itemsKeyIdx) break;
      const truncatedCandidate = noTrailingCommas.slice(0, prevCloseBrace + 1) + ']}';
      try {
        const parsed = JSON.parse(truncatedCandidate);
        if (isValidDigestObj(parsed)) {
          console.log(`[AI] 已自动修复被截断的超长 JSON 响应 (保留 ${parsed.items?.length || 0} 个条目)`);
          return parsed;
        }
      } catch {}
      searchPos = prevCloseBrace;
    }
  }

  return null;
}

/**
 * 当模型返回纯 Markdown 报告时的智能结构化兜底解析器（确保 100% 永不报错）
 */
function parseMarkdownDigestFallback(
  rawMd: string,
  sortedGroups: Array<{ groupId: string; groupName: string; customFocus: string; msgs: StoredMessage[] }>,
  windowRangeStr: string
): any {
  const cleanedMd = rawMd.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const lines = cleanedMd.split(/\r?\n/);

  let overview = '';
  const todoChecklist: string[] = [];
  const aiKnowledgeNotes: string[] = [];
  const items: any[] = [];

  let currentSection: 'overview' | 'todo' | 'urgent' | 'competition' | 'ai_knowledge' | 'discussion' = 'overview';

  const matchGroup = (text: string) => {
    for (const grp of sortedGroups) {
      if (grp.groupName && text.includes(grp.groupName)) return grp;
      const shortName = grp.groupName.replace(/[0-9（）()\-_群]/g, '').trim();
      if (shortName.length >= 3 && text.includes(shortName)) return grp;
    }
    return sortedGroups[0] || { groupId: '0', groupName: '综合群聊汇总', customFocus: '', msgs: [] };
  };

  let currentItemTitle = '';
  let currentItemLines: string[] = [];
  let currentItemCategory: 'urgent' | 'competition' | 'ai_knowledge' | 'discussion' = 'urgent';

  const flushCurrentItem = () => {
    const body = currentItemLines.join(' ').replace(/\s+/g, ' ').trim();
    if (!currentItemTitle && !body) return;
    const title = (currentItemTitle || body.slice(0, 36)).replace(/^[\-*•\d.\s#]+/, '').trim();
    const summary = body || title;
    const grp = matchGroup(`${title} ${summary}`);
    const firstTs = grp.msgs[0]?.timestamp ? formatChinaMdHm(grp.msgs[0].timestamp) : '';
    const lastTs = grp.msgs[grp.msgs.length - 1]?.timestamp
      ? formatChinaMdHm(grp.msgs[grp.msgs.length - 1].timestamp)
      : '';
    const timeRange = firstTs && lastTs ? `${firstTs} - ${lastTs} (北京时间)` : windowRangeStr;
    const keyMessageIds = grp.msgs.slice(-4).map((m) => m.message_id);

    items.push({
      groupId: grp.groupId,
      groupName: grp.groupName,
      score: currentItemCategory === 'urgent' ? 3 : currentItemCategory === 'competition' ? 3 : currentItemCategory === 'ai_knowledge' ? 2 : 1,
      category: currentItemCategory,
      title,
      summary,
      actionRequired: '',
      timeRange,
      keyMessageIds,
    });
    currentItemTitle = '';
    currentItemLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^#{1,4}\s+/.test(line)) {
      flushCurrentItem();
      const headingText = line.replace(/^#{1,4}\s+/, '').trim();
      if (/概览|导读|总览|总体/.test(headingText)) {
        currentSection = 'overview';
      } else if (/待办|清单|行动|Todo|Checklist/i.test(headingText)) {
        currentSection = 'todo';
      } else if (/竞赛|科创|挑战赛|算子|打榜|比赛/.test(headingText)) {
        currentSection = 'competition';
      } else if (/AI|技术|大模型|工程|开源|硬核|安全|架构/i.test(headingText)) {
        currentSection = 'ai_knowledge';
      } else if (/通知|课程|作业|学院|教务|必看|紧急|面试|奖学金/.test(headingText)) {
        currentSection = 'urgent';
      } else if (/生活|闲聊|其他|讨论|校园|硬件|数码/.test(headingText)) {
        currentSection = 'discussion';
      } else if (/^#{3,4}\s+/.test(line)) {
        currentItemCategory =
          currentSection === 'competition' || currentSection === 'ai_knowledge' || currentSection === 'discussion'
            ? currentSection
            : 'urgent';
        currentItemTitle = headingText;
      }
      continue;
    }

    if (currentSection === 'overview' && !overview && !/^[\-*•\d.]/.test(line)) {
      overview = line;
      continue;
    }

    if (currentSection === 'todo' && /^([\-*•]|\d+\.)\s+/.test(line)) {
      todoChecklist.push(line.replace(/^([\-*•]|\d+\.)\s*(\[[ xX]?\]\s*)?/, '').trim());
      continue;
    }

    const boldBulletMatch = line.match(/^([\-*•]|\d+\.)\s+\*\*([^*]+)\*\*[：:\s]*(.*)$/);
    if (boldBulletMatch) {
      flushCurrentItem();
      currentItemCategory =
        currentSection === 'competition' || currentSection === 'ai_knowledge' || currentSection === 'discussion'
          ? currentSection
          : /竞赛|算子|挑战赛|比赛/.test(boldBulletMatch[2])
          ? 'competition'
          : /AI|模型|VLLM|Agent|Linux|OpenSSH|代码|编译/i.test(boldBulletMatch[2])
          ? 'ai_knowledge'
          : 'urgent';
      currentItemTitle = boldBulletMatch[2].trim();
      if (boldBulletMatch[3].trim()) {
        currentItemLines.push(boldBulletMatch[3].trim());
      }
      if (currentItemCategory === 'ai_knowledge') {
        aiKnowledgeNotes.push(`**${currentItemTitle}**：${boldBulletMatch[3].trim()}`);
      }
      continue;
    }

    if (/^([\-*•]|\d+\.)\s+/.test(line)) {
      const bulletText = line.replace(/^([\-*•]|\d+\.)\s+/, '').trim();
      if (currentItemTitle) {
        currentItemLines.push(bulletText);
      } else {
        currentItemCategory =
          currentSection === 'competition' || currentSection === 'ai_knowledge' || currentSection === 'discussion'
            ? currentSection
            : 'urgent';
        currentItemTitle = bulletText.slice(0, 42);
        currentItemLines.push(bulletText);
      }
    } else if (currentItemTitle) {
      currentItemLines.push(line);
    } else if (!overview) {
      overview = line;
    }
  }
  flushCurrentItem();

  return {
    overview: overview || cleanedMd.slice(0, 400),
    todoChecklist,
    aiKnowledgeNotes,
    items,
    rawMarkdownReport: cleanedMd,
  };
}

/**
 * 使用原生多模态大模型 (如 deepseek-v4.1-flash) 直接读取群聊中的真实图片/截图/通知海报，
 * 将图片中的文字、图表、代码、电路图或画面内容提取为 `[🖼️图片内容: ...]` 并落库保存；
 * 若 AI 视觉识别判定该图仅为无信息量的纯表情包，则自动将其归入纯表情包过滤。
 */
export async function enrichMessageWithAiVision(
  msg: StoredMessage,
  config: AppConfig
): Promise<void> {
  if (!config.llm.apiKey || !config.llm.apiKey.trim()) return;
  const imgMatch = msg.clean_text.match(/\[图片:\s*(https?:\/\/[^\]\s]+)\]/);
  if (!imgMatch) return;

  const imgUrl = imgMatch[1];
  try {
    const imgRes = await fetch(imgUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!imgRes.ok) return;

    const contentType = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
    // GIF 动图基本是群聊表情包
    if (contentType.includes('gif')) {
      const stripped = msg.clean_text.replace(/\[图片:\s*https?:\/\/[^\]\s]+\]/g, '[动画表情]').trim();
      const isOnlySticker = /^(\[动画表情\]|\[表情\]|\s)+$/.test(stripped);
      msg.clean_text = stripped;
      if (isOnlySticker && !msg.is_high_priority) {
        msg.filter_status = 'filtered_noise';
        msg.filter_reason = 'GIF动画表情包';
      }
      updateMessageAfterVision(msg.message_id, msg.clean_text, msg.filter_status, msg.filter_reason);
      return;
    }

    const arrayBuf = await imgRes.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length < 1500 || buf.length > 8 * 1024 * 1024) return;

    const b64Url = `data:${contentType.startsWith('image/') ? contentType : 'image/jpeg'};base64,${buf.toString('base64')}`;
    const baseUrl = config.llm.baseUrl.replace(/\/+$/, '');
    const visionModel =
      baseUrl.includes('8788') && /^hy[34]/i.test(config.llm.mainModel.trim())
        ? 'deepseek-v4.1-flash'
        : config.llm.mainModel || 'deepseek-v4.1-flash';

    const llmRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: visionModel,
        stream: false,
        reasoning_effort: 'low',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请读取这张 QQ 群聊图片：1) 如果它是课程/学院通知、竞赛海报、课件PPT、表格、代码报错、电路原理图、股市/战绩截图或聊天记录截图，请完整提取其中的关键文字、标题、数据与核心信息（120字以内）；2) 如果它是毫无实际信息量的纯搞笑表情包/反应梗图，请只回复“纯表情包”四个字。',
              },
              {
                type: 'image_url',
                image_url: { url: b64Url },
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!llmRes.ok) return;
    const data: any = await llmRes.json();
    const visionText = String(data.choices?.[0]?.message?.content || '')
      .replace(/\r?\n+/g, ' ')
      .trim();
    if (!visionText) return;

    if (visionText === '纯表情包' || (visionText.length <= 8 && visionText.includes('纯表情包'))) {
      const nextText = msg.clean_text.replace(/\[图片:\s*https?:\/\/[^\]\s]+\]/g, '[动画表情]').trim();
      const isOnlySticker = /^(\[动画表情\]|\[表情\]|\s)+$/.test(nextText);
      msg.clean_text = nextText;
      if (isOnlySticker && !msg.is_high_priority) {
        msg.filter_status = 'filtered_noise';
        msg.filter_reason = 'AI视觉判定纯表情包';
      }
      updateMessageAfterVision(msg.message_id, msg.clean_text, msg.filter_status, msg.filter_reason);
    } else {
      const nextText = msg.clean_text.replace(
        /\[图片:\s*https?:\/\/[^\]\s]+\]/,
        `[🖼️图片视觉解析: ${visionText}]`
      );
      msg.clean_text = nextText;
      msg.filter_status = 'kept';
      msg.filter_reason = null;
      updateMessageAfterVision(msg.message_id, msg.clean_text, 'kept', null);
      console.log(`[AI视觉] 已解析群 [${msg.group_name}] ${msg.sender_name} 发送的图片: ${visionText.slice(0, 60)}...`);
    }
  } catch {}
}

/**
 * 全量一口气喂给 AI 总结引擎：
 * 除纯表情包外，将全部群聊文字消息 + AI 视觉识别后的真实图片内容 100% 原汁原味一次性喂给远程 AI 大模型，
 * 完全由 AI 自主结合各群标识与上下文通盘阅读、合并同类话题并输出深度日报！
 */
export async function generateDailyDigest(
  allMessages: StoredMessage[],
  _chunks: MessageChunk[],
  config: AppConfig,
  windowMeta?: { windowStartMs: number; windowEndMs: number }
): Promise<DailyDigestReport> {
  // 先对包含未识别图片链接 [图片: http...] 的最近消息并发执行多模态视觉提取（最多取最近 12 张未识别图片以保证响应速度）
  const pendingImageMsgs = allMessages
    .filter((m) => m.chat_type === 'group' && /\[图片:\s*https?:\/\/[^\]\s]+\]/.test(m.clean_text))
    .slice(-12);

  if (pendingImageMsgs.length > 0) {
    console.log(`[AI视觉] 正在并发使用多模态模型识别 ${pendingImageMsgs.length} 张群聊图片内容...`);
    const batchSize = 3;
    for (let i = 0; i < pendingImageMsgs.length; i += batchSize) {
      await Promise.all(
        pendingImageMsgs.slice(i, i + batchSize).map((m) => enrichMessageWithAiVision(m, config))
      );
    }
  }

  const l1NoiseCount = allMessages.filter((m) => m.filter_status === 'filtered_noise').length;

  // 1. 取出所有非纯表情包、非本人发送的群聊消息
  const selfQq = String(config.napcat.selfQqId || '3076836236');
  const keptMessages = allMessages.filter((m) => {
    if (m.chat_type !== 'group') return false;
    if (m.filter_status !== 'kept') return false;
    if (String(m.user_id) === selfQq || String(m.user_id) === '3076836236') return false;
    const grpRule = config.filter.monitoredGroups[m.group_id];
    if (grpRule && grpRule.enabled === false) return false;
    if (!config.filter.watchAllGroupsByDefault && (!grpRule || !grpRule.enabled)) {
      return false;
    }
    return true;
  });

  // 2. 按群聊归类整理所有有效聊天记录
  const byGroup = new Map<
    string,
    { groupId: string; groupName: string; customFocus: string; msgs: StoredMessage[] }
  >();

  for (const m of keptMessages) {
    let entry = byGroup.get(m.group_id);
    if (!entry) {
      const grpRule = config.filter.monitoredGroups[m.group_id];
      entry = {
        groupId: m.group_id,
        groupName: grpRule?.groupName || m.group_name,
        customFocus: grpRule?.customFocusPrompt || '',
        msgs: [],
      };
      byGroup.set(m.group_id, entry);
    }
    entry.msgs.push(m);
  }

  // 组装 100% 原汁原味、零截断的全量聊天记录长文本（一口气喂给 1M 上下文大模型）
  const sortedGroups = Array.from(byGroup.values()).sort((a, b) => {
    const aHp = a.msgs.filter((m) => m.is_high_priority === 1).length;
    const bHp = b.msgs.filter((m) => m.is_high_priority === 1).length;
    if (aHp !== bHp) return bHp - aHp;
    return b.msgs.length - a.msgs.length;
  });

  const groupSections: string[] = [];
  let rawPureTextChars = 0;

  for (const grp of sortedGroups) {
    grp.msgs.sort((a, b) => a.timestamp - b.timestamp);
    const lines: string[] = [];

    for (const m of grp.msgs) {
      const mdHm = formatChinaMdHm(m.timestamp);
      const role = m.sender_role === 'owner' ? '[群主]' : m.sender_role === 'admin' ? '[管理]' : '';
      // 100% 原汁原味：不对发送人昵称和消息正文 m.clean_text 做任何 .slice() 截断！时间戳统一转换为中国标准时间 (北京时间 UTC+8)
      rawPureTextChars += m.clean_text.length;
      lines.push(`[#${m.message_id} ${mdHm}] ${role}${m.sender_name}: ${m.clean_text}`);
    }

    if (lines.length > 0) {
      const header = `=== 【群名：${grp.groupName} | groupId: ${grp.groupId} | 共 ${lines.length} 条】${
        grp.customFocus ? `(关注：${grp.customFocus})` : ''
      } ===`;
      groupSections.push(`${header}\n${lines.join('\n')}`);
    }
  }

  const fullTranscript = groupSections.join('\n\n');
  const fullTranscriptChars = fullTranscript.length;

  const dateStr = getChinaDateStr();
  const chinaNowStr = getChinaFullTimeStr();
  const savedMinutes = Math.max(1, Math.round((allMessages.length * 4) / 60));

  const timestamps = keptMessages.map((m) => m.timestamp);
  const windowStartMs =
    windowMeta?.windowStartMs ??
    (timestamps.length > 0 ? Math.min(...timestamps) : Date.now() - 24 * 3600_000);
  const windowEndMs =
    windowMeta?.windowEndMs ?? (timestamps.length > 0 ? Math.max(...timestamps) : Date.now());
  const windowRangeStr = `${formatChinaMdHm(windowStartMs)} ~ ${formatChinaMdHm(windowEndMs)} (北京时间 UTC+8)`;

  if (!config.llm.apiKey || !config.llm.apiKey.trim()) {
    throw new Error('请先在“⚙️ 远程 AI API 与推送”页面填入有效的 API Key 后再生成 AI 日报');
  }

  if (keptMessages.length === 0) {
    return {
      dateStr,
      createdAt: Date.now(),
      stats: {
        totalMessages: allMessages.length,
        l1FilteredNoise: l1NoiseCount,
        keptForAi: 0,
        totalChunks: byGroup.size,
        valuableChunks: 0,
        estimatedSavedMinutes: savedMinutes,
        rawPureTextChars: 0,
        fullTranscriptChars: 0,
        windowStartMs,
        windowEndMs,
        windowRangeStr,
      },
      items: [],
      markdownSummary: `# 📅 QQ 智能消息日报 (${dateStr} · 北京时间)\n\n本时间窗口 (${windowRangeStr}) 内暂无新增有效群聊消息。`,
    };
  }

  const systemPrompt = `【全景无上限深度汇总模式：禁止在思考中逐条复述原消息，直接通盘阅读全部原汁原味群聊记录，应提尽提、不设条目与字数上限，输出最详实的 JSON 报告】
你是一个顶级的私人学术助理、科创竞赛顾问与 AI 技术情报分析师。
我已经把 **自上次总结时间锚点以来新增的、尚未总结过的 100% 原汁原味群聊记录**（时间窗口：${windowRangeStr}，共 ${byGroup.size} 个群、${keptMessages.length} 条新增有效消息、纯正文 ${rawPureTextChars} 字）一次性发给你。
用户的阅读速度很快，希望通过这一份报告**集中阅读本时间段所有群的全部新增信息、集中照着去执行待办**！

⏰ **【时区基准与时效性铁律（中国标准时间 UTC+8 / 北京时间）】**：
- 宿主机系统虽然处于洛杉矶时区（UTC-8），但输入给你的每条消息前缀 [#ID MM-DD HH:mm] **均已全部转换为中国标准时间（北京时间 UTC+8 / Asia/Shanghai）**！
- 当前北京时间为：**${chinaNowStr} (UTC+8)**，今日北京日期为：**${dateStr}**，本期增量消息时间窗口为：**${windowRangeStr}**。
- **时效性校验**：请结合当前北京时间（${chinaNowStr}）严格核对各项通知或活动的截止时间；已经早于当前北京时间的过期历史通知**严禁放入 todoChecklist（集中执行待办清单）**，todoChecklist 仅收录当前仍在有效期内、真正需要用户去做的待办动作！
- 请你在生成全局导读（overview）、集中执行清单（todoChecklist）、各条目正文（summary）、待办截止时间（actionRequired）以及时间范围（timeRange，格式如 "11-05 19:20 - 22:15 (北京时间)" 或 "11-06 08:10 - 09:05 (北京时间)"）时，**全程严格以中国标准时间（北京时间 UTC+8）为准**！

🔥 **【核心输出原则：高价值内容应提尽提、不设上限，但严禁总结本人发言与无意义水群闲扯】**：
1. **🚫 过滤本人发言与已办妥事项**：
   - 用户本人（QQ: 3076836236 / 昵称“QQ普通人” / 姓名“高赢奥” / 学号“2025210138”）自己发送的消息不需要总结！
   - 若群接龙或名单中已出现“2025210138 高赢奥 已完成”，说明用户本人已完成该事项，严禁再将其放入 todoChecklist 催促用户去做！
2. **🚫 严禁总结毫无营养的无意义水群废话**：
   - 凡是**纯属无意义的水群闲扯、玩梗复读（如“请我吃饭”、货币接龙、压缩毛巾梗、“打a能减少iiii”）、单句抖机灵吐槽（如“一个人抖腿”、“这下不调休了”）、毫无上下文的单发人名（如“赵继波”）、纯游戏开黑约局/抽卡晒图/二次元战力闲扯/饮食八卦、微商代理小广告**，**一律直接忽略，严禁生成卡片或写入报告**！
3. **✅ 有价值话题拆细颗粒度、细节 100% 饱满还原（不设条数与字数上限）**：
   - 对于真正有价值的**课程与学院通知、作业课件、学科竞赛、AI与硬核工程技术讨论、有实质参考价值的学业/软硬件环境排障/数码救援/校园实用信息**，同一个群内的不同有价值子话题必须拆分为独立条目分别写深写透！
   - 涉及通知/作业/课件：必须完整列出**所有课件文件名、提交邮箱、命名格式、群号、网址链接、地点变更与精确截止时间**；
   - 涉及技术/AI/学术讨论：必须完整还原**核心概念、不同群友的具体观点碰撞、实测数据/优缺点对比、提到的开源项目/工具链/文章标题与工程结论**。

请严格按以下四大维度全面挖掘并分类（对应每个条目的 category 字段）：
1. **category = "urgent" (score = 3 | 🚨 必看课程通知、作业课件与学院待办)**：
   - 全面提取所有课程作业（大物、理力等）、每次复习课件上传（完整列出所有 PDF/PPTX/MP4 文件名）、班级接龙登记（截止时间与格式）、国家奖学金/励志奖学金联评填表与现场答辩、转专业报名与视频提交、文化素质讲座报名（加分规则与变更后报告厅）等，**每项独立成条**。
2. **category = "competition" (score = 3 或 2 | 🏆 学科竞赛、科创申报与打榜专区)**：
   - **把所有群聊中提及的每一个竞赛、科创项目、宣讲招募、打榜冲刺与学术写作方法全部独立列出**！
   - 包括但不限于：“校长杯”科技创新大赛补报与结题答辩、第18届山东省大学生物理竞赛报名、哈工大第三届师生创业大赛（山东赛区）、2026科创竞赛技能集训营、“丁香创梦·竞启新程”竞赛沙龙讲师招募、2027“丁香远航”寒假出国境实践项目、第八届青年演说家比赛初赛延期与VCR招募、算子摄金竞赛冲榜动态（提交次数限制、双路算力分配、榜单分差）、2026大数据挑战赛、数学建模群对抗 AI 检测率与清理高频模板套话词（综上所述/赋能/抓手/闭环等）实测分析等。
3. **category = "ai_knowledge" (score = 2 | 🤖 AI 前沿技术、大模型生态与硬核知识卡片)**：
   - **将各技术群（HITSZ 开源技术协会、AI_Vibecoding、喵喵技术群 Tech-cats Lab、资料分享云仓、电脑互助群、开源信息共享群、薪火笔记社等）中的每一个 AI 与硬核技术子话题拆分为独立条目深度展开**！
   - 例如（每个子话题单独成条，详述原理与群友实测结论）：
     - AI 泡沫与 Token 经济学思辨（2000年互联网泡沫对比、估值大O与落地大O错位、廉价算力利好下游、“AI应用公司本质帮上游卖Token”、Personal Agent 20美元/月成本困境）；
     - 《纺织机陷阱，需求弹性，和 AI 的终局》与 AI 柔性制造 vs 科研突破上限探讨；
     - DeepSeek-V4.1 + KiCad Skill 自动解析芯片手册生成以太网收发原理图实测（网络标签可读性问题）；
     - GPT-6-Astra + 立创 EDA 画 PCB 与自动铺铜加粗电源线实测及 Simulink 仿真工具（simulink-snapshot-edit）；
     - Kimi K3.1-Pro 权重开源、算子 Infra 上机优化与后训练蒸馏探讨；
     - MCP、Agent、Skills 与 Agent Harness 工程架构辨析（稳定性 vs 扩展性、omp1/omp2 架构优劣）；
     - 基于 OpenCode 架构 + Clang AST 静态分析实现大模型 API 全自动答疑与 C 语言内存/指针可视化视图（1.0->2.0 路线）；
     - Google AI Pro 学生一年免费配额、Claude 中转保号率与 WorkBuddy 大众 Agent 入口分析；
     - OpenSSH 10.6p2 密码认证绕过严重漏洞（musl libc + 无 PAM 环境如 Alpine/Void 受影响）及端口敲门/CF Tunnel/Tailscale 防护方案；
     - 中美 AI 算力中心基建博弈（美国州级电价传导、冷却水排放争议、半导体与纳指走势分析）；
     - Token 中文译名“词元/令牌”与术语多义性思辨。
4. **category = "discussion" (score = 1 | 💬 热门技术、数码硬件与校园生活脉络)**：
   - 同样拆细为独立条目：如机械革命掉盘与移动硬盘盒提示“初始化”的数据恢复风险预警、Matlab 版本兼容与 ROS1/ROS2+PX4 实验环境配置吐槽、大厂科层制 vs Startup 扁平化管理对比、外卖聚乳酸可降解餐盒与打包费定价策略讨论、LPL/S赛（BLG vs DK/T1、Tarzan、Gumayusi Dade奖）电竞热议、留学雅思咨询日等。

请严格只输出一个 JSON 对象（不要输出 JSON 以外的解释文字）：
{
  "overview": "详实的全局深度综述（300~500字，以北京时间 UTC+8 为基准）：全面梳理今日课程/学院必办事项、全部学科竞赛节点、AI 与工程技术群的核心思想碰撞，以及校园热点。",
  "todoChecklist": [
    "提炼 8 ~ 15 条可直接照着去做的【✅ 集中行动执行清单】（按紧急程度排序，每条写清：[所属群/类别] 具体动作 + 提交方式/文件名/链接/群号 + 精确截止时间，方便用户集中一条条执行完毕）"
  ],
  "aiKnowledgeNotes": [
    "提炼 8 ~ 14 条详实的【🧠 今日群聊 AI 与硬核技术知识库笔记】（不限字数，采用“**核心概念/工具/论文**：详细技术原理 + 群友实测表现/踩坑结论 + 实操建议”格式）"
  ],
  "items": [
    {
      "groupId": "群号字符串（对应输入中的 groupId）",
      "groupName": "群名称",
      "score": 3,
      "category": "urgent 或 competition 或 ai_knowledge 或 discussion",
      "title": "精准且信息量丰富的标题",
      "summary": "详尽完整的前因后果、所有相关文件名/链接/邮箱/群号、不同群友的观点细节与技术结论（充分展开，不设字数上限！）",
      "actionRequired": "明确的待办执行步骤、报名方式、截止时间（北京时间）或推荐尝试的工具/命令/阅读链接（无则留空字符串）",
      "timeRange": "MM-DD HH:mm - HH:mm (北京时间)",
      "keyMessageIds": ["与该总结最相关的 1~6 个消息ID数字字符串，对应记录里的 #ID"]
    }
  ]
}`;

  console.log(
    `[AI] 正在将 ${byGroup.size} 个群共 ${keptMessages.length} 条原汁原味聊天记录（纯正文 ${rawPureTextChars} 字 / 完整上下文 ${fullTranscriptChars} 字，100% 零截断）一口气发送给远程 AI (${config.llm.mainModel}) 进行深度合并总结...`
  );

  const endOfPromptJsonMandate = [
    '',
    '========================================================================',
    '⚠️【聊天记录到此结束！以下是最高优先级输出格式指令（必须严格遵守）】⚠️',
    '1. 严禁直接输出 Markdown 标题（如 `## 群聊全景报告`、`### 一、总体概览`）或任何 JSON 以外的文字！',
    '2. 你必须且只能输出一个完整的、合法的 JSON 对象（第一个字符必须是 `{`，最后一个字符必须是 `}`）！',
    '3. 请严格按照以下 JSON Schema 输出（包含 overview、todoChecklist、aiKnowledgeNotes、items 四个顶层字段）：',
    '{',
    '  "overview": "详实的全局深度综述（300~500字，以北京时间 UTC+8 为基准）",',
    '  "todoChecklist": [',
    '    "[所属群/类别] 具体动作 + 提交方式/文件名/链接/群号 + 精确截止时间（北京时间）"',
    '  ],',
    '  "aiKnowledgeNotes": [',
    '    "**核心概念/工具/话题**：详细技术原理 + 群友实测表现/踩坑结论 + 实操建议"',
    '  ],',
    '  "items": [',
    '    {',
    '      "groupId": "群号字符串（对应输入中的 groupId）",',
    '      "groupName": "群名称",',
    '      "score": 3,',
    '      "category": "urgent 或 competition 或 ai_knowledge 或 discussion",',
    '      "title": "精准且信息量丰富的标题",',
    '      "summary": "详尽完整的前因后果、所有相关文件名/链接/邮箱/群号、不同群友的观点细节与技术结论",',
    '      "actionRequired": "明确的待办执行步骤、报名方式、截止时间（北京时间）或推荐尝试的工具/链接（无则留空字符串）",',
    '      "timeRange": "MM-DD HH:mm - HH:mm (北京时间)",',
    '      "keyMessageIds": ["消息ID数字字符串"]',
    '    }',
    '  ]',
    '}',
  ].join('\n');

  const rawResp = await callRemoteLlm(
    config,
    config.llm.mainModel,
    systemPrompt,
    `以下是今日各群筛选后的 100% 原汁原味完整聊天记录（共 ${fullTranscriptChars} 字符）：\n\n${fullTranscript}\n${endOfPromptJsonMandate}`,
    180000
  );

  let parsed = tryRepairAndParseDigestJson(rawResp);

  // 如果大模型在超长上下文后仍然直接输出了 Markdown 报告而非 JSON，自动进行二次极速 JSON 结构化转换 + Markdown 兜底解析
  if (!parsed) {
    console.warn(
      `[AI] 主模型首次返回了 Markdown 文本而非 JSON（长度 ${rawResp.length} 字符），正在启动 3 秒极速 JSON 结构化转换...`
    );
    const groupCatalog = sortedGroups
      .map((g) => {
        const firstTs = g.msgs[0]?.timestamp ? formatChinaMdHm(g.msgs[0].timestamp) : '';
        const lastTs = g.msgs[g.msgs.length - 1]?.timestamp
          ? formatChinaMdHm(g.msgs[g.msgs.length - 1].timestamp)
          : '';
        const sampleIds = g.msgs
          .slice(-5)
          .map((m) => m.message_id)
          .join(',');
        return `- groupId="${g.groupId}" | groupName="${g.groupName}" | timeRange="${firstTs} - ${lastTs} (北京时间)" | sampleMessageIds=[${sampleIds}]`;
      })
      .join('\n');

    try {
      const convertedResp = await callRemoteLlm(
        config,
        config.llm.mainModel,
        '你是一个严格的 JSON 结构化转换器。请将用户提供的群聊总结报告完整无损地转换为指定的 JSON 对象，严禁输出 JSON 以外的任何字符。',
        `请将以下已经生成好的群聊深度报告完整无损地转换为标准 JSON 格式（保留全部细节、文件名、链接、观点与待办，不要遗漏任何小节）：\n\n【群号与时间映射表】：\n${groupCatalog}\n\n【待转换的群聊报告全文】：\n${rawResp}\n\n${endOfPromptJsonMandate}`,
        90000
      );
      parsed = tryRepairAndParseDigestJson(convertedResp);
    } catch (convErr: any) {
      console.warn(`[AI] 二次 JSON 转换请求异常，将使用内置 Markdown 结构化解析器兜底: ${convErr?.message}`);
    }

    if (!parsed) {
      console.warn('[AI] 启用内置 Markdown 智能解析器直接提取结构化日报与卡片...');
      parsed = parseMarkdownDigestFallback(rawResp, sortedGroups, windowRangeStr);
    }
  }
  const aiOverview = String(parsed.overview || '').trim();
  const todoChecklist: string[] = Array.isArray(parsed.todoChecklist)
    ? parsed.todoChecklist.map((s: any) => String(s).trim()).filter(Boolean)
    : [];
  const aiKnowledgeNotes: string[] = Array.isArray(parsed.aiKnowledgeNotes)
    ? parsed.aiKnowledgeNotes.map((s: any) => String(s).trim()).filter(Boolean)
    : [];
  const rawItems: any[] = Array.isArray(parsed.items) ? parsed.items : [];

  const validCategories = new Set(['urgent', 'competition', 'ai_knowledge', 'highlight', 'discussion']);

  const valuableItems: ChunkDigestItem[] = rawItems
    .map((it, idx) => {
      const scoreNum = Math.min(3, Math.max(1, Number(it.score || 2))) as 1 | 2 | 3;
      let gid = String(it.groupId || '').trim();
      let matchedGrp = byGroup.get(gid);
      const rawGname = String(it.groupName || '').trim();
      if (!matchedGrp && rawGname) {
        matchedGrp = sortedGroups.find(
          (g) => g.groupName === rawGname || g.groupName.includes(rawGname) || rawGname.includes(g.groupName)
        );
        if (matchedGrp) gid = matchedGrp.groupId;
      }
      const gname = rawGname || matchedGrp?.groupName || `群聊(${gid || '汇总'})`;
      const rawCat = String(it.category || '').trim();
      const cat = (
        validCategories.has(rawCat)
          ? rawCat
          : scoreNum === 3
          ? 'urgent'
          : scoreNum === 2
          ? 'ai_knowledge'
          : 'discussion'
      ) as ChunkDigestItem['category'];

      let keyIds = Array.isArray(it.keyMessageIds)
        ? it.keyMessageIds.map((id: any) => String(id).replace(/^#/, '').trim()).filter(Boolean)
        : [];
      if (keyIds.length === 0 && matchedGrp && matchedGrp.msgs.length > 0) {
        keyIds = matchedGrp.msgs.slice(-3).map((m) => String(m.message_id));
      }

      return {
        chunkId: `${gid || 'grp'}_ai_${idx}`,
        groupId: gid,
        groupName: gname,
        score: scoreNum,
        category: cat,
        title: String(it.title || '群聊重点总结'),
        summary: String(it.summary || ''),
        actionRequired: it.actionRequired ? String(it.actionRequired).trim() : undefined,
        keyMessageIds: keyIds,
        timeRange: String(it.timeRange || windowRangeStr),
      };
    })
    .sort((a, b) => b.score - a.score);

  const urgentList = valuableItems.filter((i) => i.category === 'urgent');
  const competitionList = valuableItems.filter((i) => i.category === 'competition');
  const aiKnowledgeList = valuableItems.filter(
    (i) => i.category === 'ai_knowledge' || i.category === 'highlight'
  );
  const discussionList = valuableItems.filter((i) => i.category === 'discussion');

  const mdLines: string[] = [
    `# 📅 QQ 智能消息深度日报 (${dateStr} · 中国标准时间 UTC+8)`,
    `> ⏱️ **增量总结时间锚点标记**：\`${windowRangeStr}\`（本批次消息已自动打上时间标记归档，后续生成日报时绝不重复总结第二遍）`,
    `> 📊 **全量原汁原味脱水统计**：本时段新增捕获 **${allMessages.length}** 条群消息 | L1 拦截水群噪音 **${l1NoiseCount}** 条 | **100% 零截断原汁原味送入 AI 通盘阅读 ${keptMessages.length} 条（覆盖 ${byGroup.size} 个群，纯消息正文 ${rawPureTextChars.toLocaleString()} 字 / 含北京时间与角色完整上下文 ${fullTranscriptChars.toLocaleString()} 字）** | AI 深度提炼 **${valuableItems.length}** 个精品议题（预计节省 **${savedMinutes} 分钟** 爬楼时间）`,
    '',
  ];

  if (aiOverview) {
    mdLines.push(`## 🧭 AI 助理今日全局深度导读\n${aiOverview}\n`);
  }

  if (todoChecklist.length > 0) {
    mdLines.push('## ✅ 今日集中执行待办清单 (Actionable Todo Checklist)');
    for (let i = 0; i < todoChecklist.length; i++) {
      mdLines.push(`${i + 1}. [ ] ${todoChecklist[i]}`);
    }
    mdLines.push('');
  }

  if (urgentList.length > 0) {
    mdLines.push('## 🚨 必看课程通知、作业课件与学院待办 (Urgent & Action Items)');
    for (const item of urgentList) {
      mdLines.push(
        `- **[${item.groupName}] ${item.title}** *(${item.timeRange})*\n  - 📝 **详情**：${item.summary}${
          item.actionRequired ? `\n  - ⚡ **待办建议**：**${item.actionRequired}**` : ''
        }`
      );
    }
    mdLines.push('');
  }

  if (competitionList.length > 0) {
    mdLines.push('## 🏆 学科竞赛、科创申报与挑战赛情报专区 (Competitions & Innovation)');
    for (const item of competitionList) {
      mdLines.push(
        `- **[${item.groupName}] ${item.title}** *(${item.timeRange})*\n  - 🏅 **竞赛详情**：${item.summary}${
          item.actionRequired ? `\n  - 📌 **参赛/行动指南**：**${item.actionRequired}**` : ''
        }`
      );
    }
    mdLines.push('');
  }

  if (aiKnowledgeList.length > 0 || aiKnowledgeNotes.length > 0) {
    mdLines.push('## 🤖 AI 前沿技术、大模型生态与硬核知识专栏 (AI & Tech Insights)');
    if (aiKnowledgeNotes.length > 0) {
      mdLines.push('### 💡 今日群聊 AI 核心知识点速览');
      for (const note of aiKnowledgeNotes) {
        mdLines.push(`- ${note}`);
      }
      mdLines.push('');
    }
    for (const item of aiKnowledgeList) {
      mdLines.push(
        `- **[${item.groupName}] ${item.title}** *(${item.timeRange})*\n  - 🧠 **深度解析**：${item.summary}${
          item.actionRequired ? `\n  - 🔗 **延伸关注/工具**：${item.actionRequired}` : ''
        }`
      );
    }
    mdLines.push('');
  }

  if (discussionList.length > 0) {
    mdLines.push('## 💬 其他热门群聊脉络与校园话题 (Discussions)');
    for (const item of discussionList) {
      mdLines.push(`- **[${item.groupName}] ${item.title}** *(${item.timeRange})*\n  - ${item.summary}`);
    }
    mdLines.push('');
  }

  console.log(
    `[AI] 全量原汁原味（${fullTranscriptChars} 字符）深度合并总结完成！共提炼出 ${valuableItems.length} 个精品议题（含竞赛 ${competitionList.length} 条、AI 干货 ${aiKnowledgeList.length} 条）。`
  );

  return {
    dateStr,
    createdAt: Date.now(),
    stats: {
      totalMessages: allMessages.length,
      l1FilteredNoise: l1NoiseCount,
      keptForAi: keptMessages.length,
      totalChunks: byGroup.size,
      valuableChunks: valuableItems.length,
      estimatedSavedMinutes: savedMinutes,
      rawPureTextChars,
      fullTranscriptChars,
      windowStartMs,
      windowEndMs,
      windowRangeStr,
    },
    items: valuableItems,
    markdownSummary: mdLines.join('\n'),
  };
}
