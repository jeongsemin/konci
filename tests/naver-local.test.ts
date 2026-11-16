import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { externalId, isMedical, naverLocalRequest, toCandidate } from "../src/lib/naver-local.ts";

const item = {
  title: "<b>서울</b>맑은피부과의원",
  link: "https://example.com",
  category: "의료,건강>피부과",
  telephone: "02-123-4567",
  address: "서울특별시 강남구 역삼동 1",
  roadAddress: "서울특별시 강남구 테헤란로 1",
  mapx: "1270276000",
  mapy: "374979000",
};

describe("naver local search parsing", () => {
  it("strips markup and converts coordinates", () => {
    const c = toCandidate(item);
    assert.equal(c.name, "서울맑은피부과의원");
    assert.equal(c.lng, 127.0276);
    assert.equal(c.lat, 37.4979);
    assert.equal(c.road_address, item.roadAddress);
  });
  it("derives a stable id regardless of whitespace", () => {
    assert.equal(externalId("서울 맑은", "테헤란로 1", ""), externalId("서울맑은", "테헤란로  1", ""));
  });
  it("filters non-medical places", () => {
    assert.equal(isMedical(item), true);
    assert.equal(isMedical({ ...item, title: "맛있는 식당", category: "음식점>한식" }), false);
  });
});

describe("naverLocalRequest", () => {
  const keys = { NAVER_SEARCH_CLIENT_ID: "id", NAVER_SEARCH_CLIENT_SECRET: "secret" };

  it("uses NAVER API HUB by default", () => {
    const r = naverLocalRequest(keys, "강남 피부과")!;
    const url = new URL(r.url);
    assert.equal(url.origin + url.pathname, "https://naverapihub.apigw.ntruss.com/search/v1/local");
    assert.equal(url.searchParams.get("query"), "강남 피부과");
    assert.equal(url.searchParams.get("display"), "5");
    assert.deepEqual(r.headers, { "X-NCP-APIGW-API-KEY-ID": "id", "X-NCP-APIGW-API-KEY": "secret" });
  });

  it("uses the old Developers Center host and headers when asked", () => {
    const r = naverLocalRequest({ ...keys, NAVER_SEARCH_API: "legacy" }, "x")!;
    assert.ok(r.url.startsWith("https://openapi.naver.com/v1/search/local.json?"));
    assert.deepEqual(r.headers, { "X-Naver-Client-Id": "id", "X-Naver-Client-Secret": "secret" });
  });

  it("does not call Naver without both keys", () => {
    assert.equal(naverLocalRequest({}, "x"), null);
    assert.equal(naverLocalRequest({ NAVER_SEARCH_CLIENT_ID: "id" }, "x"), null);
    assert.equal(naverLocalRequest({ NAVER_SEARCH_CLIENT_ID: " ", NAVER_SEARCH_CLIENT_SECRET: "s" }, "x"), null);
  });
});
