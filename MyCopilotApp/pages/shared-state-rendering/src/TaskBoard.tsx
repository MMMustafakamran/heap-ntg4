// Doc: https://docs.copilotkit.ai/react-native/google-antigravity/shared-state/rendering-in-app (src/TaskBoard.tsx, verbatim)
import { useEffect } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useAgent } from "@copilotkit/react-native/headless";

type Task = { id: string; label: string; done: boolean };
type BoardState = { title: string; items: Task[] };

const INITIAL_BOARD_STATE: BoardState = {
  title: "Project launch",
  items: [
    { id: "research", label: "Research user needs", done: true },
    { id: "prototype", label: "Build a prototype", done: false },
  ],
};

export function TaskBoard() {
  // No agentId means the "default" agent. Pass { agentId } to target another.
  const { agent, isReady } = useAgent();
  const state = (agent.state ?? {}) as Partial<BoardState>;

  useEffect(() => {
    if (!isReady) return;

    const current = (agent.state ?? {}) as Partial<BoardState>;
    const updates: Partial<BoardState> = {};
    if (current.title === undefined) updates.title = INITIAL_BOARD_STATE.title;
    if (current.items === undefined) updates.items = INITIAL_BOARD_STATE.items;

    if (Object.keys(updates).length > 0) {
      agent.setState({ ...(agent.state ?? {}), ...updates });
    }
  }, [agent, isReady, state.title, state.items]);

  const toggleItem = (id: string) => {
    agent.setState({
      ...agent.state,
      items: (state.items ?? []).map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    });
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>{state.title ?? "Untitled"}</Text>
      <FlatList
        data={state.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleItem(item.id)} style={{ paddingVertical: 8 }}>
            <Text style={{ textDecorationLine: item.done ? "line-through" : "none" }}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
