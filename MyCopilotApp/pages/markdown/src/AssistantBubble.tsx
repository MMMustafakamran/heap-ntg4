// Doc: "In your own chat", src/AssistantBubble.tsx, verbatim.
import { View } from "react-native";
import {
  CopilotMarkdown,
  defaultMarkdownStyles,
} from "@copilotkit/react-native/components";

const markdownStyle = {
  paragraph: { ...defaultMarkdownStyles.paragraph, fontSize: 15, lineHeight: 22 },
  link: { ...defaultMarkdownStyles.link, color: "#5057cc" },
};

export function AssistantBubble({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: "#f1f1f4", borderRadius: 16, padding: 12, maxWidth: "80%" }}>
      <CopilotMarkdown content={text} style={markdownStyle} />
    </View>
  );
}
