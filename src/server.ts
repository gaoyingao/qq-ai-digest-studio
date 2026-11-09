import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { WebSocketServer } from 'ws';

const execAsync = promisify(exec);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DESKTOP_ACTION_FILE = path.resolve(process.cwd(), 'data', 'desktop_action.json');
const QQNT_SETTING_FILE = 'C:\\Program Files\\Tencent\\QQNT\\versions\\setting.json';

function resetQqLauncherCounts(): void {
  try {
    if (fs.existsSync(QQNT_SETTING_FILE)) {
      fs.writeFileSync(QQNT_SETTING_FILE, '{"launcherCounts":0}', 'utf-8');
    }
  } catch {}
}
import { AppConfig } from './types.js';
import { saveConfig } from './config.js';
import {
  getRecentMessages,
  getMessagesContextAroundIds,
  getDiscoveredGroups,
  saveDigestReport,
  updateDigestReport,
  getDigestReports,
  getDigestWatermarkState,
  getUnsummarizedMessagesForDigest,
  getMessagesByDigestId,
  markMessagesSummarized,
} from './db.js';
import { buildConversationChunks } from './filter.js';
import { generateDailyDigest, testLlmApiConnection, getChinaFullTimeStr } from './ai.js';
import {
  napcatStatus,
  attachReverseWebSocketClient,
  startForwardNapCatClient,
  getContactsSnapshot,
  fetchChatHistory,
  sendChatMessage,
  backfillRecentGroupHistory,
} from './napcat.js';
import { getDashboardHtml } from './ui-template.js';

function getLanIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: any): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function ensureLocalWbProxyRunning(config: AppConfig): Promise<void> {
  if (!config.llm.baseUrl.includes('127.0.0.1:8788') && !config.llm.baseUrl.includes('localhost:8788')) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8788/v1/models', { timeout: 800 }, (res) => {
      res.resume();
      resolve();
    });
    req.on('error', () => {
      try {
        const hubDir = path.resolve(process.cwd(), 'workbuddy2api-hub');
        const scriptPath = path.join(hubDir, 'wb_proxy.py');
        const pyExe = fs.existsSync('D:\\Miniconda\\python.exe')
          ? 'D:\\Miniconda\\python.exe'
          : 'python';
        if (fs.existsSync(scriptPath)) {
          const child = spawn(pyExe, [scriptPath, '--port', '8788'], {
            cwd: hubDir,
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
          });
          child.unref();
        }
      } catch {}
      setTimeout(resolve, 1800);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve();
    });
  });
}

export async function triggerDigestGeneration(
  config: AppConfig,
  maxAgeHours = 36,
  options?: { forceReSummarizeDigestId?: number }
): Promise<any> {
  // 确保本地 8788 AI 代理处于运行状态
  await ensureLocalWbProxyRunning(config);

  // 若 NapCat 在线，先同步拉取一次自上次总结时间锚点以来的全部新增群消息
  if (napcatStatus.connected) {
    try {
      await backfillRecentGroupHistory(config, 60, 60);
    } catch {}
  }

  // 分支 1：用户显式点击“🔄 强制重跑本期”（仅针对指定期号重跑，不影响其他期）
  if (options?.forceReSummarizeDigestId) {
    const targetId = Number(options.forceReSummarizeDigestId);
    const { messages, windowStartMs, windowEndMs } = getMessagesByDigestId(targetId);
    if (messages.length === 0) {
      throw new Error(`未找到第 #${targetId} 期关联的群聊记录`);
    }
    const chunks = buildConversationChunks(messages, config);
    const report = await generateDailyDigest(messages, chunks, config, {
      windowStartMs,
      windowEndMs,
    });
    report.id = targetId;
    updateDigestReport(targetId, report);
    return { report, noNewMessages: false, watermark: getDigestWatermarkState() };
  }

  // 分支 2：默认增量总结模式 —— 只总结上次时间标记之后的新增未总结消息，已总结消息绝不二次总结！
  const { messages, windowStartMs, windowEndMs } = getUnsummarizedMessagesForDigest(maxAgeHours);
  const keptCount = messages.filter((m) => m.filter_status === 'kept').length;

  if (keptCount === 0) {
    const watermark = getDigestWatermarkState();
    const lastTimeStr = watermark.lastSummarizedAt
      ? getChinaFullTimeStr(watermark.lastSummarizedAt)
      : '刚刚';
    return {
      noNewMessages: true,
      watermark,
      message: `⏱️ 自上次总结时间标记（北京时间 ${lastTimeStr}）以来，暂无新的有效群聊消息！已总结过的历史消息均已打上时间标记，无需重复总结第二遍。`,
    };
  }

  const chunks = buildConversationChunks(messages, config);
  const report = await generateDailyDigest(messages, chunks, config, {
    windowStartMs,
    windowEndMs,
  });
  const id = saveDigestReport(report);
  report.id = id;

  // 立即为本批次所有消息打上精确的总结时间标记 (summarized_at) 与所属期号 (summarized_digest_id)
  const stampedCount = markMessagesSummarized(windowEndMs, id, report.createdAt);
  console.log(
    `[Watermark] 已为本批次 ${stampedCount} 条群聊消息打上已总结时间标记 (digest #${id}, 截止锚点 ${getChinaFullTimeStr(
      windowEndMs
    )} UTC+8)`
  );

  return { report, noNewMessages: false, watermark: getDigestWatermarkState() };
}

