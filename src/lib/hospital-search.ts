import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDICAL_TYPES } from "@/lib/hira";
import { isMedical, toCandidate, type NaverLocalItem } from "@/lib/naver-local";
import { PAGE_SIZE, areaSpec, searchTokens, type Sort } from "@/lib/search-params";

export type SearchType = "all" | "derm";

export type SearchResult = {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  road_address: string | null;
  sido: string | null;
  sgg: string | null;
  review_count: number;
  avg_rating: number | null;
  fluent_english_count: number;
  director_count: number;
};

export type SearchInput = {
  /** Words that must each appear in the name or address. */
  q: string;
  type: SearchType;
  /** A key of the area filter (강남, 명동, …). */
  area?: string;
  /** Minimum average rating x10. */
  rating?: number;
  reviews?: number;
  english?: boolean;
  director?: boolean;
  sort?: Sort;
  page?: number;
};

export type SearchOutcome = {
  results: SearchResult[];
  /** Hospitals matching all the filters, across every page. */
  total: number;
  /** The page actually returned (a page past the end falls back to the first). */
  page: number;
  /** Set when Naver (or the DB) failed; `results` may still hold DB matches. */
  error?: "not_configured" | "upstream" | "db";
};

const KEYWORD: Record<SearchType, string> = { all: "병원", derm: "피부과" };
const COLUMNS = "id, name, category, address, road_address, sido, sgg, review_count, avg_rating, fluent_english_count, director_count";

async function fromNaver(q: string, type: SearchType): Promise<{ items: NaverLocalItem[] } | { error: "not_configured" | "upstream" }> {
  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!id || !secret) return { error: "not_configured" };

  // Don't append the keyword twice if the user already typed it.
  const query = q.includes(KEYWORD[type]) ? q : `${q} ${KEYWORD[type]}`;
  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "5"); // the API caps local search at 5 results
  url.searchParams.set("sort", "comment");

  try {
    const res = await fetch(url, {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) return { error: "upstream" };
    return { items: ((await res.json()).items ?? []) as NaverLocalItem[] };
  } catch {
    return { error: "upstream" };
  }
}

/**
 * Looks hospitals up in our own table (filled from the HIRA public data), one page at a time.
 * On the first page it also asks Naver and adds any medical hits it returns to the table,
 * so a clinic missing from the public data can still be found.
 */
export async function searchHospitals(input: SearchInput): Promise<SearchOutcome> {
  const q = input.q.trim().slice(0, 50);
  const spec = input.area ? areaSpec(input.area) : null;
  const tokens = searchTokens(q);
  const page = Math.max(1, input.page ?? 1);
  if (tokens.length === 0 && !spec) return { results: [], total: 0, page };

  const admin = createAdminClient();
  let error: SearchOutcome["error"];

  if (q && page === 1) {
    const naver = await fromNaver(input.area && !spec ? q : [input.area, q].filter(Boolean).join(" "), input.type);
    if ("error" in naver) error = naver.error;
    else {
      const candidates = naver.items.filter(isMedical).map(toCandidate);
      if (candidates.length > 0) {
        const { error: dbError } = await admin.from("hospitals").upsert(candidates, { onConflict: "external_id" });
        if (dbError) error = "db";
      }
    }
  }

  const run = (pageNumber: number) => {
    // Hospitals of the kinds we list (HIRA's dental, oriental and nursing institutions are left out);
    // rows from Naver have no type and stay.
    let query = admin
      .from("hospital_directory")
      .select(COLUMNS, { count: "exact" })
      .or(`type_code.in.(${MEDICAL_TYPES.join(",")}),type_code.is.null`);

    for (const word of tokens) {
      query = query.or(`name.ilike.%${word}%,road_address.ilike.%${word}%,address.ilike.%${word}%`);
    }
    if (spec) {
      query = query.eq("sido", spec.sido);
      if (spec.sgg) query = query.eq("sgg", spec.sgg);
      if (spec.dongs) query = query.or(spec.dongs.map((d) => `road_address.ilike.%${d}%`).join(","));
    }
    if (input.rating) query = query.gte("avg_rating", input.rating / 10);
    if (input.reviews) query = query.gte("review_count", input.reviews);
    if (input.english) query = query.gt("fluent_english_count", 0);
    if (input.director) query = query.gt("director_count", 0);

    const desc = { ascending: false, nullsFirst: false };
    query =
      input.sort === "rating"
        ? query.order("avg_rating", desc).order("review_count", desc)
        : query.order("review_count", desc).order("avg_rating", desc);
    // name and id make the order total, so a hospital never shows up on two pages.
    const from = (pageNumber - 1) * PAGE_SIZE;
    return query.order("name").order("id").range(from, from + PAGE_SIZE - 1);
  };

  let shown = page;
  let { data, count, error: dbError } = await run(page);
  if (dbError?.code === "PGRST103" && page > 1) {
    // Asked for a page past the end: show the first one.
    shown = 1;
    ({ data, count, error: dbError } = await run(1));
  }
  if (dbError) return { results: [], total: 0, page: shown, error: "db" };

  const results = (data ?? []).map((h) => ({ ...h, avg_rating: h.avg_rating === null ? null : Number(h.avg_rating) })) as SearchResult[];
  return { results, total: count ?? results.length, page: shown, error: results.length === 0 ? error : undefined };
}
