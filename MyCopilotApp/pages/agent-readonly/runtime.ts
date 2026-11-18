// HARNESS: the Agent Read-Only Context page shows no runtime / server snippet. Quickstart server.ts runtime, with
// the "default" agent pointed at the page's Antigravity agent (backend/rn_state_main.py, :8156/agent-readonly)
// instead of the quickstart's BuiltInAgent, since the page's context is read by that Python agent.
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: {
    default: new HttpAgent({ url: "http://localhost:8156/agent-readonly" }),
  },
});

export default runtime;
