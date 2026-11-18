// Doc: https://docs.copilotkit.ai/react-native/google-antigravity/shared-state/agent-readonly (src/ProfileScreen.tsx, verbatim)
import { Text, View } from "react-native";
import { useAgentContext } from "@copilotkit/react-native/headless";

export function ProfileScreen({
  userName,
  timezone,
  recentActivity,
}: {
  userName: string;
  timezone: string;
  recentActivity: string[];
}) {
  useAgentContext({ // [!code highlight:4]
    description: "The signed-in user's name and timezone",
    value: { userName, timezone },
  });

  useAgentContext({
    description: "The last actions the user took in the app, newest first",
    value: recentActivity,
  });

  return (
    <View style={{ padding: 16 }}>
      <Text>Signed in as {userName}</Text>
    </View>
  );
}
