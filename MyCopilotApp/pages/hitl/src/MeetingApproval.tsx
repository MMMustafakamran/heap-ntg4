import { Pressable, Text, View } from "react-native";
import { useHumanInTheLoop } from "@copilotkit/react-native/headless";
import { z } from "zod";

const SLOTS = [
  { iso: "2026-11-17T09:00:00Z", label: "Tue 9 AM" },
  { iso: "2026-11-18T14:00:00Z", label: "Wed 2 PM" },
];

export function useMeetingApproval() {
  useHumanInTheLoop({ // [!code highlight:7]
    name: "schedule_meeting",
    description: "Ask the user to pick a meeting time.",
    parameters: z.object({
      topic: z.string(),
      attendee: z.string(),
    }),
    render: ({ args, respond, result, status }: any) => (console.log("QADBG", status, typeof respond, String(result)), 
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#f4f4f8", gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>
          Pick a time for {args.topic ?? "the meeting"}
        </Text>
        {result ? (
          <Text>Done: {result}</Text>
        ) : (
          <>
            {SLOTS.map((slot) => (
              <Pressable
                key={slot.iso}
                disabled={!respond}
                onPress={() => respond?.({ chosen_time: slot.iso, chosen_label: slot.label })}
              >
                <Text>{slot.label}</Text>
              </Pressable>
            ))}
            <Pressable disabled={!respond} onPress={() => respond?.({ cancelled: true })}>
              <Text>None of these work</Text>
            </Pressable>
          </>
        )}
      </View>
    ),
  });
}
