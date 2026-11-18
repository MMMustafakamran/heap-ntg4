/**
 * HARNESS: the device mirror for the demo segment.
 *
 * A small local HTTP server (PROJECT.frontendUrl, default :8160) whose page shows the emulator
 * screen inside a phone frame, live, the way the Android Emulator window looks on a desktop.
 * The recorder's browser opens it as the demo "app" (demoUrl = <mirror>/?page=<id>); taps and
 * typing go to the device through adb (actions/android.actions.ts), never through this page.
 *
 * Frames:
 *  - `screenrecord` (default): `adb exec-out screenrecord --output-format=h264 -` piped through
 *    ffmpeg into MJPEG, split into JPEG frames. ~15-30 fps while the screen moves; screenrecord
 *    stops after 180 s, so it is restarted. Needs ffmpeg on PATH (or FFMPEG).
 *  - `screencap` (fallback, or ANDROID_MIRROR=screencap): `adb exec-out screencap -p` in a loop,
 *    ~3-6 fps. Used automatically when screenrecord/ffmpeg exits right away (some images lack it).
 * The page polls /frame (latest frame) ~10x a second and swaps it in without flicker.
 * Frames are grabbed only while someone polled in the last 3 s, so the doc/IDE segments and
 * the idle time between takes cost the device nothing.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { ADB, SERIAL, adbAsync, screenSize } from './adb';

let latest: { buf: Buffer; type: string; at: number } | null = null;
let lastPoll = 0;
let stopped = false;
const active = () => Date.now() - lastPoll < 3000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function screencapLoop(): Promise<void> {
  while (!stopped) {
    if (!active()) { await wait(200); continue; }
    try {
      const buf = await adbAsync('exec-out', 'screencap', '-p');
      if (buf.length > 1000) latest = { buf, type: 'image/png', at: Date.now() };
    } catch { await wait(500); }
  }
}

/** Runs screenrecord -> ffmpeg -> JPEG frames until it fails fast; resolves false then. */
async function screenrecordLoop(): Promise<boolean> {
  const ffmpeg = process.env.FFMPEG || 'ffmpeg';
  let size = '';
  while (!stopped) {
    if (!active()) { await wait(200); continue; }
    // Half resolution, multiple of 16 (encoder-friendly); read once, when the first take starts.
    if (!size) { try { const { w, h } = screenSize(); size = `${Math.round(w / 2 / 16) * 16}x${Math.round(h / 2 / 16) * 16}`; } catch {} }
    // One still first: screenrecord sends nothing until the screen changes.
    try { const b = await adbAsync('exec-out', 'screencap', '-p'); if (b.length > 1000) latest = { buf: b, type: 'image/png', at: Date.now() }; } catch {}
    const started = Date.now();
    let frames = 0;
    const rec: ChildProcess = spawn(ADB, ['-s', SERIAL, 'exec-out', 'screenrecord', '--output-format=h264',
      ...(size ? ['--size', size] : []), '--bit-rate', '6000000', '--time-limit', '180', '-'], { stdio: ['ignore', 'pipe', 'ignore'] });
    const ff: ChildProcess = spawn(ffmpeg, ['-loglevel', 'error', '-fflags', 'nobuffer', '-flags', 'low_delay',
      '-f', 'h264', '-i', 'pipe:0', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-q:v', '4', 'pipe:1'], { stdio: ['pipe', 'pipe', 'ignore'] });
    ff.on('error', () => {});
    rec.on('error', () => {});
    rec.stdout!.pipe(ff.stdin!).on('error', () => {});
    let acc = Buffer.alloc(0);
    ff.stdout!.on('data', (d: Buffer) => {
      acc = Buffer.concat([acc, d]);
      for (;;) {
        const s = acc.indexOf(Buffer.from([0xff, 0xd8]));
        if (s < 0) { acc = Buffer.alloc(0); break; }
        const e = acc.indexOf(Buffer.from([0xff, 0xd9]), s + 2);
        if (e < 0) { if (s > 0) acc = acc.subarray(s); break; }
        latest = { buf: Buffer.from(acc.subarray(s, e + 2)), type: 'image/jpeg', at: Date.now() };
        frames++;
        acc = acc.subarray(e + 2);
      }
    });
    // Stop when the take goes idle, or when either process ends.
    await new Promise<void>((done) => {
      const t = setInterval(() => { if (stopped || !active()) { rec.kill(); ff.kill(); } }, 500);
      ff.on('close', () => { clearInterval(t); rec.kill(); done(); });
      rec.on('close', () => { setTimeout(() => ff.kill(), 1500); });
    });
    if (!stopped && active() && frames === 0 && Date.now() - started < 5000) return false; // no screenrecord / ffmpeg
  }
  return true;
}

const PHONE_PAGE = (pageId: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>Android Emulator - ${SERIAL.replace(/[<>&"]/g, '')}</title>
<style>
  html,body{margin:0;height:100%;background:#202124;font-family:"Segoe UI",Roboto,sans-serif;overflow:hidden}
  .wrap{height:100%;display:flex;align-items:center;justify-content:center;gap:14px}
  .phone{position:relative;height:calc(100vh - 56px);aspect-ratio:var(--ar,0.45);background:#0b0b0c;border-radius:46px;
    padding:14px;box-shadow:0 0 0 2px #3c4043,0 18px 50px rgba(0,0,0,.55);box-sizing:border-box}
  .phone::before{content:"";position:absolute;top:22px;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#1b1b1d;z-index:2}
  #screen{display:block;width:100%;height:100%;object-fit:contain;border-radius:34px;background:#000}
  .side{display:flex;flex-direction:column;gap:6px;background:#2b2c2f;border-radius:10px;padding:8px 6px}
  .side span{width:30px;height:30px;border-radius:6px;background:#3c4043;display:block}
</style></head>
<body><div class="wrap">
  <div class="phone" id="phone"><img id="screen" alt=""></div>
  <div class="side" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
</div>
<script>
  // HARNESS mirror for page ${JSON.stringify(pageId)}: shows the device screen, nothing else.
  const img = document.getElementById('screen'); let busy = false;
  async function tick(){
    if (busy) return; busy = true;
    try {
      const r = await fetch('/frame?ts=' + Date.now(), { cache: 'no-store' });
      if (r.status === 200) {
        const url = URL.createObjectURL(await r.blob());
        const next = new Image();
        next.onload = () => {
          const old = img.src; img.src = url; if (old.startsWith('blob:')) URL.revokeObjectURL(old);
          document.getElementById('phone').style.setProperty('--ar', (next.naturalWidth + 28) / (next.naturalHeight + 28));
          img.dataset.w = next.naturalWidth; img.dataset.h = next.naturalHeight; img.dataset.live = '1';
        };
        next.src = url;
      }
    } catch (e) {}
    busy = false;
  }
  setInterval(tick, 100); tick();
</script></body></html>`;

let server: Server | null = null;

export async function startMirror(port: number): Promise<void> {
  if (server) return;
  stopped = false;
  server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://x');
    if (url.pathname === '/frame') {
      lastPoll = Date.now();
      if (!latest) { res.writeHead(204).end(); return; }
      res.writeHead(200, { 'content-type': latest.type, 'cache-control': 'no-store' }).end(latest.buf);
      return;
    }
    if (url.pathname === '/health') { res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true, serial: SERIAL, frameAgeMs: latest ? Date.now() - latest.at : null })); return; }
    if (url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(PHONE_PAGE(url.searchParams.get('page') || ''));
  });
  await new Promise<void>((ok, bad) => { server!.once('error', bad); server!.listen(port, () => ok()); });
  const mode = process.env.ANDROID_MIRROR || 'screenrecord';
  void (async () => {
    if (mode !== 'screencap' && (await screenrecordLoop())) return;
    if (!stopped) { console.log('   📱 mirror: screenrecord unavailable, using screencap frames'); await screencapLoop(); }
  })();
  console.log(`   📱 Device mirror for ${SERIAL} on http://localhost:${port} (${mode})`);
}

export function stopMirror(): void {
  stopped = true;
  server?.close();
  server = null;
}
