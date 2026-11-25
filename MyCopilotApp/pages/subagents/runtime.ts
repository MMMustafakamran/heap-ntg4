// ADDED: the Sub-Agents page shows no runtime; quickstart runtime with the page's Antigravity agent
// (backend/rn_misc_main.py, :8158/subagents) as "default" via HttpAgent.
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

const runtime = new CopilotRuntime({
  agents: {
    default: new HttpAgent({ url: "http://localhost:8158/subagents" }),
  },
});

export default runtime;
