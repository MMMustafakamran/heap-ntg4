#!/usr/bin/env bash
# CI only. HARNESS: react-native-streamdown README "Required setup - Bundle Mode" step 3 ("Patch Metro for
# synchronous worklet indexing (recommended)"). Worklets Bundle Mode writes .worklets/<id>.js on the fly;
# Metro's file map hasn't indexed them yet, so getOrComputeSha1 throws "Failed to get the SHA-1" and the
# bundle is HTTP 500. This makes Metro hash such a file from disk instead of throwing.
# Applied to the CI checkout's node_modules only, before Metro starts; MyCopilotApp source is untouched.
set -euo pipefail
cd "$(dirname "$0")/../.."
F=MyCopilotApp/node_modules/metro/src/node-haste/DependencyGraph.js
node - "$F" <<'JS'
const fs = require("fs"); const f = process.argv[2];
let s = fs.readFileSync(f, "utf8");
if (s.includes("HARNESS worklets sha1")) { console.log("metro patch: already applied"); process.exit(0); }
const a = "const result = await this._fileSystem.getOrComputeSha1(mixedPath);\n    if (!result || !result.sha1) {";
if (!s.includes(a)) { console.log("::warning::metro patch: pattern not found (Metro changed); not patched"); process.exit(0); }
s = s.replace(a, `const result = await this._fileSystem.getOrComputeSha1(mixedPath);
    // HARNESS worklets sha1: file not indexed yet (Bundle Mode .worklets/), hash it from disk.
    if ((!result || !result.sha1) && require("fs").existsSync(mixedPath)) {
      const content = require("fs").readFileSync(mixedPath);
      return { sha1: require("crypto").createHash("sha1").update(content).digest("hex"), content };
    }
    if (!result || !result.sha1) {`);
fs.writeFileSync(f, s); console.log("metro patch: applied to " + f);
JS
