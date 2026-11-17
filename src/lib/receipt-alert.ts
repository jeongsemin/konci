// Receipt emails, sent through Resend (https://resend.com). Nothing is sent without RESEND_API_KEY.
//   - To the administrators (ALERT_EMAIL_TO): a receipt is waiting. At most one mail an hour: a new receipt
//     sends one only when no other receipt has waited since an hour ago. Names the clinic and the queue size, never the member.
//   - To the member: the receipt was approved or rejected. Only sent once ALERT_EMAIL_FROM is set, because
//     Resend's default sender (onboarding@resend.dev) can only mail the address the Resend account signed up with;
//     verify the domain in Resend first. The member's language isn't stored, so the mail is in all four languages
//     and its link goes through the site's language redirect.
// Sending never throws, so an upload or a decision is never blocked by mail.

export const ALERT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_FROM = "KONCI <onboarding@resend.dev>";
const SEND_TIMEOUT_MS = 8000;

type Env = Record<string, string | undefined>;

export function alertConfigured(env: Env = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.ALERT_EMAIL_TO?.trim());
}

export function memberMailConfigured(env: Env = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.ALERT_EMAIL_FROM?.trim());
}

/** Whether this upload should send a mail: only the first receipt waiting within the last hour does. */
export function shouldAlert(otherRecentPending: number): boolean {
  return otherRecentPending === 0;
}

export function recipients(to: string | undefined): string[] {
  return (to ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

const oneLine = (s: string, max: number) => s.replace(/[\r\n]+/g, " ").trim().slice(0, max);
const origin = (siteUrl: string) => siteUrl.replace(/\/+$/, "");

export type ReceiptAlert = { hospitalName: string; pending: number; siteUrl: string; now?: Date };

export function buildReceiptAlert({ hospitalName, pending, siteUrl, now = new Date() }: ReceiptAlert): { subject: string; text: string } {
  const when = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }).format(now);
  return {
    subject: `[KONCI] 확인할 영수증 ${pending}건`,
    text: [
      `새 영수증이 올라왔어요. (${when})`,
      "",
      `병원: ${oneLine(hospitalName, 100)}`,
      `확인 대기: ${pending}건`,
      "",
      `확인하기: ${origin(siteUrl)}/ko/admin`,
      "",
      "이용자에게는 보통 1~2일 안에 확인한다고 안내하고 있어요.",
      "이 알림은 한 시간에 한 번까지만 보내요. 그사이 올라온 영수증은 대기 건수에 포함됩니다.",
    ].join("\n"),
  };
}

export type DecisionMail = {
  decision: "approved" | "rejected";
  hospitalId: string;
  hospitalName: string;
  hospitalNameEn?: string | null;
  reason?: string | null;
  siteUrl: string;
};

export function buildDecisionMail({ decision, hospitalId, hospitalName, hospitalNameEn, reason, siteUrl }: DecisionMail): { subject: string; text: string } {
  const ko = oneLine(hospitalName, 100);
  const en = hospitalNameEn ? oneLine(hospitalNameEn, 100) : ko;
  const why = reason ? oneLine(reason, 200) : "";
  const link = decision === "approved" ? `${origin(siteUrl)}/hospitals/${hospitalId}/review` : `${origin(siteUrl)}/my`;
  const ok = decision === "approved";
  const blocks = ok
    ? [
        [`Your receipt for ${en} was approved. You can now write your review.`],
        [`${ko} 영수증이 승인되었어요. 이제 후기를 작성할 수 있어요.`],
        [`${ko} の領収書が承認されました。口コミを書けます。`],
        [`${ko} 的收据已通过审核，现在可以撰写评价了。`],
      ]
    : [
        [`Your receipt for ${en} could not be approved.`, why && `Reason: ${why}`, "You can upload a clearer photo of the receipt again."],
        [`${ko} 영수증이 반려되었어요.`, why && `사유: ${why}`, "영수증을 더 선명하게 찍어 다시 올릴 수 있어요."],
        [`${ko} の領収書は承認されませんでした。`, why && `理由：${why}`, "より鮮明な写真で再度アップロードできます。"],
        [`${ko} 的收据未通过审核。`, why && `原因：${why}`, "您可以重新上传更清晰的收据照片。"],
      ];
  return {
    subject: ok ? "[KONCI] Receipt approved · 영수증 승인 · 領収書承認 · 收据已通过" : "[KONCI] Receipt not approved · 영수증 반려 · 領収書却下 · 收据未通过",
    text: [
      ...blocks.map((lines) => lines.filter(Boolean).join("\n")),
      `${ok ? "Write your review" : "My page"}: ${link}`,
      "KONCI",
    ].join("\n\n"),
  };
}

async function send(to: string[], subject: string, text: string, label: string): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || !to.length) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.ALERT_EMAIL_FROM?.trim() || DEFAULT_FROM, to, subject, text }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) console.error(`${label} mail failed:`, res.status);
  } catch (e) {
    console.error(`${label} mail failed:`, e);
  }
}

export async function sendReceiptAlert(alert: ReceiptAlert): Promise<void> {
  const { subject, text } = buildReceiptAlert(alert);
  await send(recipients(process.env.ALERT_EMAIL_TO), subject, text, "receipt alert");
}

export async function sendDecisionMail(to: string, mail: DecisionMail): Promise<void> {
  if (!memberMailConfigured()) return;
  const { subject, text } = buildDecisionMail(mail);
  await send([to], subject, text, "receipt decision");
}
