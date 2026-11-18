import { View } from "react-native";
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { CopilotChat } from "@copilotkit/react-native/components";
import { TaskScreen } from "./src/TaskScreen";

// See the quickstart for emulator and device hosts.
// HARNESS: doc's "http://localhost:8200/api/copilotkit" -> this page's harness runtime (Android emulator host, port block 815x)
const runtimeUrl = "http://10.0.2.2:8153/api/frontend-tools/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <View style={{ flex: 1 }}>
        <TaskScreen />
        <CopilotChat />
      </View>
    </CopilotKitProvider>
  );
}
