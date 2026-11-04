// Pure helpers for the search & compare page. Kept free of server-only imports
// so they can be unit tested with the plain Node test runner.

export type Sort = "relevance" | "rating" | "reviews";
export const MAX_COMPARE = 3;
export const PAGE_SIZE = 10;
const MAX_PAGE = 1000;

export type Filters = {
  q: string;
  area: string;
  treatment: string;
  rating: 0 | 40 | 45; // minimum average rating x10, 0 = any
  reviews: 0 | 1 | 5 | 10; // minimum review count, 0 = any
  english: boolean;
  director: boolean;
  sort: Sort;
  page: number; // 1-based
  compare: string[];
};

type Raw = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function oneOf<T extends number>(value: string, allowed: readonly T[], fallback: T): T {
  const n = Number(value);
  return (allowed as readonly number[]).includes(n) ? (n as T) : fallback;
}

function pageNumber(value: string): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_PAGE) : 1;
}

export function parseParams(sp: Raw): Filters {
  const sort = first(sp.sort);
  return {
    q: first(sp.q).trim().slice(0, 50),
    area: first(sp.area).trim().slice(0, 20),
    treatment: first(sp.treatment).trim().slice(0, 30),
    rating: oneOf(first(sp.rating), [0, 40, 45] as const, 0),
    reviews: oneOf(first(sp.reviews), [0, 1, 5, 10] as const, 0),
    english: first(sp.english) === "1",
    director: first(sp.director) === "1",
    sort: sort === "rating" || sort === "reviews" ? sort : "relevance",
    page: pageNumber(first(sp.page)),
    compare: [...new Set(first(sp.compare).split(","))].filter((id) => UUID.test(id)).slice(0, MAX_COMPARE),
  };
}

/** Query string for a filter set; defaults are omitted to keep URLs short. */
export function toQueryString(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.area) p.set("area", f.area);
  if (f.treatment) p.set("treatment", f.treatment);
  if (f.rating) p.set("rating", String(f.rating));
  if (f.reviews) p.set("reviews", String(f.reviews));
  if (f.english) p.set("english", "1");
  if (f.director) p.set("director", "1");
  if (f.sort !== "relevance") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  if (f.compare.length) p.set("compare", f.compare.join(","));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * The areas offered in the filter, as real locations. They are matched against the
 * hospital's city, district and neighbourhood, never against its name (a clinic called
 * "강남…" in another district is not in 강남).
 */
export type AreaSpec = { sido: string; sgg?: string; dongs?: string[] };

const AREAS: Record<string, AreaSpec> = {
  강남: { sido: "서울", sgg: "강남구" },
  명동: { sido: "서울", sgg: "중구", dongs: ["명동"] },
  홍대: { sido: "서울", sgg: "마포구", dongs: ["서교동", "동교동", "연남동", "합정동", "상수동"] },
  부산: { sido: "부산" },
};

export const areaSpec = (area: string): AreaSpec | null => (Object.hasOwn(AREAS, area) ? AREAS[area] : null);

/**
 * What a treatment filter looks for. HIRA's data has no treatments, so a treatment is found in the
 * reviews: a hospital matches when a visible review names it. Reviews are written in any language
 * and in the member's own words, so each known treatment lists the words used for it in all four
 * languages. "General skin care" is a fact about the hospital instead: it lists dermatology.
 */
export type TreatmentSpec = { derm?: true; keywords: string[] };

// The keys are the `q` values of the treatment chips (the same in every language).
const TREATMENTS: Record<string, TreatmentSpec> = {
  "레이저 토닝": { keywords: ["레이저", "토닝", "laser", "toning", "レーザー", "トーニング", "激光", "镭射", "鐳射"] },
  "수분 관리": { keywords: ["수분", "보습", "hydrat", "moistur", "水光", "保湿", "补水", "補水"] },
  "색소 상담": { keywords: ["색소", "기미", "잡티", "pigment", "melasma", "dark spot", "色素", "シミ", "色斑", "黄褐斑"] },
  "피부 진료": { derm: true, keywords: [] },
};

export const TREATMENT_KEYS = Object.keys(TREATMENTS);

/** A word safe to put in a PostgREST filter: no separators, brackets or wildcards. */
const safeWord = (s: string) => s.replace(/[,()%*\\_.]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * The filter for a treatment, or null for none. A known treatment (a chip) expands to its keywords;
 * anything else typed into the URL is looked for as written in the reviews.
 */
export function treatmentSpec(treatment: string): TreatmentSpec | null {
  if (Object.hasOwn(TREATMENTS, treatment)) return TREATMENTS[treatment];
  const word = safeWord(treatment);
  return word ? { keywords: [word] } : null;
}

/**
 * The words to look for in a hospital's name or address: the free text, plus an unknown area typed
 * into the URL. A known area is a location filter and a treatment is a review filter instead.
 */
export function composeQuery(f: Filters): { query: string; type: "all" | "derm" } {
  const query = [areaSpec(f.area) ? "" : f.area, f.q].filter(Boolean).join(" ").trim();
  return { query, type: f.treatment || f.q.includes("피부과") ? "derm" : "all" };
}

/** The phrase for the page title: a known area and the treatment (under their display names) plus the words searched. */
export function displayQuery(f: Filters, areaName = f.area, treatmentName = f.treatment): string {
  return [areaSpec(f.area) ? areaName : "", f.treatment ? treatmentName : "", composeQuery(f).query].filter(Boolean).join(" ");
}

/** Page numbers to show: always the first and last, the current page and its neighbours, with `null` for a gap. */
export function pageWindow(current: number, total: number): (number | null)[] {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? [null, p] : [p]));
}

/** Words for matching known hospitals; drops characters that are special in PostgREST filters. */
export function searchTokens(q: string, max = 4): string[] {
  return q
    .replace(/[,()%*\\_]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max);
}

export function toggleCompare(f: Filters, id: string): Filters {
  const has = f.compare.includes(id);
  const compare = has ? f.compare.filter((x) => x !== id) : [...f.compare, id].slice(-MAX_COMPARE);
  return { ...f, compare };
}

export type ReviewRow = {
  hospital_id: string;
  rating: number;
  english_support: "none" | "basic" | "fluent";
  interpreter_available: boolean;
  director_consultation: boolean;
  price_explained: boolean;
  no_upselling: boolean;
};

export type CompareStats = {
  total: number;
  avgRating: number | null;
  fluentEnglish: number;
  interpreter: number;
  director: number;
  priceExplained: number;
  noUpselling: number;
};

export function aggregateReviews(rows: ReviewRow[]): CompareStats {
  const sum = (pick: (r: ReviewRow) => boolean) => rows.filter(pick).length;
  return {
    total: rows.length,
    avgRating: rows.length ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10 : null,
    fluentEnglish: sum((r) => r.english_support === "fluent"),
    interpreter: sum((r) => r.interpreter_available),
    director: sum((r) => r.director_consultation),
    priceExplained: sum((r) => r.price_explained),
    noUpselling: sum((r) => r.no_upselling),
  };
}
