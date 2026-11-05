// How long receipt photos are kept. Pure so it can be unit tested.

/** A receipt that never led to a review is deleted after this many days. */
export const UNUSED_RECEIPT_DAYS = 30;

export type RetentionCandidate = {
  status: string;
  created_at: string;
  /** Whether a review is based on this receipt. */
  hasReview: boolean;
};

/**
 * True when the receipt photo should be deleted now: no review uses it and it is old enough.
 * Receipts still waiting for an administrator are left alone (the member is waiting for an answer).
 */
export function isUnusedExpired(r: RetentionCandidate, now: Date, days = UNUSED_RECEIPT_DAYS): boolean {
  if (r.hasReview || r.status === "pending") return false;
  const created = Date.parse(r.created_at);
  if (Number.isNaN(created)) return false;
  return now.getTime() - created >= days * 86_400_000;
}

/** A deleted receipt's photo may be uploaded again only by the member it belonged to. */
export function canReuseHash(rememberedFor: string | null, member: string): boolean {
  return rememberedFor !== null && rememberedFor === member;
}
