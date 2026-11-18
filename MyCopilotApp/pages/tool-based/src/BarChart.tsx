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
