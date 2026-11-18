// HARNESS: the page shows no server/runtime snippet. Quickstart server.ts runtime, with the
// BuiltInAgent swapped for the page's Antigravity agent (HttpAgent -> backend/rn_hitl_main.py :8157/hitl),
// registered as "default" so the page's chat/hooks reach it without an agentId.
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: {
    default: new HttpAgent({ url: "http://localhost:8157/hitl" }),
  },
});

export default runtime;
