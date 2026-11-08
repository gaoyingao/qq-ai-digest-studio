import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { StoredMessage, DailyDigestReport } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'qq_digest.sqlite');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE,
    chat_type TEXT NOT NULL,
    group_id TEXT NOT NULL,
    group_name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT DEFAULT 'member',
    clean_text TEXT NOT NULL,
    reply_to_id TEXT,
    is_at_me INTEGER DEFAULT 0,
    is_high_priority INTEGER DEFAULT 0,
    priority_reason TEXT,
    filter_status TEXT NOT NULL,
    filter_reason TEXT,
    timestamp INTEGER NOT NULL,
    summarized_at INTEGER DEFAULT NULL,
    summarized_digest_id INTEGER DEFAULT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
  CREATE INDEX IF NOT EXISTS idx_messages_filter_status ON messages(filter_status);

  CREATE TABLE IF NOT EXISTS digests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_str TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    stats_json TEXT NOT NULL,
    items_json TEXT NOT NULL,
    markdown_summary TEXT NOT NULL
  );

  DELETE FROM messages WHERE chat_type != 'group';

  -- 本人发送的消息无需总结，统一标记为 filtered_noise
  UPDATE messages
  SET filter_status = 'filtered_noise', filter_reason = '本人发送消息免总结', is_high_priority = 0
  WHERE user_id = '3076836236';

  -- 仅过滤纯表情包/空消息/无URL旧图片占位/本人消息，其余含有效文字的群聊记录保留 (kept)
  UPDATE messages
  SET filter_status = 'kept', filter_reason = NULL
  WHERE filter_status = 'filtered_noise'
    AND user_id != '3076836236'
    AND COALESCE(filter_reason, '') NOT IN ('本人发送消息免总结', '无意义水群短语', 'GIF动画表情包', 'AI视觉判定纯表情包')
    AND clean_text NOT IN ('[动画表情]', '[表情]', '[图片]', '[语音]', '[戳一戳]', '[空消息]', '6', '66', '666', '?', '？', '？？', '？？？', '+1', '1', '哈哈', '哈哈哈', '草', '牛')
    AND REPLACE(REPLACE(TRIM(clean_text), '[动画表情]', ''), '[表情]', '') != '';
`);

// 兼容已有 SQLite 表结构：自动追加 summarized_at 与 summarized_digest_id 时间标记字段
try {
  db.exec(`ALTER TABLE messages ADD COLUMN summarized_at INTEGER DEFAULT NULL`);
} catch {}
try {
  db.exec(`ALTER TABLE messages ADD COLUMN summarized_digest_id INTEGER DEFAULT NULL`);
} catch {}
db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_summarized_at ON messages(summarized_at);`);

// 清理早于 2026-11-04 00:00 (北京时间) 的陈旧失效历史记录（如 7~10 月份不活跃群被拉取的过期通知）
db.exec(`DELETE FROM messages WHERE timestamp < 1793721600000;`);

// 若已有历史生成的日报，自动将该日报生成时刻之前的消息打上已总结时间标记，防止二次重复总结
try {
  const latestDigest = db
    .prepare(`SELECT id, created_at FROM digests ORDER BY id DESC LIMIT 1`)
    .get() as { id: number; created_at: number } | undefined;
  if (latestDigest) {
    db.prepare(`
      UPDATE messages
      SET summarized_at = ?, summarized_digest_id = ?
      WHERE summarized_at IS NULL AND timestamp <= ?
    `).run(latestDigest.created_at, latestDigest.id, latestDigest.created_at);
  }
} catch {}

export function updateMessageAfterVision(
  messageId: string,
  cleanText: string,
  filterStatus: 'kept' | 'filtered_noise',
  filterReason: string | null = null
): void {
  try {
    const stmt = db.prepare(`
      UPDATE messages
      SET clean_text = ?, filter_status = ?, filter_reason = ?
      WHERE message_id = ?
    `);
    stmt.run(cleanText, filterStatus, filterReason, messageId);
  } catch (err) {
    console.error('[DB] 更新图片视觉识别结果失败:', err);
  }
}

export function insertMessage(msg: StoredMessage): boolean {
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO messages (
        message_id, chat_type, group_id, group_name, user_id,
        sender_name, sender_role, clean_text, reply_to_id,
        is_at_me, is_high_priority, priority_reason,
        filter_status, filter_reason, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      msg.message_id,
      msg.chat_type,
      msg.group_id,
      msg.group_name,
      msg.user_id,
      msg.sender_name,
      msg.sender_role,
      msg.clean_text,
      msg.reply_to_id,
      msg.is_at_me,
      msg.is_high_priority,
      msg.priority_reason,
      msg.filter_status,
      msg.filter_reason,
      msg.timestamp
    );
    return Number(result.changes) > 0;
  } catch (err) {
    console.error('[DB] 插入消息失败:', err);
    return false;
  }
}

