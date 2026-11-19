import "server-only";
import { after } from "next/server";
import { ALERT_WINDOW_MS, QUEUES, alertConfigured, sendQueueAlert, shouldAlert, type AlertDetails, type QueueKind } from "./receipt-alert";
import { siteUrl } from "./seo";
import { createAdminClient } from "./supabase/admin";
import ko from "../i18n/dictionaries/ko.json";

/** Korean names for the coded values in the mails (the administrators read Korean). */
const label = (names: Record<string, string>, code: string) => (Object.hasOwn(names, code) ? names[code] : code);
export const koEditField = (code: string) => label(ko.edit.fields, code);
export const koReportReason = (code: string) => label(ko.reviewDetail.report.reasons, code);
export const koFeedbackCategory = (code: string) => label(ko.feedback.categories, code);

/**
 * Tells the administrators by email that something new waits for them. Call it right after the item is saved,
 * during the request: the check and the mail run after the response, so the member is never kept waiting.
 */
export function notifyAdmins(kind: QueueKind, details: AlertDetails): void {
  if (!alertConfigured()) return;
  after(async () => {
    const q = QUEUES[kind];
    const admin = createAdminClient();
    const hourAgo = new Date(Date.now() - ALERT_WINDOW_MS).toISOString();
    const [{ count: recent }, { count: pending }] = await Promise.all([
      admin.from(q.table).select("id", { count: "exact", head: true }).eq("status", q.status).gte("created_at", hourAgo),
      admin.from(q.table).select("id", { count: "exact", head: true }).eq("status", q.status),
    ]);
    if (recent === null || !shouldAlert(recent)) return;
    await sendQueueAlert({ kind, details, pending: pending ?? 1, siteUrl: siteUrl() });
  });
}
