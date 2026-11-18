// HARNESS: the WebMCP page has no React Native code (it says RN registration is a no-op).
// This screen imports the page's only snippet (webmcp.ts) and shows whether document.modelContext exists,
// next to the quickstart chat so the app still runs.
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { Text, View } from "react-native";
import { ChatScreen } from "../../src/ChatScreen";
import { copilotkit } from "./webmcp";

// HARNESS: per-page runtime on the harness runtime server (:8153)
const runtimeUrl = "http://10.0.2.2:8153/api/webmcp/copilotkit";

export default function App() {
  // HARNESS: probe readout only
  const hasModelContext =
    typeof (globalThis as any).document !== "undefined" &&
    !!(globalThis as any).document?.modelContext;
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <View style={{ padding: 8 }}>
        <Text testID="webmcp-status">
          {`core created: ${!!copilotkit} | document.modelContext: ${hasModelContext ? "yes" : "no"}`}
        </Text>
      </View>
      <ChatScreen />
    </CopilotKitProvider>
  );
}
