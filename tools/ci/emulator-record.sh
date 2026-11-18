#!/usr/bin/env bash
# CI only: runs inside reactivecircus/android-emulator-runner once the emulator has booted.
# Installs the APK, points its dev server at Metro on the host (10.0.2.2:8150, same as start-all.sh),
# turns animations off, then records this shard's pages. Never fails the job: a failed take is usually the doc defect.
set +e
cd "$(dirname "$0")/../.."
APK="${APK:-apk/app-debug.apk}"
export ANDROID_SERIAL="${ANDROID_SERIAL:-$(adb devices | awk '/emulator-/{print $1; exit}')}"
echo "device: $ANDROID_SERIAL"
for s in window_animation_scale transition_animation_scale animator_duration_scale; do adb shell settings put global $s 0; done
for i in 1 2 3 4 5; do adb install -r "$APK" 2>&1 | tee /tmp/install.log | grep -q Success && break; echo "install attempt $i failed"; sleep 10; done
# HARNESS: same command as start-all.sh: the APK's dev server host = Metro on the host machine
adb shell "run-as com.mycopilotapp sh -c 'mkdir -p shared_prefs && echo \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\" standalone=\\\"yes\\\" ?><map><string name=\\\"debug_http_host\\\">10.0.2.2:8150</string></map>\" > shared_prefs/com.mycopilotapp_preferences.xml'"
adb shell "run-as com.mycopilotapp cat shared_prefs/com.mycopilotapp_preferences.xml"; echo
adb reverse tcp:8150 tcp:8150 || true   # belt and braces: localhost:8150 also reaches Metro
mkdir -p logs
# HARNESS: react-native-worklets Bundle Mode writes .worklets/<id>.js on the fly and Metro fails the first
# bundles with "Failed to get the SHA-1" (react-native-streamdown README, Bundle Mode step 3: "reload the app a
# few times"). Warm the bundle here until Metro serves it (HTTP 200), so the app opens on the first page.
BUNDLE_URL="http://localhost:8150/index.bundle?platform=android&dev=true&lazy=true&minify=false&app=com.mycopilotapp&modulesOnly=false&runModule=true"
fails=0
for i in $(seq 1 15); do
  code=$(curl -s -o /tmp/bundle.js -w '%{http_code}' --max-time 300 "$BUNDLE_URL")
  echo "bundle warm attempt $i: HTTP $code ($(wc -c < /tmp/bundle.js) bytes)"
  [ "$code" = "200" ] && break
  echo "--- body (first 600 bytes) ---"; head -c 600 /tmp/bundle.js; echo; echo "---"
  fails=$((fails + 1))
  if [ "$fails" -ge 3 ]; then
    # HARNESS fallback: a fresh Metro indexes the .worklets/ files written so far (README: "reload a few times").
    echo "3 failed warm attempts in a row: restarting Metro on :8150"
    pkill -f "react-native start --port 8150" || true; sleep 3
    (cd MyCopilotApp && nohup npx react-native start --port 8150 >> ../logs/metro-8150.log 2>&1 &)
    for j in $(seq 1 60); do curl -s -o /dev/null http://localhost:8150/status && break; sleep 2; done
    fails=0
  fi
  sleep 3
done
adb logcat -v time > logs/logcat.log 2>&1 &
node autorecorder/scripts/write-versions.mjs 2>/dev/null || echo "::warning::write-versions failed or missing"
cd autorecorder
xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
  npm run record -- "--pages=$PAGES" 2>&1 | tee ../logs/record.log
echo "record exit=${PIPESTATUS[0]}"
exit 0
