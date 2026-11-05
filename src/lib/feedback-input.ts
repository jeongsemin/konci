export const FEEDBACK_CATEGORIES = ["bug", "inconvenience", "idea", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = ["open", "reviewing", "done", "declined"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const TITLE_MAX = 80;
export const BODY_MAX = 1000;
export const REPLY_MAX = 1000;
export const DAILY_POST_LIMIT = 5;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isFeedbackCategory = (v: unknown): v is FeedbackCategory => (FEEDBACK_CATEGORIES as readonly unknown[]).includes(v);
export const isFeedbackStatus = (v: unknown): v is FeedbackStatus => (FEEDBACK_STATUSES as readonly unknown[]).includes(v);
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** Counts by code point so emoji and Korean/Japanese/Chinese text are measured like the form shows them. */
const charCount = (s: string) => [...s].length;

export type FeedbackInput = { category: FeedbackCategory; title: string; body: string };

/** Reads the write form. Both fields are required; text over the limit is rejected, not cut. */
export function parseFeedbackInput(get: (key: string) => string | null): FeedbackInput | null {
  const category = get("category");
  if (!isFeedbackCategory(category)) return null;
  const title = (get("title") ?? "").replace(/\s+/g, " ").trim();
  // Keep the line breaks of the body, but collapse runs of blank lines and trailing spaces.
  const body = (get("body") ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (title === "" || body === "") return null;
  if (charCount(title) > TITLE_MAX || charCount(body) > BODY_MAX) return null;
  return { category, title, body };
}

export type ReplyInput = { postId: string; status: FeedbackStatus; reply: string | null };

/** Reads the administrator's form: a status, and an optional answer (empty clears it). */
export function parseReplyInput(get: (key: string) => string | null): ReplyInput | null {
  const postId = get("postId");
  const status = get("status");
  if (!isUuid(postId) || !isFeedbackStatus(status)) return null;
  const reply = (get("reply") ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (charCount(reply) > REPLY_MAX) return null;
  return { postId, status, reply: reply || null };
}
