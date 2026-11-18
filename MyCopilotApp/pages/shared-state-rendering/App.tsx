// Doc: https://docs.copilotkit.ai/react-native/google-antigravity/shared-state/rendering-in-app (App.tsx, verbatim except runtimeUrl)
import { useRef } from "react";
import { Button } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { CopilotModal, type CopilotModalRef } from "@copilotkit/react-native/components";
import { TaskBoard } from "./src/TaskBoard";

// HARNESS: localhost:8200 -> the per-page harness runtime on :8153 (10.0.2.2 = host from the Android emulator)
const runtimeUrl = "http://10.0.2.2:8153/api/shared-state-rendering/copilotkit";

export default function App() {
  const chatRef = useRef<CopilotModalRef>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CopilotKitProvider runtimeUrl={runtimeUrl}>
        {/* Your app UI, driven by agent.state */}
        <TaskBoard />
        <Button title="Ask the assistant" onPress={() => chatRef.current?.open()} />
        {/* The chat is another consumer of the same agent */}
        <CopilotModal ref={chatRef} agentName="default" />
      </CopilotKitProvider>
    </GestureHandlerRootView>
  );
}
