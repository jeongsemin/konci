// Imports hospitals from the HIRA (건강보험심사평가원) open APIs into `hospitals`.
//
//   node --env-file=.env.local scripts/import-hira.ts --scope derm            # 피부과 listed institutions
//   node --env-file=.env.local scripts/import-hira.ts --scope all             # 상급종합·종합병원·병원·의원 (derm flags first)
//   node --env-file=.env.local scripts/import-hira.ts --scope derm --dry-run  # fetch and map only, no database writes
//   node --env-file=.env.local scripts/import-hira.ts --details --limit 3000  # 피부과 specialist counts (1 call each)
//
// Safe to re-run: rows are upserted by HIRA id and nothing is ever deleted.
import { createClient } from "@supabase/supabase-js";
import {
  DERM_CODE,
  MEDICAL_TYPES,
  HIRA_DEPT_URL,
  HIRA_LIST_URL,
  HiraError,
  buildUrl,
  dermSpecialists,
  parseResponse,
  toRow,
  type HiraItem,
  type HiraRow,
} from "../src/lib/hira.ts";

const PAGE_SIZE = 1000;
const UPSERT_BATCH = 500;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const need = (name: string) => {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name} (run with --env-file=.env.local).`);
    process.exit(1);
  }
  return v;
};

const listKey = need("HIRA_SERVICE_KEY");
const detailKey = process.env.HIRA_DETAIL_SERVICE_KEY || listKey;

async function hira<T>(base: string, key: string, params: Record<string, string | number>) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(buildUrl(base, key, params), { signal: AbortSignal.timeout(30_000) });
      const body = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(body);
      } catch {
        // Gateway errors (quota, bad key) come back as XML or plain text.
        throw new HiraError(`HTTP ${res.status}: ${body.replace(/\s+/g, " ").slice(0, 200)}`);
      }
      return parseResponse<T>(json);
    } catch (e) {
      lastError = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastError;
}

/** Pages through the list API. `dgsbjtCd` narrows it to one department. */
async function fetchList(extra: Record<string, string>) {
  const rows = new Map<string, HiraRow>();
  let fetched = 0;
  let skipped = 0;
  for (let page = 1; ; page++) {
    const { items, totalCount } = await hira<HiraItem>(HIRA_LIST_URL, listKey, { pageNo: page, numOfRows: PAGE_SIZE, ...extra });
    for (const item of items) {
      const row = toRow(item);
      if (row) rows.set(row.external_id, row);
      else skipped++;
    }
    fetched += items.length;
    console.log(`  page ${page}: ${fetched}/${totalCount}`);
    if (items.length === 0 || page * PAGE_SIZE >= totalCount) {
      if (fetched !== totalCount) console.warn(`  note: fetched ${fetched} but the API reports ${totalCount}`);
      return { rows: [...rows.values()], fetched, skipped, totalCount };
    }
  }
}

const dryRun = flag("dry-run");
const supabase = dryRun
  ? null
  : createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

async function save(rows: (HiraRow & { derm_listed?: boolean })[], syncedAt: string) {
  if (!supabase) return;
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH).map((r) => ({ ...r, synced_at: syncedAt }));
    const { error } = await supabase.from("hospitals").upsert(batch, { onConflict: "external_id" });
    if (error) throw new Error(`Database write failed: ${error.message}`);
  }
}

async function importList(scope: "derm" | "all") {
  const syncedAt = new Date().toISOString();
  const sido = option("sido");
  const extra: Record<string, string> = sido ? { sidoCd: sido } : {};

  console.log(`[1/${scope === "all" ? 2 : 1}] 피부과 (dgsbjtCd=${DERM_CODE})`);
  const derm = await fetchList({ ...extra, dgsbjtCd: DERM_CODE });
  console.log(`  -> ${derm.rows.length} institutions (${derm.skipped} skipped)`);
  if (dryRun) console.log("  sample:", JSON.stringify(derm.rows.slice(0, 2), null, 1));
  await save(derm.rows.map((r) => ({ ...r, derm_listed: true })), syncedAt);

  if (scope === "all") {
    // No derm_listed here, so the flags set above are left as they are.
    console.log(`[2/2] 병원·의원 (clCd ${MEDICAL_TYPES.join(", ")})`);
    for (const clCd of MEDICAL_TYPES) {
      console.log(` clCd=${clCd}`);
      const all = await fetchList({ ...extra, clCd });
      console.log(`  -> ${all.rows.length} institutions (${all.skipped} skipped)`);
      await save(all.rows, syncedAt);
    }
  }
  console.log(dryRun ? "Dry run: nothing was written." : "Done.");
}

async function importDetails(limit: number) {
  if (!supabase) throw new Error("--details cannot be combined with --dry-run");
  // Names that already say 피부 first: they are the ones people will search for.
  const pick = async (nameMatch: boolean, n: number): Promise<string[]> => {
    const base = supabase.from("hospitals").select("hira_id").eq("derm_listed", true).is("detail_synced_at", null);
    const { data, error } = await (nameMatch ? base.ilike("name", "%피부%") : base.not("name", "ilike", "%피부%")).limit(n);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: { hira_id: string }) => r.hira_id);
  };
  const first = await pick(true, limit);
  const ids = first.length >= limit ? first : [...first, ...(await pick(false, limit - first.length))];
  console.log(`Fetching 피부과 specialist counts for ${ids.length} institutions (limit ${limit}).`);

  let done = 0;
  let quota = false;
  const worker = async (queue: string[]) => {
    for (let id = queue.shift(); id !== undefined && !quota; id = queue.shift()) {
      try {
        const { items } = await hira<{ dgsbjtCd?: string | number; dgsbjtPrSdrCnt?: string | number }>(HIRA_DEPT_URL, detailKey, { ykiho: id, numOfRows: 100, pageNo: 1 });
        const { error } = await supabase!
          .from("hospitals")
          .update({ derm_specialists: dermSpecialists(items), detail_synced_at: new Date().toISOString() })
          .eq("hira_id", id);
        if (error) throw new Error(error.message);
        if (++done % 100 === 0) console.log(`  ${done}/${ids.length}`);
      } catch (e) {
        // Daily quota reached: stop cleanly, the next run resumes where this one ended.
        if (e instanceof HiraError && /quota|LIMITED|\b22\b/i.test(e.message)) quota = true;
        else console.warn(`  skipped one institution: ${(e as Error).message}`);
      }
    }
  };
  const queue = [...ids];
  await Promise.all(Array.from({ length: 5 }, () => worker(queue)));
  console.log(quota ? `Stopped at the daily quota after ${done}. Run again tomorrow.` : `Done: ${done} updated.`);
}

if (flag("details")) {
  await importDetails(Number(option("limit")) || 3000);
} else {
  const scope = option("scope");
  if (scope !== "derm" && scope !== "all") {
    console.error("Usage: --scope derm|all [--sido <code>] [--dry-run]   or   --details [--limit <n>]");
    process.exit(1);
  }
  await importList(scope);
}
