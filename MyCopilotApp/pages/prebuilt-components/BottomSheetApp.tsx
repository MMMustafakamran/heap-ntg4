// Doc: "Bottom sheet" App.tsx, verbatim except runtimeUrl.
import { useRef } from "react";
import { Button } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import {
  CopilotModal,
  type CopilotModalRef,
} from "@copilotkit/react-native/components";

// HARNESS: doc has "http://localhost:8200/api/copilotkit"
const runtimeUrl = "http://10.0.2.2:8153/api/prebuilt-components/copilotkit";

export default function App() {
  const modalRef = useRef<CopilotModalRef>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CopilotKitProvider runtimeUrl={runtimeUrl}>
        <Button title="Ask the assistant" onPress={() => modalRef.current?.open()} />
        <CopilotModal
          ref={modalRef}
          agentName="default"
          headerTitle="Assistant"
          snapPoints={["50%", "90%"]}
        />
      </CopilotKitProvider>
    </GestureHandlerRootView>
  );
}
