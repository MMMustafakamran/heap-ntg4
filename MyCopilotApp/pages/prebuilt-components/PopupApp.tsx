// HARNESS: the page shows AssistantPopup but no screen/provider around it. "Render AssistantPopup as the
// last child of a screen's root view that has flex: 1" -> provider from the Drop-in App.tsx + a flex:1 View.
import { View } from "react-native";
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { AssistantPopup } from "./src/AssistantPopup";

const runtimeUrl = "http://10.0.2.2:8153/api/prebuilt-components/copilotkit"; // HARNESS: harness runtime host

export default function PopupApp() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <View style={{ flex: 1 }}>
        <AssistantPopup />
      </View>
    </CopilotKitProvider>
  );
}
