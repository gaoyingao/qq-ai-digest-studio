export interface OneBotSegment {
  type: 'text' | 'at' | 'reply' | 'image' | 'face' | 'json' | 'file' | string;
  data: Record<string, any>;
}

export interface OneBotMessageEvent {
  time: number;
  self_id: number;
  post_type: 'message' | 'message_sent' | 'notice' | 'request' | 'meta_event';
  message_type?: 'group' | 'private';
  sub_type?: string;
  message_id?: number;
  group_id?: number;
  group_name?: string;
  user_id?: number;
  target_id?: number;
  raw_message?: string;
  message?: OneBotSegment[] | string;
  sender?: {
    user_id: number;
    nickname: string;
    card?: string;
    role?: 'owner' | 'admin' | 'member';
  };
}

export interface StoredMessage {
  id?: number;
  message_id: string;
  chat_type: 'group' | 'private';
  group_id: string;
  group_name: string;
  user_id: string;
  sender_name: string;
  sender_role: string;
  clean_text: string;
  reply_to_id: string | null;
  is_at_me: number; // 0 or 1
  is_high_priority: number; // 0 or 1
  priority_reason: string | null;
  filter_status: 'kept' | 'filtered_noise';
  filter_reason: string | null;
  timestamp: number; // ms
  summarized_at?: number | null; // ms timestamp when summarized by AI (null = unsummarized)
  summarized_digest_id?: number | null; // digest ID that summarized this message
}

export interface MessageChunk {
  chunkId: string;
  groupId: string;
  groupName: string;
  startTime: number;
  endTime: number;
  hasHighPriority: boolean;
  messages: StoredMessage[];
  formattedTranscript: string;
}

export interface ChunkDigestItem {
  chunkId: string;
  groupId: string;
  groupName: string;
  score: 0 | 1 | 2 | 3; // 0: 纯水群, 1: 一般讨论, 2: 竞赛/AI技术干货, 3: 重要通知/待办/@我
  category: 'urgent' | 'competition' | 'ai_knowledge' | 'highlight' | 'discussion' | 'noise';
  title: string;
  summary: string;
  actionRequired?: string;
  keyMessageIds: string[];
  timeRange: string;
}

export interface DailyDigestReport {
  id?: number;
  dateStr: string;
  createdAt: number;
  stats: {
    totalMessages: number;
    l1FilteredNoise: number;
    keptForAi: number;
    totalChunks: number;
    valuableChunks: number;
    estimatedSavedMinutes: number;
    rawPureTextChars?: number;
    fullTranscriptChars?: number;
    windowStartMs?: number;
    windowEndMs?: number;
    windowRangeStr?: string;
  };
  items: ChunkDigestItem[];
  markdownSummary: string;
}

export interface GroupRuleConfig {
  groupId: string;
  groupName: string;
  enabled: boolean;
  customFocusPrompt?: string; // 例如："重点提取作业截止时间和老师通知"
}

export interface AppConfig {
  napcat: {
    wsUrl: string;
    accessToken: string;
    selfQqId: string;
  };
  filter: {
    watchAllGroupsByDefault: boolean;
    monitoredGroups: Record<string, GroupRuleConfig>;
    highPriorityKeywords: string[];
    sessionGapMinutes: number;
  };
  llm: {
    baseUrl: string;
    apiKey: string;
    fastModel: string;
    mainModel: string;
  };
  mobilePush: {
    enabled: boolean;
    type: 'bark' | 'pushplus' | 'feishu' | 'webhook';
    webhookUrl: string;
    notifyOnAtMe: boolean;
    notifyOnHighPriority: boolean;
  };
  schedule: {
    dailyDigestTime: string; // e.g., "21:00"
  };
  server: {
    port: number;
  };
}
