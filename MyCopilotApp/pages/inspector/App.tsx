// HARNESS: the Inspector page says "There is no React Native build of Inspector, and
// `@copilotkit/react-native` does not ship it." Its only provider snippet is the React web
// <CopilotKit enableInspector={false}>. This is the quickstart app, to show no Inspector button appears.
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { ChatScreen } from "../../src/ChatScreen";

// HARNESS: per-page runtime on the harness runtime server (:8153)
const runtimeUrl = "http://10.0.2.2:8153/api/inspector/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <ChatScreen />
    </CopilotKitProvider>
  );
}
