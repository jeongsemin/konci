import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  TREATMENT_KEYS,
  aggregateReviews,
  areaSpec,
  composeQuery,
  displayQuery,
  pageWindow,
  parseParams,
  searchTokens,
  toQueryString,
  toggleCompare,
  treatmentSpec,
} from "../src/lib/search-params.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const D = "44444444-4444-4444-8444-444444444444";

describe("parseParams", () => {
  it("falls back to defaults for junk input", () => {
    const f = parseParams({ rating: "99", reviews: "abc", sort: "hack", compare: "x,y" });
    assert.equal(f.rating, 0);
    assert.equal(f.reviews, 0);
    assert.equal(f.sort, "relevance");
    assert.deepEqual(f.compare, []);
  });
  it("keeps valid values, dedupes and caps compare ids", () => {
    const f = parseParams({ rating: "45", reviews: "10", english: "1", compare: `${A},${A},${B},${C},${D}` });
    assert.equal(f.rating, 45);
    assert.equal(f.reviews, 10);
    assert.equal(f.english, true);
    assert.deepEqual(f.compare, [A, B, C]);
  });
});

describe("toQueryString", () => {
  it("round-trips and omits defaults", () => {
    assert.equal(toQueryString(parseParams({})), "");
    const f = parseParams({ q: "강남", rating: "40", sort: "rating", compare: A });
    assert.deepEqual(parseParams(Object.fromEntries(new URLSearchParams(toQueryString(f)))), f);
  });
});

describe("searchTokens", () => {
  it("splits a composed phrase into words so each can match name or address", () => {
    assert.deepEqual(searchTokens("강남 레이저 토닝"), ["강남", "레이저", "토닝"]);
  });
  it("removes PostgREST-special characters and caps the word count", () => {
    assert.deepEqual(searchTokens("a,b (c) 100%"), ["a", "b", "c", "100"]);
    assert.equal(searchTokens("1 2 3 4 5 6").length, 4);
  });
});

describe("composeQuery", () => {
  it("keeps a treatment out of the words (it is looked for in the reviews) but still picks the dermatology keyword", () => {
    assert.deepEqual(composeQuery(parseParams({ treatment: "레이저 토닝", q: "고운" })), { query: "고운", type: "derm" });
    assert.deepEqual(composeQuery(parseParams({ treatment: "레이저 토닝" })), { query: "", type: "derm" });
    assert.deepEqual(composeQuery(parseParams({ q: "서울병원" })), { query: "서울병원", type: "all" });
  });
  it("keeps a known area out of the words: it filters by location, not by name", () => {
    assert.deepEqual(composeQuery(parseParams({ area: "강남", q: "아비쥬" })), { query: "아비쥬", type: "all" });
    assert.deepEqual(composeQuery(parseParams({ area: "강남" })), { query: "", type: "all" });
  });
  it("still treats an unknown area typed into the URL as an ordinary word", () => {
    assert.deepEqual(composeQuery(parseParams({ area: "제주", q: "피부과" })), { query: "제주 피부과", type: "derm" });
  });
});

describe("areaSpec", () => {
  it("describes each offered area by its location", () => {
    assert.deepEqual(areaSpec("강남"), { sido: "서울", sgg: "강남구" });
    assert.deepEqual(areaSpec("부산"), { sido: "부산" });
    assert.equal(areaSpec("명동")?.sgg, "중구");
    assert.ok(areaSpec("홍대")?.dongs?.includes("서교동"));
  });
  it("is null for anything else", () => {
    assert.equal(areaSpec(""), null);
    assert.equal(areaSpec("제주"), null);
    assert.equal(areaSpec("toString"), null);
  });
});

describe("displayQuery", () => {
  it("puts a known area, under its display name, before the words", () => {
    const f = parseParams({ area: "강남", q: "아비쥬" });
    assert.equal(displayQuery(f), "강남 아비쥬");
    assert.equal(displayQuery(f, "Gangnam"), "Gangnam 아비쥬");
  });
  it("includes the treatment, under its display name, between the area and the words", () => {
    const f = parseParams({ area: "강남", treatment: "레이저 토닝", q: "아비쥬" });
    assert.equal(displayQuery(f), "강남 레이저 토닝 아비쥬");
    assert.equal(displayQuery(f, "Gangnam", "Laser toning"), "Gangnam Laser toning 아비쥬");
    assert.equal(displayQuery(parseParams({ treatment: "레이저 토닝" })), "레이저 토닝");
  });
  it("is empty without an area or words, and does not repeat an unknown area", () => {
    assert.equal(displayQuery(parseParams({})), "");
    assert.equal(displayQuery(parseParams({ area: "제주" }), "Jeju"), "제주");
  });
});

