import { useCallback, useRef, useState } from "react";
import { Button, Text, View } from "react-native";
import { useFrontendTool } from "@copilotkit/react-native/headless";
import { z } from "zod";

type Request = { topic: string };

const SLOTS = [
  { iso: "2026-11-17T15:00:00Z", label: "Tue 3 PM" },
  { iso: "2026-11-18T10:00:00Z", label: "Wed 10 AM" },
];

export function MeetingRequestPanel() {
  const [request, setRequest] = useState<Request | null>(null);
  const resolver = useRef<((answer: unknown) => void) | null>(null);

  useFrontendTool({
    name: "schedule_meeting",
    description: "Ask the user to pick a meeting time.",
    parameters: z.object({ topic: z.string() }),
    handler: (args) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setRequest(args);
      }),
    render: () => null,
  });

  const answer = useCallback((value: unknown) => {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  }, []);

  if (!request) return null;

  return (
    <View style={{ gap: 8 }}>
      <Text>Pick a slot for {request.topic}:</Text>
      {SLOTS.map((slot) => (
        <Button
          key={slot.iso}
          title={slot.label}
          onPress={() => answer({ chosen_time: slot.iso, chosen_label: slot.label })}
        />
      ))}
      <Button title="None of these work" onPress={() => answer({ cancelled: true })} />
    </View>
  );
}
