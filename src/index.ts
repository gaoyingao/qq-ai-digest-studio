import net from 'node:net';
import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { loadConfig } from './config.js';
import { startForwardNapCatClient, napcatStatus, backfillRecentGroupHistory } from './napcat.js';
import { startDashboardServer, triggerDigestGeneration } from './server.js';

const execAsync = promisify(exec);

let currentConfig = loadConfig();

function getConfig() {
  return currentConfig;
}

function updateConfig(nextCfg: typeof currentConfig) {
  currentConfig = nextCfg;
}

function checkPortOpen(port: number, host = '127.0.0.1', timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (ok: boolean) => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(ok);
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

// 启动 Web/手机端自适应控制台 + 反向 WebSocket 监听
startDashboardServer(getConfig, updateConfig);

// 启动 NapCat 正向 WebSocket 客户端连接
startForwardNapCatClient(getConfig);

// 启动 3.5 秒后自动检查共存版 NapCat 是否已在线；若未在线且当前无 QQ 运行，则静默拉起共存版官方 QQ
setTimeout(async () => {
  if (napcatStatus.connected) return;
  const is3001Open = await checkPortOpen(3001);
  if (!is3001Open) {
    try {
      const { stdout: qqOut } = await execAsync('tasklist /FI "IMAGENAME eq QQ.exe" /NH');
      if (qqOut.includes('QQ.exe')) {
        return;
      }
    } catch {}
    if (process.env.ANTIGRAVITY_AGENT) {
      return;
    }
    console.log('[AutoBoot] 正在以零黑框共存模式启动官方桌面 QQ...');
    const napimain = 'D:\\NapCat\\NapCat.Framework\\napimain.exe';
    const qqExe = 'C:\\Program Files\\Tencent\\QQNT\\QQ.exe';
    const loaderDll = 'D:\\NapCat\\NapCat.Framework\\napiloader.dll';
    const loaderScript = 'D:/NapCat/NapCat.Framework/nativeLoader.cjs';
    const child = spawn(napimain, [qqExe, loaderDll, loaderScript], {
      cwd: 'D:\\NapCat\\NapCat.Framework',
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
  }
}, 3500);

// 每 90 秒在后台静默执行一次最近活跃群历史消息回溯补齐，确保任何漫游或离线同步消息 0 遗漏
setInterval(() => {
  if (napcatStatus.connected) {
    backfillRecentGroupHistory(currentConfig, 30, 50).catch(() => {});
  }
}, 90 * 1000);

// 每日定时自动生成日报检查器 (每分钟以中国标准时间 UTC+8 检查一次是否到达设定时间)
let lastTriggeredDate = '';
setInterval(() => {
  const bj = new Date(Date.now() + 8 * 3600_000);
  const hm = `${String(bj.getUTCHours()).padStart(2, '0')}:${String(bj.getUTCMinutes()).padStart(2, '0')}`;
  const dateStr = `${bj.getUTCFullYear()}-${bj.getUTCMonth() + 1}-${bj.getUTCDate()}`;
  if (hm === currentConfig.schedule.dailyDigestTime && lastTriggeredDate !== dateStr) {
    lastTriggeredDate = dateStr;
    console.log(`[Scheduler] 到达北京时间每日定时总结时间 (${hm})，开始生成今日 QQ 智能日报...`);
    triggerDigestGeneration(currentConfig, 24).catch((err) =>
      console.error('[Scheduler] 定时生成日报失败:', err)
    );
  }
}, 60 * 1000);