describe("treatmentSpec", () => {
  const matches = (key: string, review: string) => treatmentSpec(key)!.keywords.some((k) => review.toLowerCase().includes(k));

  it("expands a known treatment to the words used for it in all four languages", () => {
    for (const review of ["레이저 토닝", "Laser toning", "レーザートーニング", "激光美白"]) assert.ok(matches("레이저 토닝", review), review);
    for (const review of ["수분 관리", "Hydration facial", "保湿ケア", "补水护理", "水光针"]) assert.ok(matches("수분 관리", review), review);
    for (const review of ["색소 상담", "Pigmentation consult", "シミ取り", "色素咨询", "기미 치료"]) assert.ok(matches("색소 상담", review), review);
  });
  it("does not match another treatment's reviews", () => {
    assert.equal(matches("레이저 토닝", "수분 관리"), false);
    assert.equal(matches("수분 관리", "Laser toning"), false);
    assert.equal(matches("색소 상담", "Hydration care"), false);
  });
  it("treats general skin care as a hospital fact, not a review keyword", () => {
    assert.deepEqual(treatmentSpec("피부 진료"), { derm: true, keywords: [] });
  });
  it("looks an unknown treatment up as written, lower-cased and without filter syntax", () => {
    assert.deepEqual(treatmentSpec("Botox"), { keywords: ["botox"] });
    assert.deepEqual(treatmentSpec("a,b(c)%d_e.f"), { keywords: ["a b c d e f"] });
    assert.equal(treatmentSpec(""), null);
    assert.equal(treatmentSpec(" ,() "), null);
    assert.deepEqual(treatmentSpec("toString"), { keywords: ["tostring"] });
  });
  it("covers every treatment chip in every language, so a chip can never fall back to a name search", () => {
    for (const lang of ["ko", "en", "ja", "zh"]) {
      const dictionary = JSON.parse(readFileSync(new URL(`../src/i18n/dictionaries/${lang}.json`, import.meta.url), "utf8"));
      const chips: { q: string }[] = dictionary.home.treatments.items;
      assert.ok(chips.length > 0);
      for (const chip of chips) assert.ok(TREATMENT_KEYS.includes(chip.q), `${lang}: ${chip.q}`);
    }
  });
});

describe("paging", () => {
  it("reads the page number and falls back to 1 for junk", () => {
    assert.equal(parseParams({ page: "3" }).page, 3);
    for (const bad of ["0", "-2", "abc", "1.5", ""]) assert.equal(parseParams({ page: bad }).page, 1);
    assert.equal(parseParams({}).page, 1);
    assert.equal(parseParams({ page: "999999" }).page, 1000);
  });
  it("keeps the page in the query string only after the first page", () => {
    assert.equal(toQueryString(parseParams({ q: "a" })), "?q=a");
    assert.equal(toQueryString(parseParams({ q: "a", page: "2" })), "?q=a&page=2");
  });
  it("windows the page numbers around the current one", () => {
    assert.deepEqual(pageWindow(1, 1), [1]);
    assert.deepEqual(pageWindow(1, 3), [1, 2, 3]);
    assert.deepEqual(pageWindow(1, 20), [1, 2, null, 20]);
    assert.deepEqual(pageWindow(10, 20), [1, null, 9, 10, 11, null, 20]);
    assert.deepEqual(pageWindow(20, 20), [1, null, 19, 20]);
    assert.deepEqual(pageWindow(2, 4), [1, 2, 3, 4]);
  });
});

describe("compare", () => {
  it("toggles and keeps only the latest three", () => {
    let f = parseParams({});
    for (const id of [A, B, C, D]) f = toggleCompare(f, id);
    assert.deepEqual(f.compare, [B, C, D]);
    assert.deepEqual(toggleCompare(f, C).compare, [B, D]);
  });
  it("aggregates review rows", () => {
    const base = { hospital_id: A, interpreter_available: false, director_consultation: false, price_explained: false, no_upselling: false };
    const s = aggregateReviews([
      { ...base, rating: 5, english_support: "fluent", director_consultation: true },
      { ...base, rating: 4, english_support: "basic", price_explained: true },
    ]);
    assert.deepEqual(s, { total: 2, avgRating: 4.5, fluentEnglish: 1, interpreter: 0, director: 1, priceExplained: 1, noUpselling: 0 });
    assert.equal(aggregateReviews([]).avgRating, null);
  });
});
