// Verbatim from the WebMCP page ("WebMCP only, with no agent", webmcp.ts).
// The page also says: "React Native does not expose `document.modelContext`, so WebMCP registration is a no-op there."
// Note: `searchOrders` is never defined on the page (left undefined as published).
import { CopilotKitCore } from "@copilotkit/core";
import { z } from "zod";

export const copilotkit = new CopilotKitCore({
  tools: [
    {
      name: "searchOrders",
      description: "Search the signed-in user's orders by status",
      parameters: z.object({
        status: z.enum(["open", "shipped", "delivered"]),
      }),
      handler: async ({ status }) => {
        const orders = await searchOrders(status);
        return JSON.stringify(orders);
      },
      webmcp: {
        annotations: {
          readOnlyHint: true,
        },
      },
    },
  ],
});
