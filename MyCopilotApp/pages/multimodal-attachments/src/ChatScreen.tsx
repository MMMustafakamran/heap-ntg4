import { useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { CopilotChat, useCopilotChatContext } from "@copilotkit/react-native";

function Composer() {
  const { attachments, openPicker, removeAttachment, submitMessage, isRunning } =
    useCopilotChatContext();
  const [text, setText] = useState("");

  return (
    <View style={{ padding: 8, gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {attachments.map((attachment) => (
          <Pressable key={attachment.id} onPress={() => removeAttachment(attachment.id)}>
            {attachment.type === "image" && attachment.source.type === "data" ? (
              <Image
                source={{ uri: `data:${attachment.source.mimeType};base64,${attachment.source.value}` }}
                style={{ width: 48, height: 48, borderRadius: 8 }}
              />
            ) : (
              <Text>{attachment.status === "uploading" ? "Uploading..." : attachment.filename}</Text>
            )}
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={openPicker}>
          <Text>Attach</Text>
        </Pressable>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <Pressable
          disabled={isRunning}
          onPress={() => {
            void submitMessage(text);
            setText("");
          }}
        >
          <Text>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ChatScreen() {
  return (
    <CopilotChat agentId="default" attachments={{ enabled: true }}> {/* [!code highlight] */}
      {/* Your message list goes here. */}
      <Composer />
    </CopilotChat>
  );
}
