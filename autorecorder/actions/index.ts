/**
 * Which handler serves which page id. The demo page is the device mirror; every handler drives
 * the Android app through adb (android.actions.ts). Pages not listed use runAndroidStandard.
 */
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { type Page } from 'playwright';
import { runAndroidStandard } from './android.actions';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  if (config.docOnly) return; // overview page: nothing on the device
  const handler = ACTION_MAP[config.id] ?? runAndroidStandard;
  await handler(page, config, rootPath, ctx);
}
