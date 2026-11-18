# Pausing the Agent for Input

> Pause an agent run, hand control to a React Native component, and resume with the user's answer.

## What is this? [#what-is-this]

Some agent steps need a person's answer before the run can continue, such as approving a payment or picking a meeting time. `useInterrupt` pauses the run, shows your React Native component, and resumes the run with the answer. How the pause works depends on your agent framework.

Some agent frameworks can't pause a run mid-tool the way LangGraph's `interrupt()` does. Use `useHumanInTheLoop` for the Promise-based frontend-tool path instead: the agent calls the tool, the app holds the request open, and the Promise resolves once the user answers. The user sees the same flow: the agent pauses, the user answers, and the agent continues. Only the mechanism is different.

## When should I use this? [#when-should-i-use-this]

Use `useInterrupt` when the pause is a **checkpoint in your agent code**, where the code path _must_ stop and wait for a human. It is not for a tool call the model decides to make. Typical cases:

- A sensitive action (payments, irreversible writes) must be approved
- A required value isn't known and only the user can give it
- The agent reaches an approval step in a longer workflow
- You want the server-side contract to be an interrupt that resumes with a payload

When the model decides on the fly to ask the user, use [`useHumanInTheLoop`](/react-native/google-antigravity/human-in-the-loop) instead.

## The frontend: `useHumanInTheLoop` renders the picker [#the-frontend-usehumanintheloop-renders-the-picker]

`useHumanInTheLoop` registers `schedule_meeting` as a frontend tool and renders the picker in the chat. When the user picks a slot or cancels, `respond(...)` sends the choice back as the tool result. This is the frontend-tool equivalent of the `event` and `resolve` pair in `useInterrupt`.

```tsx title="src/MeetingChat.tsx"
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
```

`respond` is set only while the tool call is running.

## The backend: agent instructed to call the frontend tool [#the-backend-agent-instructed-to-call-the-frontend-tool]

The agent has no local `schedule_meeting` implementation. The tool is registered entirely in your app. The backend's only job is to tell the model to call `schedule_meeting` when the user wants to book a meeting. AG-UI routes the tool call to the app, where the Promise-returning handler takes over:

> **Not available for Google Antigravity yet.** This sample comes from the showcase's `gen-ui-interrupt` demo, and Google Antigravity doesn't have it yet.

Ask the agent to book a call. The picker appears in the chat. Tap **Tomorrow at 09:00**, and the agent continues with your choice.

## AG-UI standard interrupt flow vs. custom-event flow [#ag-ui-standard-interrupt-flow-vs-custom-event-flow]

This section is a reference for developers who write `render` code for their own agent. The [`useInterrupt` reference](/reference/react-native/hooks/useInterrupt) lists every option. `useInterrupt` handles two kinds of interrupt, and your agent framework decides which kind it sends.

### Standard flow (`RUN_FINISHED` with `outcome.type === "interrupt"`) [#standard-flow-run_finished-with-outcometype--interrupt]

An agent that follows the AG-UI protocol signals an interrupt with a `RUN_FINISHED` event whose outcome carries the interrupts:

```text
outcome.type === "interrupt"
outcome.interrupts  // Interrupt[]
```

The hook shows the interrupts after the run finalizes. `render` receives:

- **`interrupt`**: the primary `Interrupt` (`interrupts[0]`), with shape `{ id, reason, message?, toolCallId?, responseSchema?, expiresAt?, metadata? }`.
- **`interrupts`**: every open interrupt.
- **`resolve(payload?, interruptId?)`**: records an answer for the targeted interrupt. The run resumes once every open interrupt has an answer.
- **`cancel(interruptId?)`**: records a cancellation for the targeted interrupt. The run also resumes once every open interrupt is addressed.

### Custom-event flow (`on_interrupt`) [#custom-event-flow-on_interrupt]

Agents can emit a custom `on_interrupt` event. The LangGraph adapter does this by default. `render` gets its payload in `event.value`, with `interrupt` set to `null` and `interrupts` to `[]`. `resolve(payload)` resumes the run right away, through `forwardedProps.command`. `cancel()` only dismisses the interrupt without resuming, because this flow has no cancel answer.

If both signals arrive on the same run, the standard flow wins.

### Approve / Cancel example [#approve--cancel-example]

```tsx
import { Button, Text, View } from "react-native";
import { useInterrupt } from "@copilotkit/react-native/headless";

function ApprovalPanel() {
  const element = useInterrupt({
    renderInChat: false,
    render: ({ interrupt, resolve, cancel }) => (
      <View style={{ padding: 12, gap: 8 }}>
        <Text>{interrupt?.message ?? "Approve this action?"}</Text>
        <Button title="Approve" onPress={() => resolve({ approved: true })} />
        <Button title="Cancel" onPress={() => cancel()} />
      </View>
    ),
  });

  return element;
}
```

Both methods return the run result once the run restarts, or nothing while other open interrupts still wait for an answer.

### More than one open interrupt [#more-than-one-open-interrupt]

Some agents issue more than one interrupt in a single run. Each has its own `id`, so answer them one by one:

```tsx
render: ({ interrupts, resolve, cancel }) => (
  <View>
    {interrupts.map((item) => (
      <View key={item.id} style={{ flexDirection: "row", gap: 8 }}>
        <Text>{item.message}</Text>
        <Button title="Approve" onPress={() => resolve({ ok: true }, item.id)} />
        <Button title="Cancel" onPress={() => cancel(item.id)} />
      </View>
    ))}
  </View>
),
```

The run resumes only after **every** open interrupt is addressed. If you leave out `interruptId`, the primary interrupt is targeted, and the hook logs a warning when several are open.

### `responseSchema` is not validated [#responseschema-is-not-validated]

An `Interrupt` can carry a `responseSchema`, a JSON Schema that describes the answer the agent expects. `useInterrupt` passes it to `render` as `interrupt.responseSchema`, but it does **not** check your `resolve` payload against it. The agent validates the answer when it resumes.

## Provider setup [#provider-setup]

The component that calls `useInterrupt` or `useHumanInTheLoop` must be under `CopilotKitProvider`:

```tsx title="App.tsx"
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { MeetingChat } from "./src/MeetingChat";

const runtimeUrl = "http://localhost:8200/api/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <MeetingChat />
    </CopilotKitProvider>
  );
}
```
