# FINDINGS: Google Antigravity, React Native

Open doc defects on the React Native section of the Google Antigravity docs (Android emulator; iOS not testable on Windows).

Stack: @copilotkit/react-native 1.89.0, @copilotkit/runtime 1.89.0, react-native 0.88.1, zod 3.25.76, react-native-get-random-values 2.1.0, react-native-streamdown 0.3.0, react-native-worklets 0.13.1, react-native-reanimated 4.7.2, expo-file-system 58.0.14 · ag-ui-antigravity 0.2.1, google-antigravity 0.1.24, google-genai 3.6.1 (backend/uv.lock, 2026-11-23) · Node 26.7.0, npm 11 · Windows 11 Pro, Android emulator API 36 x86_64 · docs https://docs.copilotkit.ai/react-native/google-antigravity, snapshot 2026-11-18

### [React Native (Quickstart)](https://docs.copilotkit.ai/react-native/google-antigravity)

**Dev blockers**

**#1 The Antigravity quickstart never gives an Antigravity agent server.** The page sits under Google Antigravity, but its only runtime registers a built-in OpenAI agent, and no step shows how to serve the Antigravity agent.
- **Doc:** `default: new BuiltInAgent({ model: "openai:gpt-6-luna", ... })` in `server.ts`; "The runtime from the quickstart hosts a `BuiltInAgent`".
- **Result:** following the page gives a working chat on OpenAI (reply "Hello!" on the emulator), not on Antigravity. The runtime side (`HttpAgent` wiring) is in the Copilot Runtime guide; the missing piece is the Antigravity agent server (`create_antigravity_app`), which the reader has to guess.
- **Confirmed by harness:** every other page runs on `HttpAgent({ url: "http://localhost:815x/<page>" })` in a HARNESS runtime (`MyCopilotApp/pages/<id>/runtime.ts`) plus `backend/rn_*_main.py`.

**Minor notes**
- #3 `App.tsx` has no safe area: the first chat message renders under the Android status bar.

### [Tool Call Rendering](https://docs.copilotkit.ai/react-native/google-antigravity/generative-ui/tool-rendering)

**Minor notes**
- #2 The agent snippet lists `search_flights`, `get_stock_price`, `roll_d20`, `SYSTEM_PROMPT` and `build` but shows only `get_weather`; with those filled in (`backend/agents/rn_tool_rendering.py`, HARNESS) the weather card renders ("San Francisco", "68°").

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

### [Multimodal Attachments](https://docs.copilotkit.ai/react-native/google-antigravity/multimodal-attachments)

**Minor notes**
- #9 The quick start leaves `{/* Your message list goes here */}` with no list, so answers don't show until the reader adds one (harness reuses the quickstart FlatList); on `expo-file-system` 19+ the callout's legacy `onUpload` reader is needed. With both, a picked image gets "The image displays a red circle on a white background."

### [HITL Overview](https://docs.copilotkit.ai/react-native/google-antigravity/human-in-the-loop)

**Dev blockers**

**#10 Tapping a slot does nothing: no confirmation, card stays open.**
- **Doc:** "Tap a slot, and the agent confirms the time you picked."
- **Result:** the card "Pick a time for Launch" with "Tue 9 AM" / "Wed 2 PM" / "None of these work" appears; tapping a slot sends no follow-up request to the agent (only the first `POST /hitl` in the backend log), the card never shows `Done:` and no assistant message appears. Probed 2026-11-20 after the bridge fix: 1/1 with the page's agent (`agents._common.build`), 2/2 with a plain `AntigravityAgent` and the same prompt. The same `useHumanInTheLoop` pattern resolves on Governed Actions, so the gap is in this page's sample on React Native.
- Minor: `agents._common` is never shown; the agent prompt says `book_call` while the frontend registers `schedule_meeting` (the model still calls it).

### [Pausing the Agent for Input](https://docs.copilotkit.ai/react-native/google-antigravity/human-in-the-loop/useInterrupt)

**Minor notes**
- #11 The page says "Not available for Google Antigravity yet."; reported N/A, not tested.

### [Headless Interrupts](https://docs.copilotkit.ai/react-native/google-antigravity/human-in-the-loop/headless)

**Minor notes**
- #12 `./src/ChatScreen` is imported but never shown.

### [Governed Action Approval UI](https://docs.copilotkit.ai/react-native/google-antigravity/human-in-the-loop/governed-actions)

**Minor notes**
- #13 The only agent shown is LangGraph (`interrupt()`, `deliver_email` undefined); a quickstart-style Antigravity agent whose prompt names `approve_governed_action` (`backend/agents/rn_governed_actions.py`, HARNESS) works: REJECT gets "The email was not sent because approval was not granted."

### [Sub-agents](https://docs.copilotkit.ai/react-native/google-antigravity/multi-agent/subagents)

**Dev blockers**

**#14 The delegation log frontend is React web code only, and the server needs an uninstalled package.**
- **Doc:** "On the frontend, the delegation log is a reactive render of the `delegations` slot." (no snippet follows); install step `pip install ag-ui-antigravity google-antigravity`.
- **Result:** the reader has to write the whole React Native UI; the agent module imports `httpx`, which the install step never names (same as the web page). With a harness log (`useAgent` + `agent.state.delegations`) and `httpx` added, 3 delegations complete (research, writing, critique).
- Minor: text refers to "The LangGraph excerpt above" and "the Built-in Agent example", neither on the page.
