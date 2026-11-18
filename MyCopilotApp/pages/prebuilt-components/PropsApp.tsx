// Doc: "Adjust the look with props" snippet (verbatim JSX). The doc shows only the element.
import { CopilotKitProvider } from "@copilotkit/react-native/headless"; // HARNESS: wrapper from the Drop-in App.tsx
import { CopilotChat } from "@copilotkit/react-native/components"; // HARNESS: import from the Drop-in App.tsx

// HARNESS: harness runtime host
const runtimeUrl = "http://10.0.2.2:8153/api/prebuilt-components/copilotkit";

export default function PropsApp() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <CopilotChat
        showHeader={false}
        style={{ backgroundColor: "#fafafa" }}
        messageContainerStyle={{ paddingHorizontal: 24 }}
        inputContainerStyle={{ borderTopWidth: 0 }}
      />
    </CopilotKitProvider>
  );
}
