# Tool Call Rendering

> Render your agent's tool calls with your own React Native components.

## What is this? [#what-is-this]

Tools are how an LLM invokes predefined, typically deterministic functions. Tool rendering lets you decide how each of those tool calls appears in the chat. You register a React Native component that draws a card for the call: its arguments, a live status, and the result once it arrives. This is the **generative UI** variant CopilotKit calls **tool rendering**.

## When should I use this? [#when-should-i-use-this]

Render tool calls when you want to:

- Show users which tools the agent is calling, and with what arguments
- Display live progress while a tool runs
- Render rich results once a tool completes
- Give tool-heavy agents a clear, on-brand chat

## Default rendering on React Native [#default-rendering-on-react-native]

The React package has `useDefaultRenderTool`, which draws a built-in status card for every tool call. Its card uses web elements, so `@copilotkit/react-native` does not export it.

Without a renderer, the rendered `CopilotChat` from `/components` shows a short "Called: tool_name" line for each call. A chat you build yourself shows nothing, unless you render a fallback. To draw every call your way, register a catch-all.

## Custom catch-all [#custom-catch-all]

`useRenderTool` with `name: "*"` registers one renderer for every tool call that has no renderer of its own:

```tsx title="src/ToolCallCard.tsx"
import { ActivityIndicator, Text, View } from "react-native";
import { useRenderTool } from "@copilotkit/react-native/headless";

export function useToolCallCards() {
  useRenderTool( // [!code highlight:14]
    {
      name: "*",
      render: ({ name, status, result }) => (
        <View style={{ padding: 10, borderRadius: 10, backgroundColor: "#f4f4f8", gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {status === "complete" ? <Text>✓</Text> : <ActivityIndicator size="small" />}
            <Text style={{ fontWeight: "600" }}>{name}</Text>
          </View>
          {status === "complete" ? <Text numberOfLines={3}>{result}</Text> : null}
        </View>
      ),
    },
    [],
  );
}
```

Call `useToolCallCards()` once, in a component under `CopilotKitProvider`. Every tool call without a named renderer now draws this card.

## Per-tool renderers [#per-tool-renderers]

The most expressive path is one renderer per tool name. Each renderer receives the tool's parsed `parameters`, a live `status`, and, once the agent returns, the `result`. The renderer must return a React Native element or `null`.

```tsx title="src/WeatherCard.tsx"
import { Text, View } from "react-native";
import { useRenderTool } from "@copilotkit/react-native/headless";
import { z } from "zod";

export function useWeatherCard() {
  useRenderTool(
    {
      name: "get_weather", // must match the tool name the agent exposes
      parameters: z.object({ location: z.string() }),
      render: ({ parameters, status, result }) => {
        if (status !== "complete") {
          return <Text>Checking the weather in {parameters.location ?? "..."}</Text>;
        }
        const weather = parseWeather(result);
        return (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#eef4ff" }}>
            <Text style={{ fontWeight: "600" }}>{parameters.location}</Text>
            <Text>{weather ? `${weather.temperature}°` : result}</Text>
          </View>
        );
      },
    },
    [],
  );
}

// The result arrives as a string. Parse it when your tool returns JSON.
function parseWeather(result: string): { temperature: number } | null {
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}
```

Named renderers and a catch-all work together: the named one claims its tool, and the `"*"` renderer handles every other call.

<Callout type="info">
  The `name` you pass to `useRenderTool` must match the tool name the agent exposes. That is how the chat matches the call to your component.
</Callout>

### Tool inputs and results are separate [#tool-inputs-and-results-are-separate]

In `useRenderTool`, `parameters` holds the **inputs** the agent sent to the tool. It does not turn into the tool's return value when `status` becomes `"complete"`. The output arrives separately as `result`, a string. For a tool that returns JSON, parse that string before you read its fields.

While the arguments stream, `status` is `"inProgress"` and `parameters` can be partial. Read required fields after the status moves to `"executing"` or `"complete"`.

### Your own tool or someone else's [#your-own-tool-or-someone-elses]

`useRenderTool` registers a renderer only. It takes no `description` and no `handler`, so the model never sees it as a tool. Use it for a tool that runs on your agent's backend, or as the `"*"` fallback. For a tool your app owns and runs on the device, pass `render` to [`useFrontendTool`](/react-native/google-antigravity/frontend-tools) instead. Both write to the same renderer registry. If your code passes `description` or `handler` to `useRenderTool`, see [Migrating from the old React Native `useRenderTool`](/reference/react-native/hooks/useRenderTool#migrating-from-the-old-react-native-userendertool).

## Where the cards render [#where-the-cards-render]

The rendered `CopilotChat` and `CopilotModal` from `/components` draw tool calls with your renderers. In your own chat, `useRenderToolCall()` returns a function that renders one tool call. It returns `ReactElement | null`, which is what a `FlatList` `renderItem` needs. See [Headless UI](/react-native/google-antigravity/custom-look-and-feel/headless-ui).

## The backend tool definition [#the-backend-tool-definition]

The frontend renderer only sees what the agent sends. The matching backend must expose a tool named `get_weather` and return structured data. The renderer with the same name then draws the card. The React Native renderer does not create or run that backend tool.

<Steps>
  <Step>
    ### Pass the backend tools to the agent

    Backend tools are plain Python functions. Pass them as `tools=[...]` and the
    adapter derives each schema from the signature and docstring, registers it
    with Antigravity, and runs the call in this process when the model asks for
    it. Every call streams to the browser as `TOOL_CALL_START`, `TOOL_CALL_ARGS`
    and `TOOL_CALL_END`, then `TOOL_CALL_RESULT` with the returned value, so a
    frontend renderer registered under the same name paints the card.

~~~~python title="tool_rendering.py"
TOOLS = [get_weather, search_flights, get_stock_price, roll_d20]


def tool_rendering_agent():
    return build(system_instructions=SYSTEM_PROMPT, tools=TOOLS)


~~~~

  </Step>
</Steps>

<Callout type="info" title="Arguments arrive in one piece">
  The Antigravity harness hands the adapter each tool call with its arguments
  complete, so `TOOL_CALL_ARGS` carries them in a single event rather than
  token by token. A renderer still sees the `inProgress` → `executing` →
  `complete` statuses, but the arguments are whole from the first render.
</Callout>

```python title="src/agents/tool_rendering.py"
def get_weather(location: str) -> dict:
    """Get the current weather for a given location."""
    return {
        "city": location,
        "temperature": 68,
        "humidity": 55,
        "wind_speed": 10,
        "conditions": "Sunny",
    }

```

To check it, ask the agent for the weather in San Francisco. Your card renders with the temperature from `result`.

For every option, see the [`useRenderTool` reference](/reference/react-native/hooks/useRenderTool).

<IntegrationGrid path="generative-ui/tool-rendering" />
