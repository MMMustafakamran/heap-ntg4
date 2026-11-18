#!/usr/bin/env bash
# HARNESS: starts every Antigravity React Native server on its harness port (never 3000/8000).
#   8150 Metro bundler            8151 Copilot Runtime (doc's server.ts, PORT=8151)
#   8152 Antigravity quickstart agent (backend/main.py, copied from heap-ntg1)
#   8153 per-page Copilot Runtimes (harness-runtime.ts)   8154-8158 page agents (added per page)
#   8159 Gemini key/model pool
# Emulator: AVD qa_pixel, headless. The app reaches the host at 10.0.2.2 (doc's own rule).
# Usage: bash start-all.sh            start servers + emulator + install/launch the app
#        NO_EMU=1 bash start-all.sh   servers only
cd "$(dirname "$0")"
mkdir -p logs
SDK="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"
ADB="$SDK/platform-tools/adb"

if [ -z "$NO_EMU" ] && ! "$ADB" devices | grep -q "emulator-"; then
  "$SDK/emulator/emulator" -avd qa_pixel -no-window -no-audio -no-boot-anim -memory 2048 -cores 2 \
    -gpu swiftshader_indirect > logs/emulator.log 2>&1 &
fi

(cd backend && PORT=8159 uv run --with httpx --with starlette python ../tools/gemini_pool.py > ../logs/gemini-pool-8159.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn main:app --port 8152 > ../logs/backend-8152.log 2>&1) &
# Doc: `export OPENAI_API_KEY=sk-...` then `npx tsx server.ts`; the key comes from runtime.env (gitignored).
(cd MyCopilotApp && set -a && . ../runtime.env && set +a && PORT=8151 npx tsx server.ts > ../logs/runtime-8151.log 2>&1) &
# HARNESS: per-page runtimes (harness-runtime.ts) on :8153, at /api/<page-id>/copilotkit
(cd MyCopilotApp && set -a && . ../runtime.env && set +a && PORT=8153 npx tsx harness-runtime.ts > ../logs/runtimes-8153.log 2>&1) &
(cd MyCopilotApp && npx react-native start --port 8150 > ../logs/metro-8150.log 2>&1) &

if [ -z "$NO_EMU" ]; then
  "$ADB" wait-for-device
  until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 3; done
  (cd MyCopilotApp && npx react-native run-android --port 8150 --no-packager > ../logs/run-android.log 2>&1)
  echo "app launched (logs/run-android.log)"
fi
wait
