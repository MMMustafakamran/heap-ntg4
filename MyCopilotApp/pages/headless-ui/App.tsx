// HARNESS: the page shows src/ChatScreen.tsx (verbatim) and a bare useConfigureSuggestions call
// ("Configure them once, anywhere under the provider"), but no App/provider. Provider = quickstart App.tsx.
import { CopilotKitProvider, useConfigureSuggestions } from "@copilotkit/react-native/headless";
import { ChatScreen } from "./src/ChatScreen";

const runtimeUrl = "http://10.0.2.2:8153/api/headless-ui/copilotkit"; // HARNESS: harness runtime host

// HARNESS: wrapper component so the doc's hook call sits under the provider.
function Suggestions() {
  useConfigureSuggestions({
    suggestions: [
      { title: "Plan my day", message: "Plan my day around my calendar." },
      { title: "What's due?", message: "Which tasks are due this week?" },
    ],
  });
  return null;
}

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <Suggestions />
      <ChatScreen />
    </CopilotKitProvider>
  );
}
