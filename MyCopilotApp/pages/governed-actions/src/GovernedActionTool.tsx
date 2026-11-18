import { ToolCallStatus, useHumanInTheLoop } from "@copilotkit/react-native/headless";
import { z } from "zod";
import { GovernedActionCard } from "./GovernedActionCard";

const governedActionSchema = z.object({
  id: z.string(),
  summary: z.string(),
  tool: z.string(),
  reference: z.string(),
  verdict: z.enum(["allow", "deny", "require_approval"]),
  arguments: z.record(z.unknown()),
});

export function useGovernedActionTool() {
  useHumanInTheLoop({
    name: "approve_governed_action",
    description: "Ask the user to approve a governed side-effect action before it runs.",
    parameters: governedActionSchema,
    render: ({ args, status, respond }) => {
      if (status !== ToolCallStatus.Executing || !respond) {
        return null;
      }

      const answer = (approved: boolean) =>
        respond({ approved, actionId: args.id, reference: args.reference });

      return (
        <GovernedActionCard
          action={args}
          onApprove={() => answer(true)}
          onReject={() => answer(false)}
          onBlock={() => answer(false)}
        />
      );
    },
  });
}
