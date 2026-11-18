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
