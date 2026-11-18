#!/usr/bin/env bash
# HARNESS: build the debug APK from a short-path copy (C:\rnb). The repo path is too long for Windows'
# 260-char limit in react-native-worklets' CMake build (ninja: mkdir ... No such file or directory).
# Rerun after any native change (new native package, android/ edit). JS-only changes need no rebuild.
set -e
cd "$(dirname "$0")/.."
SRC="$(cygpath -w "$PWD/MyCopilotApp")"
cmd.exe //c "robocopy \"$SRC\" C:\rnb /MIR /XD \"$SRC\android\app\build\" \"$SRC\android\build\" \"$SRC\android\.gradle\" .cxx /NFL /NDL /NJH /NP /MT:4" || true
cd /c/rnb/android && ./gradlew.bat assembleDebug --no-daemon
