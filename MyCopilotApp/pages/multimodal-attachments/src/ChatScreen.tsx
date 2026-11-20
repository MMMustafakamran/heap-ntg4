import { useState } from "react";
import { FlatList, Image, Pressable, Text, TextInput, View } from "react-native"; // HARNESS: FlatList for the message list below
import { CopilotChat, useCopilotChatContext } from "@copilotkit/react-native";
import type { NativeFileInput } from "@copilotkit/react-native";
import { useAgent } from "@copilotkit/react-native/headless"; // HARNESS: message list below
import * as FileSystem from "expo-file-system/legacy";

// Doc callout "expo-file-system 19 and later: pass your own reader" (58.0.14 installed), verbatim:
const attachments = {
  enabled: true,
  onUpload: async (file: NativeFileInput) => ({
    type: "data" as const,
    value: await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    }),
    mimeType: file.mimeType,
  }),
};

// HARNESS: the page says "Your message list goes here" and shows none; this is the quickstart's
// FlatList (src/ChatScreen.tsx) message rendering, reused as is.
function MessageList() {
  const { agent } = useAgent({ agentId: "default" });
  const messages = agent?.messages ?? [];
  const chatMessages = messages.flatMap((message) => {
    if (
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.length > 0
    ) {
      return [{ id: message.id, content: message.content }];
    }
    return [];
  });
  return (
    <FlatList
      style={{ flex: 1 }}
      data={chatMessages}
      renderItem={({ item }) => (
        <View style={{ padding: 12, maxWidth: "80%" }}>
          <Text>{item.content}</Text>
        </View>
      )}
      keyExtractor={(item, i) => item.id ?? String(i)}
    />
  );
}

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
    // HARNESS: `{/* [!code highlight] */}` after this tag was a .md-export leak (not on the rendered
    // page) that caused "Text strings must be rendered within a <Text>"; removed. `attachments` is the
    // callout's object ("Pass this object as the attachments prop in the samples below").
    <CopilotChat agentId="default" attachments={attachments}>
      {/* Your message list goes here. */}
      <MessageList />
      <Composer />
    </CopilotChat>
  );
}
