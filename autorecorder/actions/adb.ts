/**
 * adb helpers for the Android demo segment. Same approach as tools/probe-android.mts:
 * deep link, uiautomator dump, tap by text, `input text`, screencap.
 * Works on Windows (SDK under %LOCALAPPDATA%) and Linux CI (ANDROID_HOME / adb on PATH).
 */
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SDK = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  (process.platform === 'win32' ? join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk') : '');
const ADB_IN_SDK = SDK ? join(SDK, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : '';
export const ADB = ADB_IN_SDK && existsSync(ADB_IN_SDK) ? ADB_IN_SDK : 'adb';
export const SERIAL = process.env.ANDROID_SERIAL || 'emulator-5554';
export const PKG = 'com.mycopilotapp';
export const DEEP_LINK = (id: string) => `copilotqa://page/${id}`;

export const adb = (...a: string[]): Buffer => execFileSync(ADB, ['-s', SERIAL, ...a], { maxBuffer: 64 << 20 });
export const sh = (cmd: string): string => adb('shell', cmd).toString();

/** Async variant (used by the mirror so frame grabs never block the recorder's event loop). */
export function adbAsync(...a: string[]): Promise<Buffer> {
  return new Promise((res, rej) =>
    execFile(ADB, ['-s', SERIAL, ...a], { encoding: 'buffer', maxBuffer: 64 << 20 }, (err, out) => (err ? rej(err) : res(out))),
  );
}

export function deviceOnline(): boolean {
  try { return adb('get-state').toString().includes('device'); } catch { return false; }
}

export type UiNode = { text: string; desc: string; cls: string; bounds: [number, number, number, number] };
const unesc = (s: string) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#10;/g, '\n').replace(/&amp;/g, '&');

export function dump(): { xml: string; nodes: UiNode[] } {
  try { sh('uiautomator dump /sdcard/ui.xml >/dev/null 2>&1'); } catch {}
  let xml = '';
  try { xml = adb('exec-out', 'cat', '/sdcard/ui.xml').toString(); } catch {}
  const nodes: UiNode[] = [];
  for (const m of xml.matchAll(/<node [^>]*>/g)) {
    const a = (k: string) => m[0].match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? '';
    const b = a('bounds').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    nodes.push({ text: unesc(a('text')), desc: unesc(a('content-desc')), cls: a('class'), bounds: b ? [+b[1], +b[2], +b[3], +b[4]] : [0, 0, 0, 0] });
  }
  return { xml, nodes };
}

export const center = (n: UiNode): [number, number] => [Math.round((n.bounds[0] + n.bounds[2]) / 2), Math.round((n.bounds[1] + n.bounds[3]) / 2)];
export const texts = (nodes: UiNode[]) => nodes.map((n) => n.text || n.desc).filter(Boolean);
export const byLabel = (nodes: UiNode[], label: string) =>
  nodes.find((n) => (n.text || n.desc).trim().toLowerCase() === label.toLowerCase());
export const tapXY = (x: number, y: number) => sh(`input tap ${x} ${y}`);

/** adb `input text`: spaces as %s, shell metacharacters escaped (as in probe-android.mts). */
export const inputText = (t: string) =>
  sh(`input text "${t.replace(/(["\\$`])/g, '\\$1').replace(/ /g, '%s').replace(/([&|;<>()'])/g, '\\$1')}"`);

/** Device screen size in pixels (`wm size`, override wins). */
export function screenSize(): { w: number; h: number } {
  const out = sh('wm size');
  const m = out.match(/Override size:\s*(\d+)x(\d+)/) || out.match(/Physical size:\s*(\d+)x(\d+)/);
  return m ? { w: +m[1], h: +m[2] } : { w: 1080, h: 2400 };
}

export function openDeepLink(id: string): void {
  try { sh('logcat -c'); } catch {}
  sh(`am force-stop ${PKG}`);
  sh(`am start -W -a android.intent.action.VIEW -d "${DEEP_LINK(id)}" ${PKG}`);
}

export const appAlive = () => { try { return sh(`pidof ${PKG}`).trim() !== ''; } catch { return false; } };
export const logcat = () =>
  adb('logcat', '-d', '-v', 'time', 'ReactNativeJS:V', 'ReactNative:V', 'AndroidRuntime:E', '*:S').toString();

/** RN red box / LogBox texts that mean the page crashed. Same test as the probe. */
export const isRedbox = (t: string) =>
  /^(Render Error|Uncaught Error|Console Error)$/.test(t) || /is not a function|undefined is not|Cannot read propert/.test(t);

/**
 * One device, several callers (the probe shares the emulator): the same lock dir as
 * tools/probe-android.mts (<repo>/out/.lock-<serial>), so a take and a probe never interleave.
 */
export async function withDeviceLock<T>(repoRoot: string, fn: () => Promise<T>): Promise<T> {
  const outDir = join(repoRoot, 'out');
  const lock = join(outDir, `.lock-${SERIAL}`);
  mkdirSync(outDir, { recursive: true });
  for (;;) {
    try { mkdirSync(lock); break; } catch {
      try { if (Date.now() - statSync(lock).mtimeMs > 600_000) { rmSync(lock, { recursive: true, force: true }); continue; } } catch {}
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  try { return await fn(); } finally { rmSync(lock, { recursive: true, force: true }); }
}
