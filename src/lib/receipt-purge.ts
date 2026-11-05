// Deleting receipt photos and rows. Takes a service-role client so both the app and the cleanup
// script can use it (no `server-only` import here).
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUnusedExpired, UNUSED_RECEIPT_DAYS } from "./receipt-retention.ts";

/** Removes files from a private bucket. Files that are already gone are not an error. */
export async function removeStored(client: SupabaseClient, bucket: string, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await client.storage.from(bucket).remove(paths);
  if (error) throw new Error(`could not remove files from ${bucket}`);
}

/**
 * Deletes receipts: the photos first, then the rows (a database trigger keeps the photo's hash so it
 * can't back a second review). If the photos can't be removed the rows stay, so nothing is orphaned.
 * A review based on a deleted receipt goes with it.
 */
export async function purgeReceipts(client: SupabaseClient, receipts: { id: string; storage_path: string }[]) {
  if (receipts.length === 0) return 0;
  await removeStored(client, "receipts", receipts.map((r) => r.storage_path));
  const { error } = await client.from("receipts").delete().in("id", receipts.map((r) => r.id));
  if (error) throw new Error("could not delete receipt rows");
  return receipts.length;
}

/**
 * After an account is deleted, cuts the link between it and the hashes of receipts deleted earlier,
 * so the remembered hashes no longer point at anyone (the photos stay unusable for everyone).
 */
export async function forgetMember(client: SupabaseClient, userId: string) {
  const { error } = await client.from("used_receipt_hashes").update({ user_id: null }).eq("user_id", userId);
  if (error) throw new Error("could not clear remembered receipts");
}

const BATCH = 200;

/** Deletes receipts that no review uses once they are older than the retention period. */
export async function purgeExpiredReceipts(
  client: SupabaseClient,
  opts: { now?: Date; days?: number; dryRun?: boolean } = {},
) {
  const now = opts.now ?? new Date();
  const days = opts.days ?? UNUSED_RECEIPT_DAYS;
  const cutoff = new Date(now.getTime() - days * 86_400_000).toISOString();
  let deleted = 0;
  let found = 0;
  let from = 0;

  for (;;) {
    const { data: rows, error } = await client
      .from("receipts")
      .select("id, storage_path, status, created_at")
      .lt("created_at", cutoff)
      .neq("status", "pending")
      .order("created_at")
      .range(from, from + BATCH - 1);
    if (error) throw new Error("could not list receipts");
    if (!rows || rows.length === 0) break;

    const { data: used, error: usedError } = await client
      .from("reviews")
      .select("receipt_id")
      .in("receipt_id", rows.map((r) => r.id));
    if (usedError) throw new Error("could not list reviews");
    const usedIds = new Set((used ?? []).map((u) => u.receipt_id));

    const expired = rows.filter((r) => isUnusedExpired({ status: r.status, created_at: r.created_at, hasReview: usedIds.has(r.id) }, now, days));
    found += expired.length;
    if (!opts.dryRun) deleted += await purgeReceipts(client, expired);
    // Rows that were kept stay in the list, so move the window past them; deleted rows leave it.
    from += rows.length - (opts.dryRun ? 0 : expired.length);
    if (rows.length < BATCH) break;
  }
  return { found, deleted };
}
