import { Pressable, Text, View } from "react-native";
import { useHumanInTheLoop } from "@copilotkit/react-native/headless";
import { CopilotChat } from "@copilotkit/react-native/components";
import { z } from "zod";

export function MeetingChat() {
  useHumanInTheLoop({
    name: "schedule_meeting",
    description: "Ask the user to pick a meeting time.",
    parameters: z.object({ topic: z.string() }),
    render: ({ args, respond }) => (
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#f4f4f8", gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Pick a time for {args.topic ?? "a call"}</Text>
        <Pressable disabled={!respond} onPress={() => respond?.({ chosen_time: "09:00" })}>
          <Text>Tomorrow at 09:00</Text>
        </Pressable>
        <Pressable disabled={!respond} onPress={() => respond?.({ cancelled: true })}>
          <Text>Cancel</Text>
        </Pressable>
      </View>
    ),
  });

  return <CopilotChat />;
}
