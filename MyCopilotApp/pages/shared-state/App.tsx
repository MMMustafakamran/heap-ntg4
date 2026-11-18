// HARNESS: the Shared State page shows NotesCard and two snippets but no App / provider / chat.
// Built on the quickstart's App.tsx + ChatScreen (same provider, same "default" agent).
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { View } from "react-native";
import { ChatScreen } from "../../src/ChatScreen"; // HARNESS: quickstart chat, the page shows none
import { NotesCard } from "./src/NotesCard";
import { LanguageButton } from "./src/LanguageButton";

// HARNESS: per-page runtime on the harness runtime server :8153 (Android emulator host alias)
const runtimeUrl = "http://10.0.2.2:8153/api/shared-state/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <View style={{ flex: 1 }}>
        <NotesCard />
        <LanguageButton />
        <ChatScreen />
      </View>
    </CopilotKitProvider>
  );
}
