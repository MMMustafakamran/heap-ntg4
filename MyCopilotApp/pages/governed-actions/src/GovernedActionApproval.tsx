import { Text } from "react-native";
import { useInterrupt } from "@copilotkit/react-native/headless";
import { GovernedActionCard, type GovernedAction } from "./GovernedActionCard";

// A custom-event interrupt can send its value as a JSON string.
function parseInterruptValue(value: unknown): { action?: unknown } | undefined {
  if (typeof value !== "string") return value as { action?: unknown } | undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function useGovernedActionApproval(agentId: string) {
  useInterrupt({
    agentId, // the same agent as your chat
    render: ({ event, interrupt, resolve, cancel }) => {
      const action = (interrupt?.metadata?.action ??
        parseInterruptValue(event.value)?.action) as GovernedAction | undefined;

      if (!action) {
        return <Text>The agent is waiting for an approval it didn't describe.</Text>;
      }

      return (
        <GovernedActionCard
          action={action}
          onApprove={() =>
            resolve({ approved: true, actionId: action.id, reference: action.reference })
          }
          onReject={() =>
            resolve({ approved: false, actionId: action.id, reference: action.reference })
          }
          onBlock={() => cancel()}
        />
      );
    },
  });
}