export function getMessagesInTimeRange(startTime: number, endTime: number): StoredMessage[] {
  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `);
  return stmt.all(startTime, endTime) as unknown as StoredMessage[];
}

export function getRecentMessages(limit = 100): StoredMessage[] {
  const stmt = db.prepare(`
    SELECT * FROM messages
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(limit) as unknown as StoredMessage[];
}

export function getGroupMessagesFromDb(groupId: string, limit = 40): StoredMessage[] {
  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE group_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return (stmt.all(groupId, limit) as unknown as StoredMessage[]).reverse();
}

export function getMessagesContextAroundIds(groupId: string, messageIds: string[], windowMs = 10 * 60 * 1000): StoredMessage[] {
  if (!messageIds.length) return [];
  const placeholders = messageIds.map(() => '?').join(',');
  const anchorStmt = db.prepare(`
    SELECT MIN(timestamp) as min_ts, MAX(timestamp) as max_ts
    FROM messages
    WHERE group_id = ? AND message_id IN (${placeholders})
  `);
  const range = anchorStmt.get(groupId, ...messageIds) as { min_ts: number | null; max_ts: number | null } | undefined;
  if (!range || range.min_ts === null || range.max_ts === null) {
    const fallbackStmt = db.prepare(`
      SELECT * FROM messages WHERE group_id = ? ORDER BY timestamp DESC LIMIT 40
    `);
    return (fallbackStmt.all(groupId) as unknown as StoredMessage[]).reverse();
  }
  const ctxStmt = db.prepare(`
    SELECT * FROM messages
    WHERE group_id = ? AND timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `);
  return ctxStmt.all(groupId, range.min_ts - windowMs, range.max_ts + windowMs) as unknown as StoredMessage[];
}

export function getDiscoveredGroups(): Array<{
  group_id: string;
  group_name: string;
  total_count: number;
  kept_count: number;
  unsummarized_kept_count: number;
  high_priority_count: number;
  last_timestamp: number;
}> {
  const stmt = db.prepare(`
    SELECT
      group_id,
      MAX(group_name) as group_name,
      COUNT(*) as total_count,
      SUM(CASE WHEN filter_status = 'kept' THEN 1 ELSE 0 END) as kept_count,
      SUM(CASE WHEN filter_status = 'kept' AND summarized_at IS NULL THEN 1 ELSE 0 END) as unsummarized_kept_count,
      SUM(CASE WHEN is_high_priority = 1 THEN 1 ELSE 0 END) as high_priority_count,
      MAX(timestamp) as last_timestamp
    FROM messages
    GROUP BY group_id
    ORDER BY last_timestamp DESC
  `);
  return stmt.all() as any[];
}

export interface DigestWatermarkState {
  lastDigestId: number | null;
  lastSummarizedAt: number | null;
  lastMessageTs: number;
  unsummarizedTotalCount: number;
  unsummarizedKeptCount: number;
  alreadySummarizedCount: number;
}

export function getDigestWatermarkState(): DigestWatermarkState {
  const latestDigest = db
    .prepare(`SELECT id, created_at FROM digests ORDER BY id DESC LIMIT 1`)
    .get() as { id: number; created_at: number } | undefined;

  const maxSumRow = db
    .prepare(`SELECT MAX(timestamp) as max_ts, COUNT(*) as cnt FROM messages WHERE summarized_at IS NOT NULL`)
    .get() as { max_ts: number | null; cnt: number } | undefined;

  const lastMessageTs = Math.max(
    Number(maxSumRow?.max_ts || 0),
    Number(latestDigest?.created_at || 0)
  );

  const unsumRow = db
    .prepare(`
      SELECT
        COUNT(*) as total_cnt,
        SUM(CASE WHEN filter_status = 'kept' THEN 1 ELSE 0 END) as kept_cnt
      FROM messages
      WHERE summarized_at IS NULL AND timestamp > ?
    `)
    .get(lastMessageTs) as { total_cnt: number; kept_cnt: number | null } | undefined;

  return {
    lastDigestId: latestDigest?.id ?? null,
    lastSummarizedAt: latestDigest?.created_at ?? null,
    lastMessageTs,
    unsummarizedTotalCount: Number(unsumRow?.total_cnt || 0),
    unsummarizedKeptCount: Number(unsumRow?.kept_cnt || 0),
    alreadySummarizedCount: Number(maxSumRow?.cnt || 0),
  };
}

