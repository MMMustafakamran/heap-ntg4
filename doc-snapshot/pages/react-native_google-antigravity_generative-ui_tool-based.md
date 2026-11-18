# Components as Tools

> Let your agent render your React Native components in the chat by calling them as tools.

## What is this? [#what-is-this]

Tool-based generative UI is the simplest form of generative UI. You register a React Native component with `useComponent`, and CopilotKit offers it to the agent as a tool. When the agent calls the tool, CopilotKit renders your component in the chat and passes the tool's arguments to it as props.

Unlike [tool rendering](/react-native/google-antigravity/generative-ui/tool-rendering), which draws UI for a real backend tool, here the tool is the component. There is no handler, no user interaction, and no server-side execution. The agent decides when to show it and fills in the data. CopilotKit renders it.

## When should I use this? [#when-should-i-use-this]

Use `useComponent` when you want to:

- Display rich UI (cards, charts, lists) in the chat
- Show structured data the agent has derived from its reasoning
- Render previews, status indicators, or visual summaries
- Let the agent present information beyond plain text

For components that need user input, see [Human-in-the-loop](/react-native/google-antigravity/human-in-the-loop). For UI around a real backend tool, see [Tool Call Rendering](/react-native/google-antigravity/generative-ui/tool-rendering).

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

Define your component's props as a `zod` schema. The schema becomes the tool's parameters, which tell the model which arguments to send. Add `zod` to your app if it isn't there yet (`npm install zod`).

```tsx title="src/BarChart.tsx"
import { Text, View } from "react-native";
import { z } from "zod";

export const barChartPropsSchema = z.object({
  title: z.string().describe("Chart title"),
  data: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
    }),
  ),
});

type BarChartProps = z.infer<typeof barChartPropsSchema>;

export function BarChart({ title, data }: BarChartProps) {
  // While the agent streams the call, props can be missing or partial.
  const rows = data ?? [];
  const max = Math.max(1, ...rows.map((row) => row.value ?? 0));

  return (
    <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#f4f4f8", gap: 6 }}>
      <Text style={{ fontWeight: "600" }}>{title ?? "Loading chart..."}</Text>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ width: 64 }}>{row.label}</Text>
          <View
            style={{
              height: 12,
              borderRadius: 6,
              backgroundColor: "#5057cc",
              width: `${((row.value ?? 0) / max) * 70}%`,
            }}
          />
        </View>
      ))}
    </View>
  );
}
```

Register it with `useComponent`, in any component under `CopilotKitProvider`:

```tsx title="src/ChatScreen.tsx"
import { useComponent } from "@copilotkit/react-native/headless";
import { CopilotChat } from "@copilotkit/react-native/components";
import { BarChart, barChartPropsSchema } from "./BarChart";

export function ChatScreen() {
  useComponent({ // [!code highlight:6]
    name: "render_bar_chart",
    description: "Show numeric data as a bar chart.",
    parameters: barChartPropsSchema,
    render: BarChart,
  });

  return <CopilotChat />;
}
```

`BarChart` is your own component. It reads only its props and knows nothing about CopilotKit. Any React Native charting library works here too.

<Callout type="warn">
  `parameters` is optional, but leaving it out advertises the tool with an empty parameter schema. The model then has nothing to fill in, so it calls the tool with no arguments and your component renders with no props. Pass a schema for any component that needs data.
</Callout>

<Callout type="info">
  The `name` you pass to `useComponent` is what the agent sees as the tool name. Make it a verb, like `render_bar_chart` or `show_weather`, so the model picks it when the user asks for that view. CopilotKit adds a line to the description that tells the model the tool displays a component.
</Callout>

To check it, ask the agent for a bar chart of quarterly sales. The chart renders in the chat with the data from the agent.

## React Native rules for the component [#react-native-rules-for-the-component]

- **Props stream in.** The component renders while the agent is still writing the arguments, so a field can be `undefined` or a list can be half full. Guard every prop, as `BarChart` does.
- **Wrap text in `Text`.** The chat draws your component inside a `FlatList`. A bare string, outside a `Text`, throws *Text strings must be rendered within a `<Text>` component*.
- **Bound long content.** For content whose length you can't predict, use a `ScrollView` with a `maxHeight`, so a long answer scrolls instead of pushing the chat off screen.

## Where the component renders [#where-the-component-renders]

The rendered `CopilotChat` and `CopilotModal` from `/components` draw registered components for you. The root `CopilotChat`, `CopilotPopup`, and `CopilotSidebar` do not draw messages, so no tool call shows there unless you render it. The component is registered and the agent calls it, but nothing appears.

In your own chat, call `useRenderToolCall()` and render each tool call in your list:

```tsx
import { useRenderToolCall } from "@copilotkit/react-native/headless";

const renderToolCall = useRenderToolCall();

// For each tool call on an assistant message:
renderToolCall({ toolCall, toolMessage });
```

`toolMessage` is the `tool`-role message whose `toolCallId` matches the call. It returns a React Native element, or `null` when nothing is registered for that tool. See [Headless UI](/react-native/google-antigravity/custom-look-and-feel/headless-ui) for a full list.

For every option, see the [`useComponent` reference](/reference/react-native/hooks/useComponent).

<IntegrationGrid path="generative-ui/tool-based" />
