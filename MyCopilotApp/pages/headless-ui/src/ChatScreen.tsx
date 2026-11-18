import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useAgent,
  useCopilotKit,
  useRenderToolCall,
  useSuggestions,
  type Message,
  type ToolCall,
  type ToolMessage,
} from "@copilotkit/react-native/headless";

type Row =
  | { kind: "text"; id: string; role: "user" | "assistant"; text: string }
  | { kind: "tool"; id: string; toolCall: ToolCall };

// One row per text message and one per tool call.
function toRows(messages: Message[]): Row[] {
  const rows: Row[] = [];
  for (const message of messages) {
    if (message.role === "user" && typeof message.content === "string") {
      rows.push({ kind: "text", id: message.id, role: "user", text: message.content });
    }
    if (message.role === "assistant") {
      if (message.content) {
        rows.push({ kind: "text", id: message.id, role: "assistant", text: message.content });
      }
      for (const toolCall of message.toolCalls ?? []) {
        rows.push({ kind: "tool", id: `${message.id}:${toolCall.id}`, toolCall });
      }
    }
  }
  return rows;
}

export function ChatScreen() {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: "default" });
  const renderToolCall = useRenderToolCall(); // [!code highlight]
  const { suggestions } = useSuggestions({ agentId: "default" });
  const [input, setInput] = useState("");

  // Rebuilt on every render: useAgent re-renders this screen on each change.
  const rows = toRows(agent.messages);
  const toolResults = new Map<string, ToolMessage>();
  for (const message of agent.messages) {
    if (message.role === "tool") toolResults.set(message.toolCallId, message);
  }

  const send = async (text: string) => {
    if (!text.trim() || agent.isRunning) return;
    setInput("");
    agent.addMessage({ id: `user-${Date.now()}`, role: "user", content: text });
    try {
      await copilotkit.runAgent({ agent });
    } catch (error) {
      console.error("runAgent failed", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item }) => {
          if (item.kind === "tool") {
            return ( // [!code highlight:7]
              renderToolCall({
                toolCall: item.toolCall,
                toolMessage: toolResults.get(item.toolCall.id),
              }) ?? <Text style={{ color: "#888" }}>Called {item.toolCall.function.name}</Text>
            );
          }
          return (
            <View
              style={{
                alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: item.role === "user" ? "#4f46e5" : "#f1f1f4",
                borderRadius: 16,
                padding: 12,
                maxWidth: "80%",
              }}
            >
              <Text style={{ color: item.role === "user" ? "#fff" : "#111" }}>{item.text}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ gap: 8 }}>
            {suggestions.map((suggestion) => (
              <Pressable key={suggestion.title} onPress={() => send(suggestion.message)}>
                <Text>{suggestion.title}</Text>
              </Pressable>
            ))}
          </View>
        }
      />
      <View style={{ flexDirection: "row", gap: 8, padding: 8 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
        />
        {agent.isRunning ? (
          <Pressable onPress={() => copilotkit.stopAgent({ agent })}>
            <Text>Stop</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => send(input)}>
            <Text>Send</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
