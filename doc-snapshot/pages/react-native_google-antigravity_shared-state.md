# Shared State

> Create a two-way connection between your React Native UI and agent state.

## What is shared state? [#what-is-shared-state]

Shared state connects your app's UI with the agent's run. With shared state you can:

- Display the agent's current progress and intermediate results
- Update the agent's state through UI interactions
- React to state changes in real time across your app

<ImageZoom
  src="https://cdn.copilotkit.ai/docs/copilotkit/images/coagents/SharedStateCoAgents.gif"
  alt="Shared State Demo"
  width={1000}
  height={1000}
  className="rounded-lg shadow-lg border mt-0"
/>

## When should I use this? [#when-should-i-use-this]

Use shared state when you want the agent and the user to work on the same app state. The UI shows what the agent writes. The agent reads what the user changes in the UI.

<OpsPlatformCTA
  variant="inline"
  title="Building stateful agents?"
  body="Persistent threads ship with CopilotKit Intelligence on the free Developer tier."
  surface="docs_shared_state"
/>

## Reading agent state [#reading-agent-state]

<Steps>
  <Step>
    ### Turn on `get_shared_state` and tell the model to read it

    Antigravity sets an agent's instructions once, when the harness session
    starts, and the adapter forwards only the user's messages. Shared state
    therefore never reaches the prompt on its own. Instead, pass
    `experimental_app_state=True` to `AntigravityAgent`. It gives the agent a
    built-in `get_shared_state()` tool that returns the thread's shared state: what the UI sent with the current run (including edits made
    with `agent.setState`), or what a server tool last stored, whichever is
    newer. Say in the system instructions when to call it:

~~~~python title="shared_state.py"
READ_WRITE_PROMPT = (
    "You are a helpful, concise assistant. Call `get_shared_state` before "
    "every answer. Its `preferences` object holds the user's name, preferred "
    "tone, language and interests, which the user edits in the app: always "
    "respect them, and address the user by name when you know it. Its "
    "`notes` list holds what you have remembered so far. "
    "When the user asks you to remember something, or when you observe "
    "something worth surfacing in the UI, call `set_notes` with the FULL "
    "updated list of short note strings (existing notes + new)."
)


def shared_state_read_write_agent():
    return build(
        system_instructions=READ_WRITE_PROMPT,
        tools=[set_notes],
        experimental_app_state=True,
    )


~~~~

    The tool is silent: it emits no `TOOL_CALL_*` events, so no tool card
    appears in the chat. A tool of your own with the same name replaces it.

  </Step>
  <Step>
    ### Write state from a server tool

    Server tools are plain Python functions passed as `tools=[...]`. Inside
    one, the adapter's `experimental_get_state()` returns the thread's shared state and
    `experimental_set_state()` replaces it. `experimental_set_state()` streams a `STATE_SNAPSHOT` to the
    browser straight away, before the tool's own result, so any component
    subscribed with `useAgent` re-renders while the agent is still running.

~~~~python title="shared_state.py"
def set_notes(notes: list[str]) -> str:
    """Replace the notes array in shared state with the full updated list.

    Use this tool whenever the user asks you to "remember" something, or
    when you have an observation about the user worth surfacing in the
    UI's notes panel. Always pass the FULL notes list (existing notes +
    any new ones), not a diff. Keep each note short (< 120 chars).
    """
    experimental_set_state({**experimental_get_state(), "notes": notes})
    return "Notes updated."


~~~~

    Spread `experimental_get_state()` into the new value, as above: `experimental_set_state()` replaces
    the whole object, so leaving it out drops the keys the UI owns, such as
    `preferences`. Both helpers work only inside a server tool, where the
    adapter knows which thread the call belongs to. Called anywhere else, they
    raise.

  </Step>
</Steps>

<Callout type="warn" title="The model sees state only when it asks">
  Other frameworks can fold the UI's state into the system prompt on every
  run. With Antigravity the model has to call `get_shared_state`. If the
  instructions do not tell it to, UI edits do not reach that answer.
</Callout>

<Callout type="info" title="Experimental">
  `experimental_app_state`, `experimental_get_state()` and
  `experimental_set_state()` are experimental. Their names and behaviour may
  change in a later release of the adapter.
</Callout>

Subscribe a component to the agent's state with `useAgent`. Each time the agent changes its state, for example from a tool call, the hook re-renders your component with the new values.

```tsx title="src/NotesCard.tsx"
import { Text, View } from "react-native";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-native/headless";

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
    </View>
  );
}
```

`agent.state` is a plain object. Read it like any other React data and render the parts you care about: notes the agent wrote, structured output, progress, or anything else the agent put there.

## Writing agent state [#writing-agent-state]

The same `agent` has a `setState` method. Call it from a UI event, and the agent reads the new value on its next turn. The UI's writes steer the model.

```tsx
import { Button } from "react-native";

// In NotesCard, below the list:
<Button
  title="Prefer short answers"
  onPress={() =>
    agent.setState({
      ...state,
      preferences: { ...state.preferences, tone: "concise" },
    })
  }
/>
```

This makes shared state two-way. The UI can send the agent new inputs, such as preferences, selections, or partial work, without the chat.

The agent reads the new state on its next run. To run it right away, call `copilotkit.runAgent({ agent })` (from `useCopilotKit`) after `setState`. Running through `copilotkit` also sends your frontend tools and context with the run. To tell the model what changed, add a message first:

```tsx
const { copilotkit } = useCopilotKit();

agent.setState({ ...state, language: newLanguage });
agent.addMessage({
  id: `user-${Date.now()}`,
  role: "user",
  content: `The language has been updated to ${newLanguage}.`,
});
await copilotkit.runAgent({ agent });
```

See [Programmatic Control](/react-native/google-antigravity/programmatic-control) for more ways to run the agent from code.

## Rendering shared state in the UI [#rendering-shared-state-in-the-ui]

Because `agent.state` is plain React data, the UI layer is whatever you'd normally build. Nothing about it is chat-specific: `useAgent` works in any component under `CopilotKitProvider`, so you can render the state on your main screen, not just next to the chat. See **[Render agent state in your app](/react-native/google-antigravity/shared-state/rendering-in-app)** for the full pattern.

## Streaming partial state updates [#streaming-partial-state-updates]

By default, agent state only updates *between* backend checkpoints, so a long tool call shows up as one burst at the end. State streaming copies one tool argument into a state key while the model writes it, so the UI shows the answer token by token.

<WhenFrameworkSupports feature="shared-state-streaming">

> **Not available for Google Antigravity yet.** The Shared State: Streaming demo for Google Antigravity can't run yet, so its code isn't shown here.

See **[State Streaming](/react-native/google-antigravity/shared-state/streaming)** for the full walkthrough, including the `useAgent` subscription on the frontend.

</WhenFrameworkSupports>

<WhenFrameworkSupports feature="shared-state-streaming" not>

State streaming isn't available on this framework yet. The UI gets the agent's state between checkpoints.

</WhenFrameworkSupports>

## Read-only context [#read-only-context]

When a value is **UI-owned**, and the agent should read it but never write it back, use `useAgentContext` instead of shared state. Examples are the current user, the selected record, or the open screen. It sends values one way, from the UI to the agent, and removes them when the component unmounts.

See **[Agent Read-Only Context](/react-native/google-antigravity/shared-state/agent-readonly)** for the full pattern.

<IntegrationGrid path="shared-state" exclude={["agno", "agent-spec", "spring-ai", "langroid"]} />
