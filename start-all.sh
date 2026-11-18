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
  "$SDK/emulator/emulator" -avd qa_pixel -no-window -no-audio -no-boot-anim -memory 3072 -cores 2 \
    -gpu host > logs/emulator.log 2>&1 &  # HARNESS: swiftshader froze System UI (ANR) on this laptop
fi

(cd backend && PORT=8159 uv run --with httpx --with starlette python ../tools/gemini_pool.py > ../logs/gemini-pool-8159.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn main:app --port 8152 > ../logs/backend-8152.log 2>&1) &
# HARNESS: page agents, one file per page group, one path per page (/<page-id>)
(cd backend && uv run --env-file .env uvicorn rn_chat_main:app --port 8154 > ../logs/backend-8154.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn rn_genui_main:app --port 8155 > ../logs/backend-8155.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn rn_state_main:app --port 8156 > ../logs/backend-8156.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn rn_hitl_main:app --port 8157 > ../logs/backend-8157.log 2>&1) &
# Sub-agents: the page's agent imports httpx, which its install step never names (rides on --with)
(cd backend && uv run --env-file .env --with httpx uvicorn rn_misc_main:app --port 8158 > ../logs/backend-8158.log 2>&1) &
# Doc: `export OPENAI_API_KEY=sk-...` then `npx tsx server.ts`; the key comes from runtime.env (gitignored).
(cd MyCopilotApp && set -a && . ../runtime.env && set +a && PORT=8151 npx tsx server.ts > ../logs/runtime-8151.log 2>&1) &
# HARNESS: per-page runtimes (harness-runtime.ts) on :8153, at /api/<page-id>/copilotkit
(cd MyCopilotApp && set -a && . ../runtime.env && set +a && PORT=8153 npx tsx harness-runtime.ts > ../logs/runtimes-8153.log 2>&1) &
(cd MyCopilotApp && npx react-native start --port 8150 > ../logs/metro-8150.log 2>&1) &

if [ -z "$NO_EMU" ]; then
  "$ADB" wait-for-device
  until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 3; done
  # HARNESS: the APK is built from a short-path copy (C:\rnb, see tools/build-apk.sh): the repo path is
  # past Windows' 260-char limit for the worklets CMake build. JS still comes from this repo via Metro.
  for s in window_animation_scale transition_animation_scale animator_duration_scale; do "$ADB" shell settings put global $s 0; done
  until "$ADB" install -r /c/rnb/android/app/build/outputs/apk/debug/app-debug.apk 2>&1 | grep -q Success; do sleep 10; done
  # HARNESS: the APK was built with the default Metro port; point its dev server at 10.0.2.2:8150
  "$ADB" shell "run-as com.mycopilotapp sh -c 'mkdir -p shared_prefs && echo \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\" standalone=\\\"yes\\\" ?><map><string name=\\\"debug_http_host\\\">10.0.2.2:8150</string></map>\" > shared_prefs/com.mycopilotapp_preferences.xml'"
  echo "app installed; open a page: adb shell am start -a android.intent.action.VIEW -d copilotqa://page/<id> com.mycopilotapp"
fi
wait
