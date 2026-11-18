// HARNESS: the Sub-Agents page shows no frontend code at all ("Rendering a live delegation log" has
// prose only, no snippet). Everything below the provider is a harness fill-in: the quickstart chat
// plus a plain list of agent.state.delegations, so the probe can see whether the log fills in.
import { CopilotKitProvider, useAgent } from "@copilotkit/react-native/headless";
import { ScrollView, Text, View } from "react-native";
import { ChatScreen } from "../../src/ChatScreen";

// HARNESS: per-page runtime on the harness runtime server (:8153)
const runtimeUrl = "http://10.0.2.2:8153/api/subagents/copilotkit";

// HARNESS: not on the page (the reader must write their own delegation log)
function DelegationLog() {
  const { agent } = useAgent({ agentId: "default" });
  const delegations: any[] = (agent?.state as any)?.delegations ?? [];
  return (
    <ScrollView style={{ maxHeight: 220, padding: 8 }}>
      <Text testID="delegation-count">{`delegations: ${delegations.length}`}</Text>
      {delegations.map((d) => (
        <View key={d.id} style={{ paddingVertical: 4 }}>
          <Text>{`${d.sub_agent} (${d.status}): ${String(d.result ?? "").slice(0, 120)}`}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <DelegationLog />
      <ChatScreen />
    </CopilotKitProvider>
  );
}
