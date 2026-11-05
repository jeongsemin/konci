// Deletes receipt photos that never led to a review once they are 30 days old.
//
//   node --env-file=.env.local scripts/purge-receipts.ts --dry-run   # only count
//   node --env-file=.env.local scripts/purge-receipts.ts              # delete
//
// Receipts waiting for an administrator are never touched. Run it on a schedule once deployed.
import { createClient } from "@supabase/supabase-js";
import { purgeExpiredReceipts } from "../src/lib/receipt-purge.ts";
import { UNUSED_RECEIPT_DAYS } from "../src/lib/receipt-retention.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local).");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { found, deleted } = await purgeExpiredReceipts(client, { dryRun });
console.log(
  dryRun
    ? `${found} receipt(s) older than ${UNUSED_RECEIPT_DAYS} days have no review and would be deleted.`
    : `Deleted ${deleted} receipt(s) older than ${UNUSED_RECEIPT_DAYS} days that had no review.`,
);
