// HARNESS: the page shows src/ChatScreen.tsx (verbatim, Quick start) but no App/provider.
// Provider = quickstart App.tsx with the harness runtime URL.
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { ChatScreen } from "./src/ChatScreen";

const runtimeUrl = "http://10.0.2.2:8153/api/multimodal-attachments/copilotkit"; // HARNESS: harness runtime host

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <ChatScreen />
    </CopilotKitProvider>
  );
}
