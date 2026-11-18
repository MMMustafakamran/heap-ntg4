// HARNESS: the page shows only the two hooks ("Call useToolCallCards() once, in a component under
// CopilotKitProvider") and says the rendered CopilotChat from /components draws the cards. It shows no
// App, provider or chat, so this root is built like the quickstart App.tsx with the /components chat.
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { CopilotChat } from "@copilotkit/react-native/components";
import { useToolCallCards } from "./src/ToolCallCard";
import { useWeatherCard } from "./src/WeatherCard";

// HARNESS: this page's harness runtime (Android emulator host, port block 815x)
const runtimeUrl = "http://10.0.2.2:8153/api/tool-rendering/copilotkit";

// HARNESS: a component that calls the doc's hooks once under the provider
function ToolRenderingChat() {
  useToolCallCards();
  useWeatherCard();
  return <CopilotChat />;
}

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <ToolRenderingChat />
    </CopilotKitProvider>
  );
}
