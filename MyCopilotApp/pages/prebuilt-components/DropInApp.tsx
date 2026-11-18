// Doc: "Drop-in chat" App.tsx, verbatim except runtimeUrl.
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { CopilotChat } from "@copilotkit/react-native/components";

// See the quickstart for emulator and device hosts.
// HARNESS: doc has "http://localhost:8200/api/copilotkit"; harness runtime host (pages/prebuilt-components/runtime.ts)
const runtimeUrl = "http://10.0.2.2:8153/api/prebuilt-components/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <CopilotChat
        agentName="default"
        headerTitle="Assistant"
        placeholder="Ask me anything..."
        emptyStateTitle="How can I help?"
        initialMessages={["What can you do?", "Summarize my tasks"]}
      />
    </CopilotKitProvider>
  );
}
