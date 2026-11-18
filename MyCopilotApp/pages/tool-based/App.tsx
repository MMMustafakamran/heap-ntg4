// HARNESS: the page shows no App/provider for this example ("in any component under
// CopilotKitProvider"); this root mounts the doc's ChatScreen under a provider like the quickstart App.tsx.
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { ChatScreen } from "./src/ChatScreen";

// HARNESS: this page's harness runtime (Android emulator host, port block 815x)
const runtimeUrl = "http://10.0.2.2:8153/api/tool-based/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <ChatScreen />
    </CopilotKitProvider>
  );
}
