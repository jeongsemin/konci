// Tells the administrators by email that a receipt is waiting for approval.
// Mail goes through Resend (https://resend.com) and is on only when RESEND_API_KEY and ALERT_EMAIL_TO are set.
//   - Resend's default sender (onboarding@resend.dev) can only mail the address the Resend account signed up with.
//     To mail anyone else, verify a domain in Resend and set ALERT_EMAIL_FROM.
// At most one mail an hour: a new receipt sends one only when no other receipt has waited since an hour ago.
// The mail names the clinic and the queue size, never the member. It never throws, so an upload is never blocked.

export const ALERT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_FROM = "KONCI <onboarding@resend.dev>";
const SEND_TIMEOUT_MS = 8000;

export function alertConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.ALERT_EMAIL_TO?.trim());
}

/** Whether this upload should send a mail: only the first receipt waiting within the last hour does. */
export function shouldAlert(otherRecentPending: number): boolean {
  return otherRecentPending === 0;
}

export function recipients(to: string | undefined): string[] {
  return (to ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export type ReceiptAlert = { hospitalName: string; pending: number; siteUrl: string; now?: Date };

export function buildReceiptAlert({ hospitalName, pending, siteUrl, now = new Date() }: ReceiptAlert): { subject: string; text: string } {
  const when = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }).format(now);
  const clinic = hospitalName.replace(/[\r\n]+/g, " ").slice(0, 100);
  const queue = `${siteUrl.replace(/\/+$/, "")}/ko/admin`;
  return {
    subject: `[KONCI] 확인할 영수증 ${pending}건`,
    text: [
      `새 영수증이 올라왔어요. (${when})`,
      "",
      `병원: ${clinic}`,
      `확인 대기: ${pending}건`,
      "",
      `확인하기: ${queue}`,
      "",
      "이용자에게는 보통 1~2일 안에 확인한다고 안내하고 있어요.",
      "이 알림은 한 시간에 한 번까지만 보내요. 그사이 올라온 영수증은 대기 건수에 포함됩니다.",
    ].join("\n"),
  };
}

export async function sendReceiptAlert(alert: ReceiptAlert): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const to = recipients(process.env.ALERT_EMAIL_TO);
  if (!key || !to.length) return;
  const { subject, text } = buildReceiptAlert(alert);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.ALERT_EMAIL_FROM?.trim() || DEFAULT_FROM, to, subject, text }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) console.error("receipt alert mail failed:", res.status);
  } catch (e) {
    console.error("receipt alert mail failed:", e);
  }
}
