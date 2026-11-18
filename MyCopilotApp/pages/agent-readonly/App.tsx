// HARNESS: the Agent Read-Only Context page shows only ProfileScreen (with props) and no App / provider /
// chat. Built on the quickstart's App.tsx + ChatScreen. The "Try it" step says "Change the name in your
// app and ask again", so a name TextInput feeds ProfileScreen's userName prop.
import { useState } from "react";
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { TextInput, View } from "react-native";
import { ChatScreen } from "../../src/ChatScreen"; // HARNESS: quickstart chat, the page shows none
import { ProfileScreen } from "./src/ProfileScreen";

// HARNESS: per-page runtime on the harness runtime server :8153 (Android emulator host alias)
const runtimeUrl = "http://10.0.2.2:8153/api/agent-readonly/copilotkit";

export default function App() {
  const [userName, setUserName] = useState("Ada Lovelace"); // HARNESS: sample props
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <View style={{ flex: 1 }}>
        <TextInput
          value={userName}
          onChangeText={setUserName}
          style={{ borderWidth: 1, margin: 8, padding: 8 }}
        />
        <ProfileScreen
          userName={userName}
          timezone="Asia/Karachi"
          recentActivity={["Opened the billing screen", "Exported invoice #42"]}
        />
        <ChatScreen />
      </View>
    </CopilotKitProvider>
  );
}
