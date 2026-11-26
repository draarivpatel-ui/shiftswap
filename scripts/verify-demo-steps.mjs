#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
  return acc;
}, []));
for (const need of ['url', 'steps']) {
  if (!args[need]) { console.error(`missing --${need}`); process.exit(2); }
}
const fast = args.fast !== '0';
const W = 1920;
const H = 1080;
const steps = JSON.parse(readFileSync(args.steps, 'utf8'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = mkdtempSync(join(tmpdir(), 'shiftswap-verify-profile-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--user-data-dir=${profile}`, '--remote-debugging-port=0',
  '--no-first-run', '--no-default-browser-check', '--mute-audio', '--hide-scrollbars',
  `--window-size=${W},${H}`, '--force-color-profile=srgb', 'about:blank',
], { stdio: 'ignore' });

async function shutdown(code) {
  if (chrome.exitCode === null) {
    const gone = new Promise((r) => chrome.once('exit', r));
    chrome.kill('SIGTERM');
    await Promise.race([gone, new Promise((r) => setTimeout(r, 3000))]);
    if (chrome.exitCode === null) chrome.kill('SIGKILL');
  }
  rmSync(profile, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 });
  process.exit(code);
}
process.on('unhandledRejection', async (e) => { console.error(e); await shutdown(1); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let port;
for (let i = 0; i < 100 && !port; i++) {
  await sleep(100);
  const f = join(profile, 'DevToolsActivePort');
  if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0].trim();
}
if (!port) { console.error('Chrome did not start'); await shutdown(1); }
const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const ws = new WebSocket(webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++msgId;
  pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
});
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id);
    m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
  }
};
await new Promise((r, x) => { ws.onopen = r; ws.onerror = x; });
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId: sid } = await send('Target.attachToTarget', { targetId, flatten: true });
const page = (method, params) => send(method, params, sid);
await page('Page.enable');
await page('Runtime.enable');
await page('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await page('Emulation.setFocusEmulationEnabled', { enabled: true });
await page('Page.navigate', { url: args.url });
await sleep(1800);
await page('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });

const js = async (expression) => {
  const r = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
const probe = (sel) => js(`(() => {
  const e = document.querySelector(${JSON.stringify(sel)});
  if (!e) return { missing: true, ok: false };
  const b = e.getBoundingClientRect();
  const x = b.left + b.width / 2, y = b.top + b.height / 2;
  const h = document.elementFromPoint(x, y);
  const inView = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight;
  return { x, y, width: b.width, height: b.height, inView,
    hit: h ? (h.id || h.tagName.toLowerCase()) : null,
    ok: inView && !!h && (h === e || e.contains(h)), disabled: !!e.disabled };
})()`);
const mouse = (type, x, y) => page('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
const smoothScroll = (dy, ms) => js(`new Promise((done) => {
  const y0 = scrollY, t0 = performance.now(), max = document.documentElement.scrollHeight - innerHeight;
  const to = Math.max(0, Math.min(max, y0 + ${dy}));
  const ease = (p) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  (function f() { const p = Math.min(1, (performance.now() - t0) / ${ms});
    scrollTo(0, y0 + (to - y0) * ease(p)); if (p < 1) requestAnimationFrame(f); else done(); })();
})`);

const failures = [];
const t0 = Date.now();
async function requireHit(sel, action) {
  const p = await probe(sel);
  if (!p.ok || p.disabled) {
    failures.push(`${action} target ${sel}: ${JSON.stringify(p)}`);
    return null;
  }
  return p;
}

for (const [index, st] of steps.entries()) {
  const label = `${index + 1}/${steps.length} ${st.do} ${st.selector || ''}`;
  switch (st.do) {
    case 'at': {
      if (fast) await sleep(80);
      else {
        const wait = st.s * 1000 - (Date.now() - t0);
        if (wait > 0) await sleep(wait);
      }
      break;
    }
    case 'wait': await sleep(fast ? Math.min(st.ms, 180) : st.ms); break;
    case 'scrollTo': {
      const top = await js(`document.querySelector(${JSON.stringify(st.selector)}).getBoundingClientRect().top`);
      await smoothScroll(top - (st.offset ?? 80), fast ? Math.min(st.ms ?? 1600, 500) : (st.ms ?? 1600));
      break;
    }
    case 'scrollBy': await smoothScroll(st.y, fast ? Math.min(st.ms ?? 1200, 500) : (st.ms ?? 1200)); break;
    case 'move': {
      const p = await requireHit(st.selector, 'move');
      if (p) await sleep(fast ? 90 : (st.ms ?? 700));
      break;
    }
    case 'click': {
      const p = await requireHit(st.selector, 'click');
      if (p) {
        await mouse('mouseMoved', p.x, p.y);
        await mouse('mousePressed', p.x, p.y);
        await mouse('mouseReleased', p.x, p.y);
        await sleep(260);
      }
      break;
    }
    case 'select': {
      const p = await requireHit(st.selector, 'select');
      if (p) await js(`(() => { const e = document.querySelector(${JSON.stringify(st.selector)});
        e.value = ${JSON.stringify(st.value)}; e.dispatchEvent(new Event('input', { bubbles: true }));
        e.dispatchEvent(new Event('change', { bubbles: true })); })()`);
      await sleep(120);
      break;
    }
    case 'type': {
      const p = await requireHit(st.selector, 'type');
      if (p) {
        await js(`document.querySelector(${JSON.stringify(st.selector)}).focus()`);
        for (const ch of st.text) { await page('Input.insertText', { text: ch }); await sleep(fast ? 5 : 1000 / (st.cps ?? 14)); }
      }
      break;
    }
    case 'key': await page('Input.dispatchKeyEvent', { type: 'keyDown', key: st.key });
      await page('Input.dispatchKeyEvent', { type: 'keyUp', key: st.key }); break;
    case 'eval': await js(st.js); break;
    default: failures.push(`unknown step ${st.do}`);
  }
  console.log(`ok ${label}`);
}

const finalState = await js(`(() => ({
  revision: document.querySelector('#revision-number')?.textContent.trim(),
  payload: document.querySelector('#print-payload')?.textContent || '',
  accepted: document.querySelector('#validation-results')?.textContent || ''
}))()`);
if (finalState.revision !== '2') failures.push(`final revision was ${finalState.revision}, expected 2`);
if (!finalState.payload.includes('Revision 2')) failures.push('print payload did not reach revision 2');
if (!finalState.accepted.includes('Trade accepted')) failures.push('accepted trade message missing');

ws.close();
if (failures.length) {
  console.error(failures.join('\n'));
  await shutdown(1);
}
console.log(`verified ${steps.length} steps at ${W}x${H}; final revision ${finalState.revision}`);
await shutdown(0);
