import { AppConfig, StoredMessage } from './types.js';

/**
 * 手机端高优消息实时强提醒推送器（解决电脑挂Q导致手机漏看重要通知的顾虑）
 * 支持 Bark (iOS) / PushPlus (微信推送) / 飞书机器人 / 自定义 Webhook
 */
export async function pushUrgentMessageToMobile(
  msg: StoredMessage,
  config: AppConfig
): Promise<void> {
  if (!config.mobilePush.enabled || !config.mobilePush.webhookUrl) {
    return;
  }

  const shouldPush =
    (config.mobilePush.notifyOnAtMe && msg.is_at_me === 1) ||
    (config.mobilePush.notifyOnHighPriority && msg.is_high_priority === 1);

  if (!shouldPush) return;

  const title = `🚨 QQ重要消息: [${msg.group_name}]`;
  const body = `${msg.sender_name}: ${msg.clean_text}\n(原因: ${msg.priority_reason || '高优触发'})`;

  try {
    const url = config.mobilePush.webhookUrl.trim();
    if (config.mobilePush.type === 'bark') {
      // Bark 格式: https://api.day.app/YOUR_KEY/
      const base = url.replace(/\/+$/, '');
      await fetch(`${base}/${encodeURIComponent(title)}/${encodeURIComponent(body)}?group=QQDigest`);
    } else if (config.mobilePush.type === 'feishu') {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_type: 'text',
          content: { text: `${title}\n${body}` },
        }),
      });
    } else {
      // 通用 JSON Webhook / PushPlus
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: body,
          text: `${title}\n${body}`,
        }),
      });
    }
    console.log(`[MobilePush] 已向手机端推送高优消息提醒: ${title}`);
  } catch (err) {
    console.error('[MobilePush] 推送失败:', err);
  }
}
