// HARNESS: the page shows no server/runtime snippet; the quickstart server.ts runtime (BuiltInAgent) as-is.
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: "openai:gpt-6-luna",
      prompt: "You are a helpful assistant for a React Native app.",
    }),
  },
});

export default runtime;
