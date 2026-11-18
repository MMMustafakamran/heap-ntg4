// HARNESS: page id -> the page's root component. Owned by the main session: builder agents
// report their entry here, they don't edit this file.
import type { ComponentType } from "react";
import QuickstartApp from "../App";

export const PAGES: Record<string, ComponentType> = {
  quickstart: QuickstartApp,
};
