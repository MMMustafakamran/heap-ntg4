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