/**
 * 获取自上次总结时间标记 (Watermark) 以来新增的、未总结且在时效窗口内的群聊消息
 * 已经总结过的消息 (summarized_at IS NOT NULL) 或早于时间锚点的历史消息绝不二次返回
 */
export function getUnsummarizedMessagesForDigest(maxAgeHours = 36): {
  messages: StoredMessage[];
  windowStartMs: number;
  windowEndMs: number;
} {
  const now = Date.now();
  const freshnessCutoffMs = now - maxAgeHours * 3600_000;
  const watermark = getDigestWatermarkState();

  // 将早于时效窗口或早于上次总结锚点的遗留未标记消息自动归档打标，避免过期老消息混入
  const effectiveStartMs = Math.max(freshnessCutoffMs, watermark.lastMessageTs);
  if (effectiveStartMs > 0) {
    db.prepare(`
      UPDATE messages
      SET summarized_at = -1, summarized_digest_id = 0
      WHERE summarized_at IS NULL AND timestamp <= ?
    `).run(effectiveStartMs);
  }

  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE chat_type = 'group'
      AND summarized_at IS NULL
      AND timestamp > ?
    ORDER BY timestamp ASC
  `);
  const messages = stmt.all(effectiveStartMs) as unknown as StoredMessage[];

  const windowStartMs =
    messages.length > 0
      ? messages[0].timestamp
      : watermark.lastMessageTs > 0
      ? watermark.lastMessageTs
      : freshnessCutoffMs;
  const windowEndMs =
    messages.length > 0 ? messages[messages.length - 1].timestamp : now;

  return { messages, windowStartMs, windowEndMs };
}

/**
 * 当用户主动点击“强制重跑本期”时，取出指定期数（或最新一期）所关联的消息进行重新总结
 */
export function getMessagesByDigestId(digestId: number): {
  messages: StoredMessage[];
  windowStartMs: number;
  windowEndMs: number;
} {
  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE chat_type = 'group' AND summarized_digest_id = ?
    ORDER BY timestamp ASC
  `);
  const messages = stmt.all(digestId) as unknown as StoredMessage[];
  const now = Date.now();
  const windowStartMs = messages.length > 0 ? messages[0].timestamp : now - 24 * 3600_000;
  const windowEndMs = messages.length > 0 ? messages[messages.length - 1].timestamp : now;
  return { messages, windowStartMs, windowEndMs };
}

/**
 * 为已完成 AI 总结的消息打上精确的总结时间戳 (summarized_at) 与所属日报期号 (summarized_digest_id)
 */
export function markMessagesSummarized(
  maxTimestamp: number,
  digestId: number,
  summarizedAtMs = Date.now()
): number {
  const stmt = db.prepare(`
    UPDATE messages
    SET summarized_at = ?, summarized_digest_id = ?
    WHERE summarized_at IS NULL AND timestamp <= ?
  `);
  const res = stmt.run(summarizedAtMs, digestId, maxTimestamp);
  return Number(res.changes || 0);
}

export function saveDigestReport(report: DailyDigestReport): number {
  const stmt = db.prepare(`
    INSERT INTO digests (date_str, created_at, stats_json, items_json, markdown_summary)
    VALUES (?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    report.dateStr,
    report.createdAt,
    JSON.stringify(report.stats),
    JSON.stringify(report.items),
    report.markdownSummary
  );
  return Number(res.lastInsertRowid);
}

export function updateDigestReport(id: number, report: DailyDigestReport): void {
  const stmt = db.prepare(`
    UPDATE digests
    SET date_str = ?, created_at = ?, stats_json = ?, items_json = ?, markdown_summary = ?
    WHERE id = ?
  `);
  stmt.run(
    report.dateStr,
    report.createdAt,
    JSON.stringify(report.stats),
    JSON.stringify(report.items),
    report.markdownSummary,
    id
  );
}

export function getDigestReports(limit = 20): DailyDigestReport[] {
  const stmt = db.prepare(`
    SELECT * FROM digests ORDER BY created_at DESC LIMIT ?
  `);
  const rows = stmt.all(limit) as any[];
  return rows.map((r) => ({
    id: r.id,
    dateStr: r.date_str,
    createdAt: r.created_at,
    stats: JSON.parse(r.stats_json),
    items: JSON.parse(r.items_json),
    markdownSummary: r.markdown_summary,
  }));
}

export function clearMockAndResetDatabase(): void {
  db.exec(`
    DELETE FROM messages WHERE message_id IN ('900101','900102','900103','900104','900105','900106','900107','900201','900202','900301','900302','900303','900304');
    DELETE FROM digests;
  `);
}

