// HARNESS: the page says "use it for assistant text in your message list" but shows no list. This is the
// quickstart src/ChatScreen.tsx with the assistant row rendered by <AssistantBubble> (doc) and the doc's
// "ready-made bubble" <AssistantMessage> under it.
import { useCallback, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAgent, useCopilotKit } from "@copilotkit/react-native/headless";
import { AssistantMessage } from "@copilotkit/react-native/components";
import { AssistantBubble } from "./AssistantBubble";

export function ChatScreen() {
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: "default" });
  const messages = agent?.messages ?? [];
  const isLoading = agent?.isRunning ?? false;
  const chatMessages = messages.flatMap((message) =>
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.length > 0
      ? [{ id: message.id, role: message.role, content: message.content }]
      : [],
  );

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading || !agent) return;
    setInputText("");
    agent.addMessage({ id: `user-${Date.now()}`, role: "user", content: text });
    await copilotkit.runAgent({ agent });
  }, [inputText, isLoading, agent, copilotkit]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={({ item }) => {
          const text = item.content;
          const isStreaming = isLoading;
          return item.role === "assistant" ? (
            <View style={{ padding: 12, gap: 8 }}>
              <AssistantBubble text={text} />
              {/* Doc: "The ready-made bubble" */}
              <AssistantMessage content={text} isLoading={isStreaming} />
            </View>
          ) : (
            <View style={{ padding: 12, maxWidth: "80%" }}>
              <Text>{text}</Text>
            </View>
          );
        }}
        keyExtractor={(item, i) => item.id ?? String(i)}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={{ flexDirection: "row", padding: 8 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={handleSend} style={{ padding: 8 }}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
