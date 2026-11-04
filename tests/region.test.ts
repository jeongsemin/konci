import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categoryLine, namesLine, regionLabel } from "../src/lib/region.ts";

describe("namesLine", () => {
  it("joins the names that exist", () => {
    assert.equal(namesLine({ name_en: "Abijou Clinic", name_ja: "アビジュ", name_zh: "阿比朱" }), "Abijou Clinic · アビジュ · 阿比朱");
    assert.equal(namesLine({ name_en: "Abijou Clinic", name_ja: null, name_zh: "  " }), "Abijou Clinic");
  });
  it("is null when there are none", () => {
    assert.equal(namesLine({}), null);
    assert.equal(namesLine({ name_en: null, name_ja: "", name_zh: undefined }), null);
  });
});

describe("regionLabel", () => {
  it("joins the city and the district", () => {
    assert.equal(regionLabel("서울", "강남구"), "서울 강남구");
    assert.equal(regionLabel("경기", "수원팔달구"), "경기 수원팔달구");
  });
  it("uses whichever part exists, and is null when neither does", () => {
    assert.equal(regionLabel("서울", null), "서울");
    assert.equal(regionLabel(undefined, "강남구"), "강남구");
    assert.equal(regionLabel(null, null), null);
    assert.equal(regionLabel("  ", ""), null);
  });
});

describe("categoryLine", () => {
  it("puts the type before the region", () => {
    assert.equal(categoryLine("의원", "서울", "강남구"), "의원 · 서울 강남구");
  });
  it("copes with rows that have only one of them (Naver rows have no region)", () => {
    assert.equal(categoryLine("의원", null, null), "의원");
    assert.equal(categoryLine(null, "서울", "강남구"), "서울 강남구");
    assert.equal(categoryLine(null, null, null), null);
  });
});
