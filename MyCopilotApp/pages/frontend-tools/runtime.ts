// HARNESS: the frontend-tools page shows no server/runtime snippet. This is the quickstart server.ts runtime
// with its BuiltInAgent swapped for the page's Antigravity agent (HttpAgent -> backend :8155/frontend-tools),
// served by harness-runtime.ts at /api/frontend-tools/copilotkit.
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: {
    // HARNESS: "default" because the page's chat uses the default agent id
    default: new HttpAgent({ url: "http://localhost:8155/frontend-tools" }),
  },
});

export default runtime;
