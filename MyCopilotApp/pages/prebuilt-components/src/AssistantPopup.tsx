// Doc: "Popup and drawer around your own chat", src/AssistantPopup.tsx, verbatim.
import { useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CopilotPopup, useCopilotChatContext } from "@copilotkit/react-native";

function PopupChat() {
  const { messages, isRunning, submitMessage } = useCopilotChatContext();
  const [text, setText] = useState("");

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages.filter(
          (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content,
        )}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <Text style={{ padding: 12 }}>{item.content}</Text>}
      />
      <View style={{ flexDirection: "row", padding: 8 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <TouchableOpacity
          disabled={isRunning || !text.trim()}
          onPress={() => {
            void submitMessage(text);
            setText("");
          }}
          style={{ padding: 8 }}
        >
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function AssistantPopup() {
  return (
    <CopilotPopup agentId="default" headerTitle="Assistant" height="70%">
      <PopupChat />
    </CopilotPopup>
  );
}
