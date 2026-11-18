# Frontend Tools

> Let your agent interact with and update your React Native app's UI.

## What is this? [#what-is-this]

A frontend tool is a function that you register in your app. Your agent can call it, and the function runs on the device. Because the handler runs in your app, it has direct access to component state, native modules, and any library the app already uses. That's how an agent can "reach into" the app: update React state, switch a screen, open a sheet, or read local storage.

This page covers the "agent drives the UI" shape of frontend tools. To render a component for a tool call, see [Components as Tools](/react-native/google-antigravity/generative-ui/tool-based). To ask the user before a tool runs, see [Human-in-the-loop](/react-native/google-antigravity/human-in-the-loop).

## When should I use this? [#when-should-i-use-this]

Use frontend tools when your agent needs to:

- Read or modify React component state
- Call device APIs through native modules, such as haptics, the clipboard, or storage
- Navigate between screens
- Show alerts, toasts, or bottom sheets
- Interact with third-party libraries in your app

## How it works in code [#how-it-works-in-code]

<Steps>
  <Step>
    ### Nothing to wire on the agent

    The Antigravity AG-UI adapter turns every tool the frontend registers into
    a custom Antigravity tool on each run, so the agent declares no tools of
    its own for this. A component registered with `useComponent` reaches the
    model through the AG-UI request payload; when the model calls it, the
    adapter parks the call until the browser answers and hands the result back
    to the model as the tool's return value.

  </Step>
  <Step>
    ### Tell the model when to call it

    This is the part that is easy to miss. The tool arrives on every run, but a
    model with no instruction about it will answer in prose and never call it.
    Name the tool in the system instructions and say what it is for.

~~~~python title="gen_ui_tool_based.py"
from agents._common import build

SYSTEM_PROMPT = """You are a data visualization assistant.

When the user asks for a chart, call `render_bar_chart` or `render_pie_chart`
with a concise title, short description, and a `data` array of
`{label, value}` items. Pick bar for comparisons over a small set of
categories; pick pie for composition / share-of-whole.

If the user names a chart subject but does NOT supply concrete numbers
(e.g. "show me a pie chart of website traffic by source"), do NOT ask
them for data. Invent plausible illustrative sample values yourself,
call the appropriate `render_*` tool immediately, and briefly note in
the follow-up that the values are illustrative samples. Always render
the chart on the first turn -- never reply with a clarifying question
asking for the data.

Keep chat responses brief -- let the chart do the talking."""


def gen_ui_tool_based_agent():
    return build(system_instructions=SYSTEM_PROMPT)


~~~~

  </Step>
</Steps>

Register a frontend tool with `useFrontendTool`. Give it a name, a schema for its parameters, and a handler. The agent can then call it like any other tool, and your app runs it on the device.

`parameters` takes any [Standard Schema](https://standardschema.dev), such as a `zod` schema. `zod` is an optional peer dependency of `@copilotkit/react-native`, so add it to your app:

```bash
npm install zod
```

```tsx title="src/TaskScreen.tsx"
import { useState } from "react";
import { Text, View } from "react-native";
import { useFrontendTool } from "@copilotkit/react-native/headless";
import { z } from "zod";

export function TaskScreen() {
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  useFrontendTool({ // [!code highlight:11]
    name: "filter_tasks",
    description: "Filter the visible task list by status.",
    parameters: z.object({
      status: z.enum(["all", "open", "done"]),
    }),
    handler: async ({ status }) => {
      setFilter(status);
      return { applied: true, status };
    },
  });

  return (
    <View style={{ padding: 16 }}>
      <Text>Current filter: {filter}</Text>
    </View>
  );
}
```

The handler receives the parsed, type-safe parameters and can do anything your app can do: update state, call an API, or call a native module. Its return value is sent back to the agent as the tool result, so the model can reason about what happened.

Mount the component under `CopilotKitProvider`, next to your chat. This example uses the prebuilt chat from `@copilotkit/react-native/components`. A chat you build yourself, like the one in the [quickstart](/react-native/google-antigravity/quickstart), works the same way.

```tsx title="App.tsx"
import { View } from "react-native";
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { CopilotChat } from "@copilotkit/react-native/components";
import { TaskScreen } from "./src/TaskScreen";

// See the quickstart for emulator and device hosts.
const runtimeUrl = "http://localhost:8200/api/copilotkit";

export default function App() {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <View style={{ flex: 1 }}>
        <TaskScreen />
        <CopilotChat />
      </View>
    </CopilotKitProvider>
  );
}
```

<Callout type="info" title="Peer dependencies of the prebuilt chat">
  `@copilotkit/react-native/components` needs `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-reanimated`, and `react-native-streamdown`. If you only use the hooks, import from `/headless` and skip them. See [Import surfaces](/react-native/google-antigravity/quickstart#import-surfaces).
</Callout>

Ask the agent to show only open tasks. "Current filter" changes to `open`, and the agent replies after it reads the `{ applied: true }` result.

## Handlers read the values from registration [#handlers-read-the-values-from-registration]

`useFrontendTool` registers the tool once and keeps that `handler`. If the handler reads a value from props or state, it sees the value from the last registration. Pass those values as the second argument, so the tool registers again when they change:

```tsx
useFrontendTool(
  {
    name: "add_task",
    description: "Add a task to the list that is open on screen.",
    parameters: z.object({ title: z.string() }),
    handler: async ({ title }) => {
      await saveTask(listId, title); // your own storage call
      return { added: title, listId };
    },
  },
  [listId], // [!code highlight]
);
```

A state setter from `useState` never changes, so the first example needs no second argument.

## Register one tool per call [#register-one-tool-per-call]

`useFrontendTool` registers one tool per call. The React package also has `useFrontendTools` for a list of tools that changes between renders. `@copilotkit/react-native` does not export it, so call `useFrontendTool` once per tool, with the same number of calls on every render.

To hide a tool from the agent without removing it, set `available: false`. To offer a tool to one agent only, set `agentId`.

## Draw the call in the chat [#draw-the-call-in-the-chat]

Add `render` to the same `useFrontendTool` call to show UI for the call in the chat. The prebuilt chat draws it, and so does a chat you build with `useRenderToolCall`. `render` must return a React Native element or `null`. A bare string type-checks, then throws inside the chat's `FlatList`. See [Tool Call Rendering](/react-native/google-antigravity/generative-ui/tool-rendering) for the full pattern.

## Before you ship [#before-you-ship]

Your agent discovers the name, description, and parameter schema through the runtime connection. Before you ship a tool:

- Keep the description narrow.
- Validate the inputs.
- Ask the user before an action that cannot be undone. Use [`useHumanInTheLoop`](/react-native/google-antigravity/human-in-the-loop) for that.
- Keep privileged changes, secret API calls, and authorization checks on your backend.

For every option, see the [`useFrontendTool` reference](/reference/react-native/hooks/useFrontendTool).

<IntegrationGrid path="frontend-tools" />
