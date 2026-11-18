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
export const FINDING_NOTES: Record<string, string> = {};
export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {};
/** Level 2 (already reported): clip ends after the demo. */
export const KNOWN_ISSUE = new Set<string>([]);
registerDocEvidence(FINDING_EVIDENCE, { skip: KNOWN_ISSUE });

/** Pages whose composer is the doc's own ChatScreen with a "Send" button; the rest use CopilotChat's "↑". */
const SEND_LABEL: Record<string, string> = {
  quickstart: 'Send', 'headless-ui': 'Send', markdown: 'Send', 'multimodal-attachments': 'Send',
};

type PromptCfg = { prompt?: string; tap?: string; settle?: number; timeout?: number; noInput?: boolean };
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

    openDeepLink(config.id);
    logAction('deeplink', `copilotqa://page/${config.id}`);
    await sleep(6000);

    let screen = dump();
    const { w, h } = deviceSize(screen.nodes);
    let sentAt = 0;
    let afterSend: string[] = [];

    if (cfg.prompt && !cfg.noInput) {
      const input = screen.nodes.find((n) => n.cls.endsWith('EditText'));
      if (!input) {
        ctx.fail('No text input on the app screen');
      } else {
        await tapNode(page, input, 'composer', w, h);
        await sleep(600);
        mark('action', `type: ${cfg.prompt}`);
        await typeHuman(cfg.prompt);
        await sleep(700);
        screen = dump();
        const label = cfg.tap!;
        const btn = byLabel(screen.nodes, label) ?? byLabel(screen.nodes, label === 'Send' ? '↑' : 'Send');
        if (btn) await tapNode(page, btn, `send (${label})`, w, h);
        else { sh('input keyevent 66'); logAction('key', 'enter (no send button)'); }
        sentAt = Date.now();
        await sleep(2000);
        afterSend = texts(dump().nodes);
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
