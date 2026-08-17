#!/usr/bin/env node
/**
 * 整页截图，可指定亮/暗主题。
 *
 *   node scripts/shot.mjs <url> <输出文件> [light|dark] [宽度]
 *
 * 用 Chrome DevTools Protocol 而不是 --screenshot，因为：
 *   1. `--force-prefers-color-scheme` 在新版 Chrome 里不生效，
 *      得用 Emulation.setEmulatedMedia 才能可靠切主题；
 *   2. --screenshot 只能截固定视口，这里能截整页。
 */

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const [url, out, theme = 'light', width = '1280'] = process.argv.slice(2);
if (!url || !out) {
  console.error('用法: node scripts/shot.mjs <url> <out.png> [light|dark] [width]');
  process.exit(1);
}

// 端口错开，允许并行截多张
const PORT = 9222 + Number(process.hrtime.bigint() % 500n);

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-shot-profile-' + PORT,
    `--window-size=${width},900`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

/** 等 CDP 端口起来 */
async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(150);
    }
  }
  throw new Error('Chrome 没起来');
}

const ws = new WebSocket(await endpoint());
await new Promise((r) => (ws.onopen = r));

let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
};

function send(method, params = {}, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

// 开一个标签页并 attach
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const s = (m, p) => send(m, p, sessionId);

await s('Page.enable');
await s('Runtime.enable');

// 关键：模拟系统的深浅色偏好，站点的 @media (prefers-color-scheme) 会跟着走
await s('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-color-scheme', value: theme }],
});
await s('Emulation.setDeviceMetricsOverride', {
  width: Number(width),
  height: 900,
  deviceScaleFactor: 2,
  mobile: false,
});

// 导航并等网络和字体安定
const loaded = new Promise((resolve) => {
  const onMsg = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') {
      ws.removeEventListener('message', onMsg);
      resolve();
    }
  };
  ws.addEventListener('message', onMsg);
});
await s('Page.navigate', { url });
await loaded;
await s('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
await sleep(400);

// 按整页高度截
const { cssContentSize } = await s('Page.getLayoutMetrics');
const { data } = await s('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: true,
  clip: {
    x: 0,
    y: 0,
    width: cssContentSize.width,
    height: cssContentSize.height,
    scale: 1,
  },
});

await (await import('node:fs/promises')).writeFile(out, Buffer.from(data, 'base64'));
console.log(`${out}  ${theme}  ${Math.round(cssContentSize.width)}x${Math.round(cssContentSize.height)}`);

ws.close();
chrome.kill();
process.exit(0);
