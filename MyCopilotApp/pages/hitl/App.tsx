// HARNESS: the page shows src/MeetingApproval.tsx only and says "Call useMeetingApproval() in a
// component under CopilotKitProvider" and that the rendered CopilotChat from /components draws the
// card. This root (provider + a component calling the hook + CopilotChat) is the tester's fill-in.
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { CopilotChat } from "@copilotkit/react-native/components";
import { useMeetingApproval } from "./src/MeetingApproval";

// HARNESS: per-page runtime on the harness server (:8153), Android emulator host alias.
const runtimeUrl = "http://10.0.2.2:8153/api/hitl/copilotkit";

// HARNESS: component under the provider that calls the doc's hook.
function MeetingScreen() {
  useMeetingApproval();
  return <CopilotChat />;
}

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <MeetingScreen />
    </CopilotKitProvider>
  );
}
