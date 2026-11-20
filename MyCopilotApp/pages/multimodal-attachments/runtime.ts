// HARNESS: the page shows no runtime/server snippet. This is the quickstart server.ts runtime with
// its "default" agent pointed at an Antigravity agent (the quickstart only wires a BuiltInAgent),
// served by backend/rn_chat_main.py on :8154/multimodal-attachments.
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: {
    default: new HttpAgent({ url: "http://127.0.0.1:8154/multimodal-attachments" }), // HARNESS: 127.0.0.1, another app on this laptop also binds 0.0.0.0:8154
  },
});

export default runtime;
