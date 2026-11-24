/**
 * Demo segment on the Android emulator. The recorder's browser shows the device mirror
 * (android-mirror.ts); everything the "person" does goes to the device through adb:
 * open the page by deep link, tap the composer, type the prompt at a human pace, tap send,
 * wait for the screen to settle. The cursor glides to the matching spot on the mirrored
 * screen before each tap, so the clip reads like someone clicking in the emulator window.
 *
 * Same verdicts as tools/probe-android.mts: red box, app died, no reply -> ctx.fail.
 * The device's logcat for the take is appended to <repo>/logs/android-logcat.log, so the
 * failure terminal (core/failure-terminal.ts reads <repo>/logs) can show it.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Page } from 'playwright';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { checkpoint, logAction, mark } from '../core/timeline';
import { type DocEvidence, showFinding } from './doc-evidence';
import { registerDocEvidence } from '../core/doc-evidence';
import {
  appAlive, byLabel, center, dump, inputText, isRedbox, logcat, openDeepLink, sh, tapXY, texts, withDeviceLock,
  type UiNode,
} from './adb';

/** Finding clips (❌/⚠️, level 1): doc highlight before the IDE, Notepad after the demo. Filled per page. */
export const FINDING_NOTES: Record<string, string> = {
  quickstart: `this is the antigravity react native quickstart, it should give u a chat running on an antigravity agent
but the runtime only registers a built in openai agent, model openai gpt 6 luna
the chat works but its not antigravity at all
page never shows how to serve the antigravity agent or hook it into the runtime
had to guess the backend and an httpagent from ag-ui client which no install step names`,
  hitl: `page says tap a slot and the agent confirms the time u picked
the card shows up fine, tue 9 am wed 2 pm none of these work
but tapping a slot does nothing visible, no done line, no reply, card stays open
the tap never sends anything back, no second request reaches the agent
so the run just stays paused`,
  subagents: `page says the delegation log renders live as the supervisor calls sub agents
but theres no react native code for the log at all, just one sentence
had to write the whole frontend myself
and the agent imports httpx which the install step never installs`,
};
export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  quickstart: [
    { text: 'model: "openai:gpt-6-luna",', caption: 'Only a built-in OpenAI agent; no Antigravity agent (FINDINGS.md #1)' },
  ],
  hitl: [
    { text: 'Tap a slot, and the agent confirms the time you picked', caption: 'Tapping a slot never completes (FINDINGS.md #10)' },
  ],
  subagents: [
    { text: 'On the frontend, the delegation log is a reactive render of the', caption: 'No frontend code for the log (FINDINGS.md #14)' },
  ],
};
/** Level 2 (already reported): clip ends after the demo. */
export const KNOWN_ISSUE = new Set<string>([]);
registerDocEvidence(FINDING_EVIDENCE, { skip: KNOWN_ISSUE });

/** Pages whose composer is the doc's own ChatScreen with a "Send" button; the rest use CopilotChat's "↑". */
const SEND_LABEL: Record<string, string> = {
  quickstart: 'Send', 'headless-ui': 'Send', markdown: 'Send', 'multimodal-attachments': 'Send',
};

/** Steps after the reply settles: tap a node by its text, wait N seconds, or wait until a text shows up. */
type ThenStep = { tap?: string; wait?: number; waitfor?: string; timeout?: number; /** device px: x1,y1,x2,y2 */ swipe?: [number, number, number, number];
  /** HARNESS: press Back only while the soft keyboard is up (it covered the swipe area) */ hideKeyboard?: boolean;
  /** HARNESS: swipe the sheet up (up to N times) until a text field shows; CI's emulator is slower and smaller than the local one */ revealInput?: number };
type PromptCfg = { prompt?: string; tap?: string; settle?: number; timeout?: number; noInput?: boolean; then?: ThenStep[];
  /** steps before typing (e.g. open a modal) */ before?: ThenStep[]; /** which text field is the chat composer */ input?: 'first' | 'last';
  /** HARNESS: hide the soft keyboard before tapping Send (the doc's composer sits under the keyboard; a person closes it first) */ hideKeyboardBeforeSend?: boolean };

