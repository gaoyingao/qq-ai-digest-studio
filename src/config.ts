import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { AppConfig } from './types.js';

dotenv.config();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultConfig: AppConfig = {
  napcat: {
    wsUrl: process.env.NAPCAT_WS_URL || 'ws://127.0.0.1:3001',
    accessToken: process.env.NAPCAT_ACCESS_TOKEN || '',
    selfQqId: process.env.SELF_QQ_ID || '',
  },
  filter: {
    watchAllGroupsByDefault: true,
    monitoredGroups: {},
    highPriorityKeywords: [
      '通知',
      '截止',
      'DDL',
      '作业',
      '考试',
      '报名',
      '紧急',
      '必须',
      '提交',
      '收到请回复',
      '群文件',
      '评审',
      '会议',
    ],
    sessionGapMinutes: 15,
  },
  llm: {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    fastModel: process.env.LLM_FAST_MODEL || 'deepseek-chat',
    mainModel: process.env.LLM_MAIN_MODEL || 'deepseek-chat',
  },
  mobilePush: {
    enabled: false,
    type: 'bark',
    webhookUrl: process.env.MOBILE_PUSH_WEBHOOK || '',
    notifyOnAtMe: true,
    notifyOnHighPriority: true,
  },
  schedule: {
    dailyDigestTime: '21:00',
  },
  server: {
    port: Number(process.env.PORT || 3210),
  },
};

export function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...defaultConfig,
        ...parsed,
        napcat: { ...defaultConfig.napcat, ...(parsed.napcat || {}) },
        filter: { ...defaultConfig.filter, ...(parsed.filter || {}) },
        llm: { ...defaultConfig.llm, ...(parsed.llm || {}) },
        mobilePush: { ...defaultConfig.mobilePush, ...(parsed.mobilePush || {}) },
        schedule: { ...defaultConfig.schedule, ...(parsed.schedule || {}) },
        server: { ...defaultConfig.server, ...(parsed.server || {}) },
      };
    }
  } catch (err) {
    console.error('[Config] 读取配置文件失败，使用默认配置:', err);
  }
  saveConfig(defaultConfig);
  return defaultConfig;
}

export function saveConfig(cfg: AppConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}
