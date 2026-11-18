// HARNESS: page id -> the page's root component. Owned by the main session: builder agents
// report their entry here, they don't edit this file.
import type { ComponentType } from "react";
import QuickstartApp from "../App";
import AgentReadonlyPage from "./agent-readonly/App";
import FrontendToolsPage from "./frontend-tools/App";
import GovernedActionsPage from "./governed-actions/App";
import HeadlessUiPage from "./headless-ui/App";
import HitlHeadlessPage from "./hitl-headless/App";
import HitlPage from "./hitl/App";
import InspectorPage from "./inspector/App";
import MarkdownPage from "./markdown/App";
import MultimodalAttachmentsPage from "./multimodal-attachments/App";
import PrebuiltComponentsPage from "./prebuilt-components/App";
import SharedStateRenderingPage from "./shared-state-rendering/App";
import SharedStatePage from "./shared-state/App";
import SubagentsPage from "./subagents/App";
import ToolBasedPage from "./tool-based/App";
import ToolRenderingPage from "./tool-rendering/App";
import UseInterruptPage from "./use-interrupt/App";
import WebmcpPage from "./webmcp/App";

export const PAGES: Record<string, ComponentType> = {
  quickstart: QuickstartApp,
  "agent-readonly": AgentReadonlyPage,
  "frontend-tools": FrontendToolsPage,
  "governed-actions": GovernedActionsPage,
  "headless-ui": HeadlessUiPage,
  "hitl-headless": HitlHeadlessPage,
  "hitl": HitlPage,
  "inspector": InspectorPage,
  "markdown": MarkdownPage,
  "multimodal-attachments": MultimodalAttachmentsPage,
  "prebuilt-components": PrebuiltComponentsPage,
  "shared-state-rendering": SharedStateRenderingPage,
  "shared-state": SharedStatePage,
  "subagents": SubagentsPage,
  "tool-based": ToolBasedPage,
  "tool-rendering": ToolRenderingPage,
  "use-interrupt": UseInterruptPage,
  "webmcp": WebmcpPage,
};
