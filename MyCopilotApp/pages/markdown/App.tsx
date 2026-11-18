// HARNESS: the page shows no App/provider; this is the quickstart App.tsx with the harness runtime URL.
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { ChatScreen } from "./src/ChatScreen";

const runtimeUrl = "http://10.0.2.2:8153/api/markdown/copilotkit"; // HARNESS: harness runtime host

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <ChatScreen />
    </CopilotKitProvider>
  );
}