/** First node whose text/desc equals the label, else the first one containing it (case-insensitive). */
function findText(nodes: UiNode[], label: string): UiNode | undefined {
  const l = label.trim().toLowerCase();
  return byLabel(nodes, label) ?? nodes.find((n) => (n.text || n.desc).toLowerCase().includes(l) && n.bounds[2] > n.bounds[0]);
}
async function waitForText(label: string, timeoutS: number): Promise<UiNode | undefined> {
  const end = Date.now() + timeoutS * 1000;
  for (;;) {
    const n = findText(dump().nodes, label);
    if (n || Date.now() > end) return n;
    await sleep(1500);
  }
}
/** One before/then step: wait for a text, tap a node by its text (glide-click on the mirror), or wait. */
async function runStep(page: Page, step: ThenStep, ctx: ActionContext): Promise<void> {
  if (step.waitfor) {
    const n = await waitForText(step.waitfor, step.timeout ?? 60);
    logAction('waitfor', step.waitfor, n ? 'ok' : 'timeout');
    if (!n) ctx.warn(`"${step.waitfor}" never showed up on screen`);
  }
  if (step.tap) {
    const n = await waitForText(step.tap, step.timeout ?? 10);
    if (n) { const d = deviceSize(dump().nodes); await tapNode(page, n, step.tap, d.w, d.h); }
    else ctx.warn(`No "${step.tap}" on screen to tap`);
    await sleep(1500);
  }
  if (step.hideKeyboard && /mInputShown=true/.test(sh('dumpsys input_method'))) { sh('input keyevent 4'); logAction('key', 'back (hide keyboard)'); await sleep(1000); }
  if (step.swipe) { const [a, b, c, d] = toDevicePx(step.swipe); sh(`input swipe ${a} ${b} ${c} ${d} 600`); logAction('swipe', `${a},${b},${c},${d}`); await sleep(1500); }
  if (step.revealInput) {
    // HARNESS: the sheet opens half-way and its composer can sit below the fold; swipe up until a text field shows.
    for (let i = 0; i < step.revealInput && !dump().nodes.some((n) => n.cls.endsWith('EditText')); i++) {
      const [a, b, c, d] = toDevicePx([0.5, 0.8, 0.5, 0.15]);
      sh(`input swipe ${a} ${b} ${c} ${d} 600`); logAction('swipe', `reveal input ${i + 1}`); await sleep(2500);
    }
  }
  if (step.wait) await sleep(step.wait * 1000);
}
/** Swipe coords: values <= 1 are fractions of the device screen (CI's emulator is 320x640, the local one 1080x2400). */
function toDevicePx(v: [number, number, number, number]): [number, number, number, number] {
  if (v.some((x) => x > 1)) return v;
  const { w, h } = deviceSize(dump().nodes);
  return [Math.round(v[0] * w), Math.round(v[1] * h), Math.round(v[2] * w), Math.round(v[3] * h)];
}
/** tools/probe-prompts.json (main session keeps it), read per take so edits apply without a restart. */
function promptFor(root: string, config: PageRecordConfig): PromptCfg {
  const file = join(root, 'tools', 'probe-prompts.json');
  let all: Record<string, PromptCfg> = {};
  try { if (existsSync(file)) all = JSON.parse(readFileSync(file, 'utf8')); } catch {}
  const p = all[config.id] ?? {};
  return { ...p, prompt: p.prompt ?? config.prompt, tap: p.tap ?? SEND_LABEL[config.id] ?? '↑' };
}

/** Device pixel -> viewport point on the mirrored screen (<img id="screen">, object-fit: contain). */
async function toViewport(page: Page, x: number, y: number, devW: number, devH: number): Promise<{ x: number; y: number } | null> {
  return page.evaluate(([dx, dy, dw, dh]) => {
    const img = document.getElementById('screen') as HTMLImageElement | null;
    if (!img) return null;
    const r = img.getBoundingClientRect();
    const s = Math.min(r.width / dw, r.height / dh);
    const ox = r.left + (r.width - dw * s) / 2, oy = r.top + (r.height - dh * s) / 2;
    return { x: ox + dx * s, y: oy + dy * s };
  }, [x, y, devW, devH]).catch(() => null);
}

/** Glide to a node on the mirrored screen, click (visual only), tap it on the device. */
async function tapNode(page: Page, node: UiNode, what: string, devW: number, devH: number): Promise<void> {
  const [x, y] = center(node);
  mark('click', what);
  const pt = await toViewport(page, x, y, devW, devH);
  if (pt) { await humanGlide(page, pt.x, pt.y, 22); await humanClick(page); }
  tapXY(x, y);
  logAction('tap', what, 'ok', { x, y });
}

/** Human-paced typing through adb: 1-3 characters per `input text`, small pauses, a longer one now and then. */
async function typeHuman(prompt: string): Promise<void> {
  let i = 0;
  while (i < prompt.length) {
    const n = 1 + Math.floor(Math.random() * 3);
    const chunk = prompt.slice(i, i + n);
    i += n;
    inputText(chunk);
    await sleep(60 + Math.random() * 120 + (chunk.includes(' ') && Math.random() < 0.15 ? 350 : 0));
  }
}

