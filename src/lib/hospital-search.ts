import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDICAL_TYPES } from "@/lib/hira";
import { isMedical, toCandidate, type NaverLocalItem } from "@/lib/naver-local";
import { PAGE_SIZE, areaSpec, searchTokens, treatmentSpec, type Sort } from "@/lib/search-params";
import { planSlices } from "@/lib/search-plan";

export type SearchType = "all" | "derm";

export type SearchResult = {
  id: string;
  name: string;
  name_en: string | null;
  name_ja: string | null;
  name_zh: string | null;
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
  /** A treatment: found in the visible reviews, or "lists dermatology" for general skin care. */
  treatment?: string;
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
const COLUMNS = "id, name, name_en, name_ja, name_zh, category, address, road_address, sido, sgg, review_count, avg_rating, fluent_english_count, director_count";

/**
 * How closely a hospital's name matches what was typed. In the default order every hospital of an
 * earlier tier comes before every hospital of a later one, whatever their reviews:
 *  exact  the name is the search ("아비쥬의원")
 *  prefix the name starts with it ("아비쥬의원 강서점")
 *  name   every word is somewhere in the name
 *  rest   the words are found in the name or the address
 * `all` is the single tier used when the order is chosen explicitly or there are no words (area only).
 */
type Tier = "exact" | "prefix" | "name" | "rest" | "all";
const NAME_FIRST: Tier[] = ["exact", "prefix", "name", "rest"];

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
  const treatment = input.treatment ? treatmentSpec(input.treatment) : null;
  const page = Math.max(1, input.page ?? 1);
  if (tokens.length === 0 && !spec && !treatment) return { results: [], total: 0, page };

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

  const phrase = tokens.join(" ");
  const nameFirst = tokens.length > 0 && (input.sort ?? "relevance") === "relevance";
  const tiers: Tier[] = nameFirst ? NAME_FIRST : ["all"];

  /** The hospitals of one tier that pass the filters, in the order they are shown. */
  const tierQuery = (tier: Tier, select: { count: "exact"; head: true } | { count: "exact" }) => {
    // Hospitals of the kinds we list (HIRA's dental, oriental and nursing institutions are left out);
    // rows from Naver have no type and stay.
    let query = admin
      .from("hospital_directory")
      .select(COLUMNS, select)
      .or(`type_code.in.(${MEDICAL_TYPES.join(",")}),type_code.is.null`)
      // Clinics reported and confirmed as closed or moved are not offered any more.
      .is("closed_at", null);

    // The English, Japanese and Chinese names (set from approved requests) count like the Korean name.
    // alt_names holds them joined by spaces and is never null, so "does not match" needs no special case.
    switch (tier) {
      case "exact":
        query = query.or(`name.ilike.${phrase},alt_names.ilike.${phrase}`);
        break;
      case "prefix":
        query = query
          .or(`name.ilike.${phrase}%,alt_names.ilike.${phrase}%`)
          .not("name", "ilike", phrase)
          .not("alt_names", "ilike", phrase);
        break;
      case "name":
        for (const word of tokens) query = query.or(`name.ilike.%${word}%,alt_names.ilike.%${word}%`);
        query = query.not("name", "ilike", `${phrase}%`).not("alt_names", "ilike", `${phrase}%`);
        break;
      case "rest":
      case "all":
        for (const word of tokens) {
          query = query.or(`name.ilike.%${word}%,alt_names.ilike.%${word}%,road_address.ilike.%${word}%,address.ilike.%${word}%`);
        }
        // Not already listed under the name tiers: at least one word is missing from every name.
        if (tier === "rest") query = query.or(tokens.map((w) => `and(name.not.ilike.%${w}%,alt_names.not.ilike.%${w}%)`).join(","));
        break;
    }

    if (spec) {
      query = query.eq("sido", spec.sido);
      if (spec.sgg) query = query.eq("sgg", spec.sgg);
      if (spec.dongs) query = query.or(spec.dongs.map((d) => `road_address.ilike.%${d}%`).join(","));
    }
    if (treatment?.derm) query = query.eq("derm_listed", true);
    // treatments is the lower-cased text of the visible reviews' treatments (NULL when there are none).
    else if (treatment) query = query.or(treatment.keywords.map((k) => `treatments.ilike.%${k}%`).join(","));
    if (input.rating) query = query.gte("avg_rating", input.rating / 10);
    if (input.reviews) query = query.gte("review_count", input.reviews);
    if (input.english) query = query.gt("fluent_english_count", 0);
    if (input.director) query = query.gt("director_count", 0);
    return query;
  };

  const counted = await Promise.all(tiers.map((tier) => tierQuery(tier, { count: "exact", head: true })));
  if (counted.some((r) => r.error)) return { results: [], total: 0, page, error: "db" };
  const counts = counted.map((r) => r.count ?? 0);
  const total = counts.reduce((a, b) => a + b, 0);

  // A page past the end shows the first one.
  const shown = (page - 1) * PAGE_SIZE < total ? page : 1;
  const slices = planSlices(counts, (shown - 1) * PAGE_SIZE, PAGE_SIZE);

  // Most reviewed first (the rating only breaks a tie), unless the rating order was asked for.
  // Name and id make the order total, so a hospital never shows up on two pages.
  const desc = { ascending: false, nullsFirst: false };
  const fetched = await Promise.all(
    slices.map(({ tier, from, to }) => {
      const query = tierQuery(tiers[tier], { count: "exact" });
      const ordered =
        input.sort === "rating"
          ? query.order("avg_rating", desc).order("review_count", desc)
          : query.order("review_count", desc).order("avg_rating", desc);
      return ordered.order("name").order("id").range(from, to);
    }),
  );
  if (fetched.some((r) => r.error)) return { results: [], total: 0, page: shown, error: "db" };

  const results = fetched
    .flatMap((r) => r.data ?? [])
    .map((h) => ({ ...h, avg_rating: h.avg_rating === null ? null : Number(h.avg_rating) })) as SearchResult[];
  return { results, total, page: shown, error: results.length === 0 ? error : undefined };
}
