// Doc: https://docs.copilotkit.ai/react-native/google-antigravity/shared-state (src/NotesCard.tsx, verbatim
// plus the "Writing agent state" Button snippet placed "In NotesCard, below the list" as the doc says).
import { Text, View } from "react-native";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-native/headless";
import { Button } from "react-native"; // from the doc's "Writing agent state" snippet

type NotesState = {
  notes?: string[];
  preferences?: { tone?: string };
};

export function NotesCard() {
  const { agent } = useAgent({ // [!code highlight:4]
    agentId: "default",
    updates: [UseAgentUpdate.OnStateChanged],
  });
  const state = (agent.state ?? {}) as NotesState;

  return (
    <View style={{ padding: 16, gap: 4 }}>
      {(state.notes ?? []).map((note) => (
        <Text key={note}>• {note}</Text>
      ))}
      {/* In NotesCard, below the list: (doc) */}
      <Button
        title="Prefer short answers"
        onPress={() =>
          agent.setState({
            ...state,
            preferences: { ...state.preferences, tone: "concise" },
          })
        }
      />
    </View>
  );
}