/**
 * Prompt entry on React Native (owner, 2026-11-20): pasted in one go (a single adb `input text`),
 * no per-character typing effect. Set ANDROID_TYPE=human to get the old typeHuman pacing back.
 */
async function pastePrompt(prompt: string): Promise<void> {
  if (process.env.ANDROID_TYPE === 'human') return typeHuman(prompt);
  await sleep(300 + Math.random() * 300);
  inputText(prompt);
  await sleep(400);
}

/** Device size as the screenshots see it (uiautomator bounds use the same pixels). */
function deviceSize(nodes: UiNode[]): { w: number; h: number } {
  const root = nodes[0]?.bounds;
  return root && root[2] > 0 ? { w: root[2], h: root[3] } : { w: 1080, h: 2400 };
}

/**
 * The standard Android take: deep link, prompt, send, settle. Returns the final screen texts.
 * The device lock is held for the whole demo, so a probe on the same emulator waits.
 */
export async function runAndroidChat(page: Page, config: PageRecordConfig, root: string, ctx: ActionContext): Promise<string[]> {
  return withDeviceLock(root, async () => {
    const cfg = promptFor(root, config);
    const timeoutMs = (cfg.timeout ?? 120) * 1000;
    const settleMs = (cfg.settle ?? 12) * 1000;
    const t0 = Date.now();

    // HARNESS (recorder): go to the home screen first so the previous page's stale screen isn't on camera while the deep link loads.
    sh('input keyevent 3'); await sleep(1500);
    openDeepLink(config.id);
    logAction('deeplink', `copilotqa://page/${config.id}`);
    await sleep(6000);

    // Optional steps before the prompt (tools/probe-prompts.json `before`), e.g. open a bottom sheet.
    for (const step of cfg.before ?? []) await runStep(page, step, ctx);
    if (cfg.before?.length) logAction('screen', 'after before-steps', 'ok', { texts: texts(dump().nodes).slice(0, 20) });

    let screen = dump();
    // HARNESS (recorder): CI's dev build sometimes can't reach Metro on the first load ("Cannot connect to Metro",
    // "Fast Refresh disconnected" over a blank screen). Wait and reopen the deep link, up to 3 times.
    for (let r = 0; r < 3 && texts(screen.nodes).some((t) => /cannot connect to metro|disconnected from metro|fast refresh disconnected/i.test(t)); r++) {
      logAction('check', 'metro not connected, reopening deep link', `retry ${r + 1}`);
      await sleep(5000);
      openDeepLink(config.id);
      await sleep(8000);
      screen = dump();
    }
    // The dev build loads its JS bundle from Metro first: wait (up to 60 s) for the page's composer to appear.
    if (cfg.prompt && !cfg.noInput) {
      const until = Date.now() + 60_000;
      while (!screen.nodes.some((n) => n.cls.endsWith('EditText')) && Date.now() < until) {
        await sleep(2000);
        screen = dump();
      }
    }
    // HARNESS (recorder): the Metro banner can also show up only after the composer did (bundle load timed out).
    // Settle a few seconds, then reopen the deep link and wait for the composer again, up to 2 times.
    if (cfg.prompt && !cfg.noInput) {
      for (let r = 0; r < 2; r++) {
        await sleep(4000);
        screen = dump();
        if (!texts(screen.nodes).some((t) => /cannot connect to metro|disconnected from metro|fast refresh disconnected/i.test(t))) break;
        logAction('check', 'metro disconnected after load, reopening deep link', `retry ${r + 1}`);
        sh('am force-stop com.mycopilotapp');
        await sleep(3000);
        openDeepLink(config.id);
        const until2 = Date.now() + 90_000;
        await sleep(8000);
        screen = dump();
        while (!screen.nodes.some((n) => n.cls.endsWith('EditText')) && Date.now() < until2) { await sleep(2000); screen = dump(); }
      }
    }
    const { w, h } = deviceSize(screen.nodes);
    let sentAt = 0;
    let afterSend: string[] = [];

    if (cfg.prompt && !cfg.noInput) {
      const inputs = screen.nodes.filter((n) => n.cls.endsWith('EditText'));
      const input = cfg.input === 'last' ? inputs[inputs.length - 1] : inputs[0];
      if (!input) {
        ctx.fail('No text input on the app screen');
      } else {
        await tapNode(page, input, 'composer', w, h);
        await sleep(600);
        mark('action', `type: ${cfg.prompt}`);
        await pastePrompt(cfg.prompt);
        await sleep(700);
        if (cfg.hideKeyboardBeforeSend && /mInputShown=true/.test(sh('dumpsys input_method'))) {
          sh('input keyevent 4'); logAction('key', 'back (hide keyboard before send)'); await sleep(1200);
        }
        screen = dump();
        const label = cfg.tap!;
        const btn = byLabel(screen.nodes, label) ?? byLabel(screen.nodes, label === 'Send' ? '↑' : 'Send');
        // Baseline = screen before sending: a fast reply can land within the 2 s below.
        afterSend = texts(screen.nodes);
        if (btn) await tapNode(page, btn, `send (${label})`, w, h);
        else { sh('input keyevent 66'); logAction('key', 'enter (no send button)'); }
        sentAt = Date.now();
        await sleep(2000);
        // HARNESS: if the prompt still sits in the composer, the Send tap didn't land (the doc's composer is at the
        // very bottom edge, next to the gesture bar on CI's small emulator): tap once more on the button's upper part.
        if (btn && cfg.hideKeyboardBeforeSend) {
          const now = dump().nodes;
          const still = now.some((n) => n.cls.endsWith('EditText') && n.text === cfg.prompt);
          const b2 = byLabel(now, label);
          logAction('check', 'prompt left in composer after send', still ? 'yes' : 'no', { texts: texts(now).slice(0, 12) });
          for (let k = 0; k < 3 && still && b2; k++) {
            if (k) { await sleep(3000); if (!dump().nodes.some((n) => n.cls.endsWith('EditText') && n.text === cfg.prompt)) break; }
            const x = Math.round((b2.bounds[0] + b2.bounds[2]) / 2), y = b2.bounds[1] + Math.max(2, Math.round((b2.bounds[3] - b2.bounds[1]) / 4));
            mark('click', `send again (${label})`); tapXY(x, y); logAction('tap', `send again (${label})`, 'ok', { x, y });
            await sleep(2000);
          }
        }
      }
    } else if (cfg.tap && cfg.noInput) {
      const btn = byLabel(screen.nodes, cfg.tap);
      if (btn) await tapNode(page, btn, cfg.tap, w, h);
      else ctx.warn(`No "${cfg.tap}" button on screen`);
    }

    // Settle: visible text stops changing for settleMs, or the timeout. The cursor idles meanwhile.
    let last = JSON.stringify(texts(dump().nodes)), stableSince = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      await sleep(3000);
      const now = JSON.stringify(texts(dump().nodes));
      if (now !== last) { last = now; stableSince = Date.now(); }
      else if (Date.now() - stableSince >= settleMs) break;
    }

    // Optional follow-up steps (tools/probe-prompts.json `then`), each tap a glide-click on the mirror.
    for (const step of cfg.then ?? []) await runStep(page, step, ctx);

    const finalTexts = texts(dump().nodes);
    const alive = appAlive();
    const red = finalTexts.filter(isRedbox);
    const log = (() => { try { return logcat(); } catch { return ''; } })();
    try {
      const logs = join(root, 'logs');
      mkdirSync(logs, { recursive: true });
      appendFileSync(join(logs, 'android-logcat.log'), `\n===== ${new Date().toISOString()} ${config.id} =====\n${log}`);
    } catch {}

    void checkpoint('app-alive', 'app process still running', () => alive);
    void checkpoint('no-redbox', 'no red box on screen', () => red.length === 0);
    if (!alive) ctx.fail('The app process died during the take (see logs/android-logcat.log)');
    if (red.length) { mark('error', red[0]); ctx.fail(`Red box on screen: ${red.slice(0, 3).join(' | ')}`); }
    if (sentAt) {
      const fresh = finalTexts.filter((t) => !afterSend.includes(t) && t !== cfg.prompt);
      void checkpoint('reply', 'new text on screen after the prompt', () => fresh.join(' | ').slice(0, 300) || null);
      if (!fresh.length && !red.length) ctx.fail('The agent never replied (screen unchanged after sending the prompt)');
    }
    await sleep(1500);
    return finalTexts;
  });
}

export const runAndroidStandard: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runAndroidChat(page, config, root, ctx);
  } finally {
    if (FINDING_NOTES[config.id] && !KNOWN_ISSUE.has(config.id)) {
      await showFinding(page, config, FINDING_EVIDENCE[config.id], FINDING_NOTES[config.id]);
    }
  }
};
