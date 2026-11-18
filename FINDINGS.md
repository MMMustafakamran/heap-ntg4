# FINDINGS: Google Antigravity, React Native

Open doc defects on the React Native section of the Google Antigravity docs (Android emulator; iOS not testable on Windows).

Stack: @copilotkit/react-native 1.89.0, @copilotkit/runtime 1.89.0, react-native 0.88.1, zod 3.25.76, react-native-get-random-values 2.1.0, react-native-streamdown 0.3.0, react-native-worklets 0.13.1, react-native-reanimated 4.7.2, expo-file-system 58.0.14 · ag-ui-antigravity / google-antigravity as in backend/uv.lock · Node 26.7.0, npm 11 · Windows 11 Pro, Android emulator API 36 x86_64 · docs https://docs.copilotkit.ai/react-native/google-antigravity, snapshot 2026-11-18

### [React Native (Quickstart)](https://docs.copilotkit.ai/react-native/google-antigravity)

**Dev blockers**

**#1 The Antigravity quickstart never connects an Antigravity agent.** The page sits under Google Antigravity, but its only runtime registers a built-in OpenAI agent; nothing on the page (or linked from its steps) shows how to serve the Antigravity agent or register it in the runtime.
- **Doc:** `default: new BuiltInAgent({ model: "openai:gpt-6-luna", ... })` in `server.ts`; "The runtime from the quickstart hosts a `BuiltInAgent`".
- **Result:** following the page gives a working chat on OpenAI (reply "Hello!" on the emulator), not on Antigravity. To use Antigravity a reader has to guess the backend (`create_antigravity_app`) and the runtime wiring (`HttpAgent` from `@ag-ui/client`, a package no install step names).
- **Confirmed by harness:** every other page runs on `HttpAgent({ url: "http://localhost:815x/<page>" })` in a HARNESS runtime (`MyCopilotApp/pages/<id>/runtime.ts`) plus `backend/rn_*_main.py`.

**Minor notes**
- #3 `App.tsx` has no safe area: the first chat message renders under the Android status bar.

### [Tool Call Rendering](https://docs.copilotkit.ai/react-native/google-antigravity/generative-ui/tool-rendering)

**Dev blockers**

**#2 The agent snippet uses three tools, a prompt and a builder it never defines.**
- **Doc:** `TOOLS = [get_weather, search_flights, get_stock_price, roll_d20]` and `return build(system_instructions=SYSTEM_PROMPT, tools=TOOLS)`; only `get_weather` is shown.
- **Error:** run as published the module fails on import with `NameError` (`search_flights`, `get_stock_price`, `roll_d20`, `SYSTEM_PROMPT`, `build` undefined; `build` lives in the unpublished `agents._common`). The server never starts, so no tool card can render.
- **Confirmed by harness:** with the three tools and `SYSTEM_PROMPT` copied from the web harness and `build` from `agents._common` (`backend/agents/rn_tool_rendering.py`, HARNESS), the weather card renders ("San Francisco", "68°").

### [Prebuilt Components](https://docs.copilotkit.ai/react-native/google-antigravity/prebuilt-components)

**Minor notes**
- #4 The `/components` chat needs `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-streamdown` (+ its peers `react-native-worklets`, `react-native-enriched-markdown`, `remend`); the page lists them in a table but gives no install command. Same gap on Markdown, Frontend Tools, Components as Tools, Tool Call Rendering, Render agent state.
- #5 `react-native-streamdown` needs its Worklets Bundle Mode setup (`babel.config.js` + `metro.config.js`); the page only says to follow the library's guide. Without it every reply crashes: "[Worklets] Tried to synchronously call a Remote Function". Harness applies the library's README setup.

### [Frontend Tools](https://docs.copilotkit.ai/react-native/google-antigravity/frontend-tools)

**Minor notes**
- #6 The agent step copies the Components as Tools chart agent ("call `render_bar_chart` or `render_pie_chart`") and never mentions `filter_tasks`; the tool is still called because the adapter forwards frontend tools.

### [Components as Tools](https://docs.copilotkit.ai/react-native/google-antigravity/generative-ui/tool-based)

**Minor notes**
- #7 The agent prompt also tells the model to call `render_pie_chart`, which the frontend never registers.

### [WebMCP](https://docs.copilotkit.ai/react-native/google-antigravity/webmcp)

**Build-only**
- #8 The snippet calls `searchOrders(status)`, never defined (TS2304). The page itself says WebMCP is a no-op on React Native.
