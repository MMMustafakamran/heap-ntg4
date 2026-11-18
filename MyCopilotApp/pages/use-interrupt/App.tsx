import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { MeetingChat } from "./src/MeetingChat";

// HARNESS: doc has "http://localhost:8200/api/copilotkit"; per-page runtime on :8153 via the emulator alias.
const runtimeUrl = "http://10.0.2.2:8153/api/use-interrupt/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <MeetingChat />
    </CopilotKitProvider>
  );
}
