/**
 * HARNESS: `npm run record` for the React Native repo. Starts the device mirror (the demo
 * "app" the recorder's browser opens, see actions/android-mirror.ts), then runs the shared
 * cli.ts unchanged. cli.ts always exits the process on a recording run, which stops the mirror.
 */
import { PROJECT } from '../config/project.config';
import { startMirror } from '../actions/android-mirror';
import { SERIAL, deviceOnline } from '../actions/adb';

const args = process.argv.slice(2);
const noMirror = args.some((a) => ['--list', 'list', '--help', '-h'].includes(a)) ||
  (args.includes('--doctor') && !args.includes('--online'));

if (!noMirror) {
  if (!deviceOnline()) console.warn(`   ⚠️ adb: no device ${SERIAL} (set ANDROID_SERIAL); the demo segment will fail.`);
  const port = Number(new URL(PROJECT.frontendUrl).port);
  try {
    await startMirror(port);
  } catch (e) {
    // Already running (e.g. `npm run mirror` in another terminal) is fine.
    const up = await fetch(`${PROJECT.frontendUrl}/health`).then((r) => r.ok).catch(() => false);
    if (!up) { console.error(`Device mirror could not start on :${port}: ${e instanceof Error ? e.message : e}`); process.exit(1); }
  }
}

await import('../cli');
