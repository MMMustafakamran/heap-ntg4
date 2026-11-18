// HARNESS: the page shows the card, the useInterrupt hook and the useHumanInTheLoop tool, but no
// App / provider / chat. This root is the tester's fill-in: both hooks under CopilotKitProvider,
// with the rendered CopilotChat from /components ("draws the card in the conversation").
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { CopilotChat } from "@copilotkit/react-native/components";
import { useGovernedActionApproval } from "./src/GovernedActionApproval";
import { useGovernedActionTool } from "./src/GovernedActionTool";

// HARNESS: per-page runtime on the harness server (:8153), Android emulator host alias.
const runtimeUrl = "http://10.0.2.2:8153/api/governed-actions/copilotkit";

// HARNESS: component under the provider that calls the doc's hooks ("default" = the chat's agent).
function GovernedScreen() {
  useGovernedActionApproval("default");
  useGovernedActionTool();
  return <CopilotChat />;
}

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <GovernedScreen />
    </CopilotKitProvider>
  );
}
