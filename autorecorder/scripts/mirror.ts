/** HARNESS: `npm run mirror` keeps the device mirror up on its own (open it in a browser to check it). */
import { PROJECT } from '../config/project.config';
import { startMirror } from '../actions/android-mirror';

await startMirror(Number(new URL(PROJECT.frontendUrl).port));
console.log(`open ${PROJECT.frontendUrl}/?page=quickstart  (Ctrl+C to stop)`);
