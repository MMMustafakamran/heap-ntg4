# Headless Interrupts

> Answer agent interrupts from any React Native view, outside the chat.

## What is this? [#what-is-this]

Sometimes the agent's question belongs outside the chat: on a dashboard, in a bottom sheet, or in a native alert. A headless interrupt lets any view show the question and resume the run with the answer. No chat needs to be mounted.

On React Native this is also how a custom chat shows interrupts. The root `CopilotChat`, `CopilotPopup`, and `CopilotSidebar` don't draw them, so your own UI places them.

Promise-based integrations have no native interrupt. Build the same experience with a frontend tool whose handler returns a Promise:

- The handler holds the Promise open and stores the request in state.
- Your screen renders the choice anywhere.
- The user's answer resolves the Promise, which becomes the tool result.

## When should I use this? [#when-should-i-use-this]

- **Non-chat screens**: dashboards, settings, forms, or anywhere you want the agent's question without the transcript.
- **Your own chat**: the question appears as a row in your `FlatList`, or as its footer.
- **Testing**: a fixed button grid is easier to drive from Detox or Maestro than a picker that appears after a model call.
- **Custom flow control**: you need to know exactly when the interrupt arrived (for example, to disable other controls) and when it was answered.

If you just want a picker in the rendered chat, use [`useInterrupt`](/react-native/google-antigravity/human-in-the-loop/useInterrupt) with the default `renderInChat: true`. For pauses that the model decides on, use [`useHumanInTheLoop`](/react-native/google-antigravity/human-in-the-loop).

## The primitives [#the-primitives]

The handler stores the request and its resolver. The `render` function returns `null`, so the chat stays clean and the question shows only where you render it:

```tsx title="src/MeetingRequestPanel.tsx"
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
```

A few things this pattern is careful about:

- `setRequest` runs inside the handler, so the panel shows the question as soon as the agent calls the tool, and hides it after the user answers.
- The resolver lives in a ref, so a re-render doesn't lose it.
- `render: () => null` keeps the call out of the chat.

The agent sees the answer as the tool result and continues.

## Provider setup [#provider-setup]

The component that registers the tool must be under `CopilotKitProvider`:

```tsx title="App.tsx"
import { View } from "react-native";
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { MeetingRequestPanel } from "./src/MeetingRequestPanel";
import { ChatScreen } from "./src/ChatScreen";

const runtimeUrl = "http://localhost:8200/api/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <View style={{ flex: 1 }}>
        <MeetingRequestPanel />
        <ChatScreen />
      </View>
    </CopilotKitProvider>
  );
}
```

Ask the agent to book a call. The slot buttons appear above the chat. Tap a slot, and the agent continues with your choice.
