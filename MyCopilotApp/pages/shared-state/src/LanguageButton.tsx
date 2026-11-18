// HARNESS: the doc's third snippet (setState + addMessage + runAgent) is a bare fragment: no component,
// `state` and `agent` come from nowhere, `newLanguage` is never defined, and `await` sits outside any
// async function. Wrapped in a component with a fixed newLanguage so it can be tapped. Doc lines verbatim.
import { Button } from "react-native";
import { useAgent, useCopilotKit } from "@copilotkit/react-native/headless";

export function LanguageButton() {
  const { agent } = useAgent({ agentId: "default" }); // HARNESS: `agent` is undefined in the snippet
  const state = (agent.state ?? {}) as Record<string, unknown>; // HARNESS: `state` is undefined in the snippet
  const newLanguage = "French"; // HARNESS: `newLanguage` is never defined on the page
  // --- Doc (verbatim) ---
  const { copilotkit } = useCopilotKit();
  // --- end doc line ---
  const onPress = async () => { // HARNESS: the snippet's `await` needs an async function
    // --- Doc (verbatim) ---
    agent.setState({ ...state, language: newLanguage });
    agent.addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: `The language has been updated to ${newLanguage}.`,
    });
    await copilotkit.runAgent({ agent });
    // --- end doc ---
  };
  return <Button title="Switch language to French" onPress={onPress} />; // HARNESS
}
