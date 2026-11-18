# HITL Overview

> Let your agent and your React Native users work through tasks together.

## What is this? [#what-is-this]

Human-in-the-loop (HITL) lets an agent pause mid-run to collect input, confirmation, or a choice from the user, then resume with that answer folded back into its reasoning. It turns an autonomous workflow into a collaborative one: the agent keeps its context, and the user keeps the steering wheel.

<video
  src="https://cdn.copilotkit.ai/docs/copilotkit/images/coagents/human-in-the-loop-example.mp4"
  className="rounded-lg shadow-xl"
  loop
  playsInline
  controls
  autoPlay
  muted
/>

## When should I use this? [#when-should-i-use-this]

Use HITL when you need:

- **Quality control**: a human gate at high-stakes decision points.
- **Missing input**: the agent needs a value only the user knows, such as a meeting time.
- **Risky actions**: the agent must get a yes before it sends, pays, or deletes.
- **Expert input**: the user supplies knowledge the model lacks.

## Two patterns for HITL in CopilotKit [#two-patterns-for-hitl-in-copilotkit]

CopilotKit has two ways to pause an agent turn and ask the user something. They look alike from the outside (the chat pauses, your component appears, the user answers, the run resumes), but they're wired differently on the backend.

| Pattern | Who decides to pause? | Backend surface |
| --- | --- | --- |
| `useHumanInTheLoop` | The **LLM**, by calling a tool your app registered | A frontend-only tool (schema + `render`) |
| `useInterrupt` | Your **agent code**, at a step that must stop for a person | An interrupt your agent emits, for example LangGraph `interrupt()` or Mastra `suspend()` |

**Pick `useHumanInTheLoop`** when the model decides to ask the user, and you want the question to appear in the normal tool-call flow.

**Pick `useInterrupt`** when the pause is a checkpoint in your agent code: that code path always needs a human answer, and the server-side contract is an interrupt. On the Built-in Agent, interrupts are temporarily unavailable, so use `useHumanInTheLoop` there.

<Steps>
  <Step>
    ### Install the Antigravity AG-UI adapter

    ```bash
    pip install ag-ui-antigravity google-antigravity
    ```

  </Step>
  <Step>
    ### Ask for the human with a frontend tool

    The simplest route is an ordinary frontend tool. Register it in the
    browser with `useHumanInTheLoop`, or with `useFrontendTool` and an `async`
    handler that resolves once the user has answered. Each run carries that
    tool definition to the agent, the adapter rebuilds it as a custom
    Antigravity tool, and when the model calls it the call parks as an awaited
    coroutine — the SSE response for that run closes, and the adapter resolves
    the parked call from a later HTTP run with whatever the handler returned.
    The model receives that value as the tool's real return value, so there is
    no proxy tool and no fire-and-forget long-running-tool workaround.

  </Step>
  <Step>
    ### Or pause a server tool with `experimental_interrupt()`

    When the backend decides it needs the user, a Python server tool can pause
    itself on an AG-UI interrupt with the adapter's experimental
    `experimental_interrupt()` and carry on with the answer:

    ```python
    from ag_ui_antigravity import experimental_interrupt

    async def schedule_meeting(topic: str, attendee: str) -> str:
        """Books a meeting once the user picks a time."""
        answer = await experimental_interrupt(
            "schedule_meeting",
            message=f"Pick a time for {topic}",
            metadata={"topic": topic, "attendee": attendee},
        )
        if not answer.resolved:
            return f"Not scheduled ({answer.status})."
        return f"Scheduled for {answer.payload['chosen_label']}."
    ```

    The run ends with `RUN_FINISHED` carrying an interrupt outcome, which
    `useInterrupt` renders; the payload the user resolves it with comes back
    unchanged in `answer.payload`. `answer.status` is `"resolved"`,
    `"cancelled"` or `"abandoned"` (the user sent a new message instead).

  </Step>
  <Step>
    ### Name the tool in the agent's instructions

    That leaves the agent with one job: knowing the tool exists and when to
    call it. A model that is never told about `book_call` will answer in prose
    and the picker will never mount.

~~~~python title="hitl.py"
from agents._common import build

HITL_IN_CHAT_PROMPT = (
    "You help users book an onboarding call with the sales team. "
    "When they ask to book a call, call the frontend-provided "
    "`book_call` tool with a short topic and the user's name. "
    "Keep any chat reply to one short sentence."
)


def hitl_in_chat_agent():
    return build(system_instructions=HITL_IN_CHAT_PROMPT)


~~~~

    The frontend tool is dispatched to the browser at most once per turn
    (`deduplicate_tool_calls`, on by default), so a model that re-issues the
    same call after the harness backgrounds it does not ask the user twice.

  </Step>
</Steps>

<Callout type="info" title="ask_question is off in this showcase">
  Antigravity's own `ask_question` built-in tool — the one primitive that would
  park on a real AG-UI interrupt — is disabled here with
  `CapabilitiesConfig(enabled_tools=[BuiltinTools.FINISH])`. The CopilotKit
  demos answer a tool call with a `ToolMessage`, not an interrupt `resume`, so
  a turn that parked on `ask_question` would wait forever. `FINISH` has to stay
  enabled: it is how the harness ends a turn.
</Callout>

## Pattern 1: `useHumanInTheLoop` (tool-based) [#pattern-1-usehumanintheloop-tool-based]

Register a HITL tool with `useHumanInTheLoop`. When the model calls it, CopilotKit renders your component for the call. While the call is running, the component gets a `respond` callback. The agent receives the answer as the tool result and continues from there.

```tsx title="src/MeetingApproval.tsx"
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
    render: ({ args, respond, result }) => (
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
```

`respond` is set only while the call is running. Before that, the arguments are still streaming in, and `args` can be partial. After the user answers, `result` holds the tool result as a string.

Call `useMeetingApproval()` in a component under `CopilotKitProvider`. The slots are data your app owns, so you can swap in real availability or a calendar API.

### Where the card renders [#where-the-card-renders]

The rendered `CopilotChat` and `CopilotModal` from `@copilotkit/react-native/components` draw the card in the conversation. The root `CopilotChat`, `CopilotPopup`, and `CopilotSidebar` don't draw messages, so in your own chat, render tool calls with `useRenderToolCall`. See [Headless UI](/react-native/google-antigravity/custom-look-and-feel/headless-ui).

Ask the agent to book a meeting with Alex about the launch. The card appears in the chat. Tap a slot, and the agent confirms the time you picked.

## Pattern 2: `useInterrupt` (agent-paused) [#pattern-2-useinterrupt-agent-paused]

With an interrupt, your agent code enforces the pause, for example with LangGraph's `interrupt()`:

1. A step calls `interrupt({...})`, and the run stops.
2. The app receives the payload and renders your UI.
3. The user answers, and the run resumes with the answer.

CopilotKit's `useInterrupt` hook is the render contract. The rendered `CopilotChat` from `/components` draws its element after the last message.

See the [`useInterrupt` deep dive](/react-native/google-antigravity/human-in-the-loop/useInterrupt) for the full walkthrough, including the backend and the render callback.

## Going headless [#going-headless]

Both patterns can drive UI outside the chat. For interrupts, set `renderInChat: false` and place the element that `useInterrupt` returns. For a tool-based pause, a frontend tool's Promise can drive your own app state. See the [headless interrupts guide](/react-native/google-antigravity/human-in-the-loop/headless).

<IntegrationGrid path="human-in-the-loop" />