export function startDashboardServer(
  getConfig: () => AppConfig,
  updateConfig: (newCfg: AppConfig) => void
): http.Server {
  const server = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    try {
      if (pathname === '/api/status' && req.method === 'GET') {
        const cfg = getConfig();
        const groups = getDiscoveredGroups();
        const recentMsgs = getRecentMessages(80);
        const digests = getDigestReports(10);
        return sendJson(res, 200, {
          serverPid: process.pid,
          isSandbox: Boolean(process.env.ANTIGRAVITY_AGENT),
          napcat: napcatStatus,
          lanIp: getLanIp(),
          port: cfg.server.port,
          hasApiKey: Boolean(cfg.llm.apiKey && cfg.llm.apiKey.trim()),
          config: {
            ...cfg,
            llm: {
              ...cfg.llm,
              apiKey: cfg.llm.apiKey ? `${cfg.llm.apiKey.slice(0, 6)}******` : '',
              hasRawKey: Boolean(cfg.llm.apiKey),
            },
          },
          groups,
          recentMessages: recentMsgs,
          digests,
          watermark: getDigestWatermarkState(),
        });
      }

      // 实时聊天与回消息中心 API
      if (pathname === '/api/chat/contacts' && req.method === 'GET') {
        return sendJson(res, 200, {
          ok: true,
          ...getContactsSnapshot(),
        });
      }

      if (pathname === '/api/chat/history' && req.method === 'GET') {
        const type = (urlObj.searchParams.get('type') === 'private' ? 'private' : 'group') as 'group' | 'private';
        const id = urlObj.searchParams.get('id') || '';
        if (!id) return sendJson(res, 400, { ok: false, error: '缺少会话 ID' });
        const messages = await fetchChatHistory(type, id, 40);
        return sendJson(res, 200, { ok: true, messages });
      }

      if (pathname === '/api/chat/send' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const type = (body.type === 'private' ? 'private' : 'group') as 'group' | 'private';
        const targetId = String(body.targetId || '');
        const text = String(body.text || '').trim();
        const replyToMessageId = body.replyToMessageId ? String(body.replyToMessageId) : undefined;
        const atUserId = body.atUserId ? String(body.atUserId) : undefined;

        if (!targetId || !text) {
          return sendJson(res, 400, { ok: false, error: '目标 ID 与消息内容不能为空' });
        }

        const result = await sendChatMessage(type, targetId, text, replyToMessageId, atUserId);
        return sendJson(res, 200, { ok: true, result });
      }

      if (pathname === '/api/generate-digest' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const hours = Number(body.hours || 36);
        const forceId = body.forceReSummarizeDigestId
          ? Number(body.forceReSummarizeDigestId)
          : undefined;
        const result = await triggerDigestGeneration(getConfig(), hours, {
          forceReSummarizeDigestId: forceId,
        });
        return sendJson(res, 200, { ok: true, ...result });
      }

      if (pathname === '/api/test-llm' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const current = getConfig();
        const tempCfg: AppConfig = {
          ...current,
          llm: {
            baseUrl: body.baseUrl || current.llm.baseUrl,
            apiKey:
              body.apiKey && !String(body.apiKey).includes('******')
                ? body.apiKey.trim()
                : current.llm.apiKey,
            fastModel: body.fastModel || current.llm.fastModel,
            mainModel: body.mainModel || current.llm.mainModel,
          },
        };
        const result = await testLlmApiConnection(tempCfg);
        return sendJson(res, 200, result);
      }

      if (pathname === '/api/backfill' && req.method === 'POST') {
        const result = await backfillRecentGroupHistory(getConfig(), 65, 65);
        return sendJson(res, 200, { ok: true, ...result });
      }

      if ((pathname === '/api/launch-napcat' || pathname === '/api/switch-official-qq') && req.method === 'POST') {
        if (napcatStatus.connected) {
          startForwardNapCatClient(getConfig);
          backfillRecentGroupHistory(getConfig(), 60, 60).catch(() => {});
          // 通知原生桌面宿主将已运行的官方 QQ 窗口呼出到最前面
          try {
            fs.writeFileSync(
              DESKTOP_ACTION_FILE,
              JSON.stringify({ action: 'focus-coexist-qq', ts: Date.now() }),
              'utf-8'
            );
          } catch {}
          return sendJson(res, 200, {
            ok: true,
            connected: true,
            message: '✅ 共存版官方桌面 QQ 已在线并已为您呼出到前台！',
          });
        }

        // 1. 彻底清理未挂载共存插件的残留 QQ / NapCat 进程，释放单实例锁
        await execAsync('taskkill /F /T /IM NapCatWinBootMain.exe').catch(() => {});
        await execAsync('taskkill /F /T /IM napimain.exe').catch(() => {});
        await execAsync('taskkill /F /T /IM QQ.exe').catch(() => {});
        resetQqLauncherCounts();
        await sleep(1800);

        // 2. 优先通知运行在用户真实主桌面 (WinSta0\Default) 的独立桌面软件宿主启动有头共存版官方 QQ
        try {
          fs.writeFileSync(
            DESKTOP_ACTION_FILE,
            JSON.stringify({ action: 'launch-coexist-qq', ts: Date.now() }),
            'utf-8'
          );
        } catch {}

        await sleep(1500);
        const handledByDesktopHost = !fs.existsSync(DESKTOP_ACTION_FILE);
        if (!handledByDesktopHost) {
          try {
            fs.unlinkSync(DESKTOP_ACTION_FILE);
          } catch {}

          // 若当前后端本身就在真实桌面会话中运行，直接零黑框启动有头共存版官方 QQ (napimain.exe 为 GUI 子系统，0 黑框)
          const child = spawn(
            'D:\\NapCat\\NapCat.Framework\\napimain.exe',
            [
              'C:\\Program Files\\Tencent\\QQNT\\QQ.exe',
              'D:\\NapCat\\NapCat.Framework\\napiloader.dll',
              'D:/NapCat/NapCat.Framework/nativeLoader.cjs',
            ],
            {
              cwd: 'D:\\NapCat\\NapCat.Framework',
              detached: true,
              stdio: 'ignore',
              windowsHide: false,
            }
          );
          child.unref();
        }

        // 3. 轮询等待用户在官方 QQ 登录窗口点击“登录”（或自动登录）完成共存接入
        for (let i = 0; i < 10; i++) {
          await sleep(1000);
          if (napcatStatus.connected) break;
          startForwardNapCatClient(getConfig);
        }

        return sendJson(res, 200, {
          ok: true,
          connected: napcatStatus.connected,
          message: napcatStatus.connected
            ? '✅ 共存版官方桌面 QQ 已成功启动并与本软件同步在线！现在您可以直接用官方 QQ 聊天，本软件在后台实时为您筛选总结群消息。'
            : '✅ 已为您弹出官方原生桌面 QQ 窗口！请在官方 QQ 登录窗口中点击【登录】（建议勾选“自动登录”），登录成功后官方 QQ 与本 AI 日报软件即可同时在线运行！',
        });
      }

      if (pathname === '/api/context' && req.method === 'GET') {
        const groupId = urlObj.searchParams.get('groupId') || '';
        const idsParam = urlObj.searchParams.get('ids') || '';
        const ids = idsParam.split(',').filter(Boolean);
        const messages = getMessagesContextAroundIds(groupId, ids);
        return sendJson(res, 200, { ok: true, messages, highlightIds: ids });
      }

      if (pathname === '/api/config' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const current = getConfig();
        const next: AppConfig = {
          ...current,
          napcat: { ...current.napcat, ...(body.napcat || {}) },
          filter: { ...current.filter, ...(body.filter || {}) },
          llm: {
            ...current.llm,
            ...(body.llm || {}),
            apiKey:
              body.llm?.apiKey && !String(body.llm.apiKey).includes('******')
                ? body.llm.apiKey.trim()
                : current.llm.apiKey,
          },
          mobilePush: { ...current.mobilePush, ...(body.mobilePush || {}) },
          schedule: { ...current.schedule, ...(body.schedule || {}) },
        };
        saveConfig(next);
        updateConfig(next);
        startForwardNapCatClient(getConfig);
        return sendJson(res, 200, { ok: true });
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getDashboardHtml());
    } catch (err: any) {
      console.error('[Server] 请求处理异常:', err);
      sendJson(res, 500, { ok: false, error: err?.message || '服务器内部错误' });
    }
  });

  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    attachReverseWebSocketClient(ws, getConfig);
  });

  const port = getConfig().server.port || 3210;
  server.listen(port, '0.0.0.0', () => {
    const lanIp = getLanIp();
    console.log(`\n=============================================================`);
    console.log(`🚀 QQ 智能消息筛选与 AI 总结系统 已启动！`);
    console.log(`💻 电脑端控制台: http://127.0.0.1:${port}`);
    console.log(`📱 手机端局域网访问: http://${lanIp}:${port}`);
    console.log(`🔌 支持 NapCat 反向 WS 接入地址: ws://127.0.0.1:${port}/onebot/v11/ws`);
    console.log(`=============================================================\n`);
  });

  return server;
}
