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
