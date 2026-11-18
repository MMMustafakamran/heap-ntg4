import { useEffect } from "react";
import { Button, ScrollView, Text, View } from "react-native";

export type GovernedAction = {
  id: string;
  summary: string;
  tool: string;
  reference: string;
  verdict: "allow" | "deny" | "require_approval";
  arguments: Record<string, unknown>;
};

export function GovernedActionCard({
  action,
  onApprove,
  onReject,
  onBlock,
}: {
  action: GovernedAction;
  onApprove: () => void;
  onReject: () => void;
  onBlock: () => void;
}) {
  // Policy verdicts that need no user decision answer at once.
  useEffect(() => {
    if (action.verdict === "allow") onApprove();
    if (action.verdict === "deny") onBlock();
  }, [action.id, action.verdict]);

  const status =
    action.verdict === "allow"
      ? "Allowed by policy"
      : action.verdict === "deny"
        ? "Blocked by policy"
        : "User approval required";

  return (
    <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e2e2ea", gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "500" }}>{status}</Text>
      <Text style={{ fontSize: 16, fontWeight: "600" }}>{action.summary}</Text>
      <Text style={{ color: "#57575b" }}>Tool: {action.tool}</Text>
      <Text style={{ color: "#57575b" }}>Reference: {action.reference}</Text>
      <ScrollView style={{ maxHeight: 160, backgroundColor: "#f7f7f9", borderRadius: 8, padding: 8 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 12 }}>
          {JSON.stringify(action.arguments, null, 2)}
        </Text>
      </ScrollView>
      {action.verdict === "require_approval" ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button title="Approve and run" onPress={onApprove} />
          <Button title="Reject" onPress={onReject} />
        </View>
      ) : null}
    </View>
  );
}
