// HARNESS: page id -> that page's CopilotRuntime (pages/<id>/runtime.ts). Owned by the main session.
import type { CopilotRuntime } from "@copilotkit/runtime/v2";

export const RUNTIMES: Record<string, CopilotRuntime> = {};
