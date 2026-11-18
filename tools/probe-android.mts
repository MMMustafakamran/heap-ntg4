// HARNESS tool: the Android counterpart of .qa/tools/probe.mts (that one drives a browser page).
// Opens a doc page in the app by deep link, optionally types a prompt and taps a button, waits
// for the screen to settle, and saves evidence:
//   out/probe/<page>/final.png, shot-<t>s.png (every 5 s), ui.xml (final view tree),
//   logcat.txt (ReactNativeJS + crashes), result.json (texts on screen, errors, timing).
// Usage (from the repo root, emulator running, app installed, servers up):
//   npx tsx tools/probe-android.mts <page-id>... [--prompt "..."] [--tap Send] [--serial emulator-5554]
//        [--timeout 120] [--settle 12] [--no-input]
// Without --prompt it uses the default from tools/probe-prompts.json (page id -> {prompt, tap}).
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);
const valued = new Set(["prompt", "tap", "serial", "timeout", "settle"]);
const ids = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]?.slice(2) ?? ""));
const SDK = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
const ADB = path.join(SDK, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb");
const SERIAL = opt("serial", process.env.ANDROID_SERIAL || "emulator-5554")!;
const PKG = "com.mycopilotapp";
const TIMEOUT = Number(opt("timeout", "120")) * 1000;
const SETTLE = Number(opt("settle", "12")) * 1000;
const prompts: Record<string, { prompt?: string; tap?: string }> =
  fs.existsSync("tools/probe-prompts.json") ? JSON.parse(fs.readFileSync("tools/probe-prompts.json", "utf8")) : {};

const adb = (...a: string[]) => execFileSync(ADB, ["-s", SERIAL, ...a], { maxBuffer: 64 << 20 });
const sh = (cmd: string) => adb("shell", cmd).toString();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Node = { text: string; desc: string; cls: string; bounds: [number, number, number, number] };
function dump(): { xml: string; nodes: Node[] } {
  sh("uiautomator dump /sdcard/ui.xml >/dev/null 2>&1");
  const xml = adb("exec-out", "cat", "/sdcard/ui.xml").toString();
  const nodes: Node[] = [];
  for (const m of xml.matchAll(/<node [^>]*>/g)) {
    const a = (k: string) => m[0].match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? "";
    const b = a("bounds").match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    nodes.push({ text: unesc(a("text")), desc: unesc(a("content-desc")), cls: a("class"), bounds: b ? [+b[1], +b[2], +b[3], +b[4]] as any : [0, 0, 0, 0] });
  }
  return { xml, nodes };
}
const unesc = (s: string) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#10;/g, "\n").replace(/&amp;/g, "&");
const center = (n: Node) => [Math.round((n.bounds[0] + n.bounds[2]) / 2), Math.round((n.bounds[1] + n.bounds[3]) / 2)];
const tap = (n: Node) => { const [x, y] = center(n); sh(`input tap ${x} ${y}`); };
// adb `input text` needs spaces as %s and shell metacharacters escaped
const typeText = (t: string) => sh(`input text "${t.replace(/(["\\$`])/g, "\\$1").replace(/ /g, "%s").replace(/([&|;<>()'])/g, "\\$1")}"`);
const shot = (file: string) => fs.writeFileSync(file, adb("exec-out", "screencap", "-p"));
const texts = (nodes: Node[]) => nodes.map((n) => n.text || n.desc).filter(Boolean);

async function probe(id: string) {
  const out = path.join("out", "probe", id);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  const res: any = { page: id, serial: SERIAL, startedAt: new Date().toISOString(), steps: [], errors: [] };
  const step = (s: string) => { res.steps.push({ t: +((Date.now() - t0) / 1000).toFixed(1), s }); console.log(`[${id}] ${s}`); };

  sh("logcat -c");
  sh(`am force-stop ${PKG}`);
  sh(`am start -W -a android.intent.action.VIEW -d "copilotqa://page/${id}" ${PKG}`);
  step("opened by deep link");
  const shots = setInterval(() => { try { shot(path.join(out, `shot-${Math.round((Date.now() - t0) / 1000)}s.png`)); } catch {} }, 5000);
  await sleep(6000);

  const cfg = prompts[id] || {};
  const prompt = opt("prompt", cfg.prompt);
  const tapLabel = opt("tap", cfg.tap ?? "Send");
  let before = dump();
  // first open of a page builds its bundle and renders slowly: wait up to 45 s for the input
  for (let i = 0; prompt && !flag("no-input") && i < 13 && !before.nodes.some((n) => n.cls.endsWith("EditText")); i++) {
    await sleep(3000); before = dump();
  }
  if (prompt && !flag("no-input")) {
    const input = before.nodes.find((n) => n.cls.endsWith("EditText"));
    if (!input) { res.errors.push("no text input on screen"); step("no EditText found"); }
    else {
      tap(input); await sleep(500); typeText(prompt); step(`typed: ${prompt}`);
      await sleep(500);
      const cur = dump();
      const btn = cur.nodes.find((n) => (n.text || n.desc).trim().toLowerCase() === tapLabel!.toLowerCase());
      if (btn) { tap(btn); step(`tapped "${tapLabel}"`); }
      else { sh("input keyevent 66"); step(`no "${tapLabel}" button, pressed Enter`); }
    }
  } else if (tapLabel && opt("tap")) {
    const btn = before.nodes.find((n) => (n.text || n.desc).trim().toLowerCase() === tapLabel.toLowerCase());
    if (btn) { tap(btn); step(`tapped "${tapLabel}"`); } else res.errors.push(`no "${tapLabel}" button`);
  }

  // settle: the visible text stops changing for SETTLE ms, or TIMEOUT
  let last = JSON.stringify(texts(dump().nodes)), stableSince = Date.now();
  while (Date.now() - t0 < TIMEOUT) {
    await sleep(3000);
    const now = JSON.stringify(texts(dump().nodes));
    if (now !== last) { last = now; stableSince = Date.now(); }
    else if (Date.now() - stableSince >= SETTLE) break;
  }
  clearInterval(shots);
  const fin = dump();
  shot(path.join(out, "final.png"));
  fs.writeFileSync(path.join(out, "ui.xml"), fin.xml);
  const log = adb("logcat", "-d", "-v", "time", "ReactNativeJS:V", "ReactNative:V", "AndroidRuntime:E", "*:S").toString();
  fs.writeFileSync(path.join(out, "logcat.txt"), log);

  res.durationS = +((Date.now() - t0) / 1000).toFixed(1);
  res.screenTexts = texts(fin.nodes);
  res.settled = Date.now() - stableSince >= SETTLE;
  res.appAlive = sh(`pidof ${PKG}`).trim() !== "";
  res.logErrors = log.split("\n").filter((l) => /^\S+ \S+ E\/|FATAL|Error:|TypeError|ReferenceError|Unhandled/.test(l)).slice(0, 40);
  res.redbox = res.screenTexts.some((t: string) => /^(Render Error|Uncaught Error|Error|Console Error)$/.test(t) || /is not a function|undefined is not|Cannot read propert/.test(t));
  fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(res, null, 1));
  step(`done in ${res.durationS}s, ${res.screenTexts.length} texts, ${res.logErrors.length} log errors${res.redbox ? ", RED BOX" : ""}`);
}

if (!ids.length) { console.error("usage: npx tsx tools/probe-android.mts <page-id>... [--prompt ..]"); process.exit(2); }
if (!spawnSync(ADB, ["-s", SERIAL, "get-state"]).stdout?.toString().includes("device")) { console.error(`no device ${SERIAL}`); process.exit(2); }
// One device, several callers (2 probe agents share one emulator: RAM limit): a lock dir makes them
// take turns per page. mkdir is atomic; a lock older than 10 min is stale and is taken over.
const LOCK = path.join("out", `.lock-${SERIAL}`);
async function withLock(fn: () => Promise<void>) {
  fs.mkdirSync("out", { recursive: true });
  for (;;) {
    try { fs.mkdirSync(LOCK); break; } catch {
      try { if (Date.now() - fs.statSync(LOCK).mtimeMs > 600_000) { fs.rmSync(LOCK, { recursive: true, force: true }); continue; } } catch {}
      await sleep(2000);
    }
  }
  try { await fn(); } finally { fs.rmSync(LOCK, { recursive: true, force: true }); }
}
for (const id of ids) await withLock(() => probe(id)); // pages run one after another
