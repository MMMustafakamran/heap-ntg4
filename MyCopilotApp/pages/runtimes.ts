// HARNESS: page id -> that page's CopilotRuntime (pages/<id>/runtime.ts). Owned by the main session.
import type { CopilotRuntime } from "@copilotkit/runtime/v2";
import AgentReadonlyRuntime from "./agent-readonly/runtime";
import FrontendToolsRuntime from "./frontend-tools/runtime";
import GovernedActionsRuntime from "./governed-actions/runtime";
import HeadlessUiRuntime from "./headless-ui/runtime";
import HitlHeadlessRuntime from "./hitl-headless/runtime";
import HitlRuntime from "./hitl/runtime";
import InspectorRuntime from "./inspector/runtime";
import MarkdownRuntime from "./markdown/runtime";
import MultimodalAttachmentsRuntime from "./multimodal-attachments/runtime";
import PrebuiltComponentsRuntime from "./prebuilt-components/runtime";
import SharedStateRenderingRuntime from "./shared-state-rendering/runtime";
import SharedStateRuntime from "./shared-state/runtime";
import SubagentsRuntime from "./subagents/runtime";
import ToolBasedRuntime from "./tool-based/runtime";
import ToolRenderingRuntime from "./tool-rendering/runtime";
import UseInterruptRuntime from "./use-interrupt/runtime";
import WebmcpRuntime from "./webmcp/runtime";

export const RUNTIMES: Record<string, CopilotRuntime> = {
  "agent-readonly": AgentReadonlyRuntime,
  "frontend-tools": FrontendToolsRuntime,
  "governed-actions": GovernedActionsRuntime,
  "headless-ui": HeadlessUiRuntime,
  "hitl-headless": HitlHeadlessRuntime,
  "hitl": HitlRuntime,
  "inspector": InspectorRuntime,
  "markdown": MarkdownRuntime,
  "multimodal-attachments": MultimodalAttachmentsRuntime,
  "prebuilt-components": PrebuiltComponentsRuntime,
  "shared-state-rendering": SharedStateRenderingRuntime,
  "shared-state": SharedStateRuntime,
  "subagents": SubagentsRuntime,
  "tool-based": ToolBasedRuntime,
  "tool-rendering": ToolRenderingRuntime,
  "use-interrupt": UseInterruptRuntime,
  "webmcp": WebmcpRuntime,
};
