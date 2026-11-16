import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { externalId, isMedical, nameKey, naverLocalRequest, region, roadKey, sameClinic, toCandidate } from "../src/lib/naver-local.ts";

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
  it("leaves out the kinds the site does not list", () => {
    assert.equal(isMedical({ ...item, title: "바른한의원", category: "한의원" }), false);
    assert.equal(isMedical({ ...item, title: "스마일치과의원", category: "병원,의원>치과" }), false);
    assert.equal(isMedical({ ...item, title: "행복요양병원", category: "병원,의원>요양병원" }), false);
    assert.equal(isMedical({ ...item, title: "24시 동물병원", category: "동물병원" }), false);
    assert.equal(isMedical({ ...item, title: "데이뷰의원 강남점", category: "병원,의원>피부과" }), true);
  });
});

describe("matching Naver results to clinics we have", () => {
  it("marks clinics Naver files under dermatology", () => {
    assert.equal(toCandidate(item).derm_listed, true);
    assert.equal(toCandidate({ ...item, title: "데이뷰의원 강남점", category: "병원,의원>피부과" }).derm_listed, true);
    assert.equal(toCandidate({ ...item, category: "병원,의원>이비인후과" }).derm_listed, false);
  });

  it("compares names without branch, spaces or brackets", () => {
    assert.equal(nameKey("데이뷰의원 강남점"), "데이뷰의원");
    assert.equal(nameKey("데이뷰의원"), "데이뷰의원");
    assert.equal(nameKey("오라클피부과의원"), nameKey("오라클 피부과 신사점"));
    assert.equal(nameKey("세라미크의원(강남)"), "세라미크의원");
    assert.notEqual(nameKey("데이뷰의원"), nameKey("데이뷰성형외과의원"));
  });

  it("reads the road and building number", () => {
    assert.equal(roadKey("서울특별시 강남구 강남대로 494, 1,2,3층 (논현동)"), "강남대로 494");
    assert.equal(roadKey("서울특별시 강남구 강남대로 494 2층"), "강남대로 494");
    assert.equal(roadKey("경기도 안양시 동안구 평촌대로211번길 16, 901호"), "평촌대로211번길 16");
    assert.equal(roadKey(null), null);
  });

  it("finds the same clinic by address or distance, but not a neighbour or a far branch", () => {
    const hira = { name: "데이뷰의원", road_address: "서울특별시 강남구 강남대로 494, 1,2,3층 (논현동)", lat: 37.5064043, lng: 127.0241345 };
    const naver = { name: "데이뷰의원 강남점", road_address: "서울특별시 강남구 강남대로 494 2층", lat: 37.50641, lng: 127.02412 };
    assert.equal(sameClinic(naver, hira), true);
    assert.equal(sameClinic({ ...naver, road_address: null }, hira), true);
    assert.equal(sameClinic({ ...naver, name: "다른피부과의원" }, hira), false);
    const busan = { name: "데이뷰의원", road_address: "부산광역시 부산진구 서면로 74", lat: 35.1572051, lng: 129.058155 };
    assert.equal(sameClinic(naver, busan), false);
  });
});

describe("region of a Naver result", () => {
  it("uses the HIRA forms the area filter reads", () => {
    assert.deepEqual(region("서울특별시 강남구 봉은사로2길 29 B1층~5층"), { sido: "서울", sgg: "강남구" });
    assert.deepEqual(region("경기도 고양시 덕양구 화중로 1"), { sido: "경기", sgg: "고양덕양구" });
    assert.deepEqual(region("경기도 가평군 가평읍 1"), { sido: "경기", sgg: "가평군" });
    assert.deepEqual(region("경기도 과천시 별양상가3로 1"), { sido: "경기", sgg: "과천시" });
    assert.deepEqual(region("광주광역시 광산구 무진대로 1"), { sido: "전남광주", sgg: "광주광산구" });
    assert.deepEqual(region("전라남도 목포시 영산로 1"), { sido: "전남광주", sgg: "목포시" });
    assert.deepEqual(region("세종특별자치시 새롬중앙로 55"), { sido: "세종시", sgg: "세종시" });
    assert.deepEqual(region("부산광역시 부산진구 서면로 74"), { sido: "부산", sgg: "부산진구" });
  });
  it("leaves it empty when the address is unknown", () => {
    assert.deepEqual(region(""), { sido: null, sgg: null });
    assert.deepEqual(region("Seoul Gangnam-gu"), { sido: null, sgg: null });
  });
  it("is set on the candidate", () => {
    const c = toCandidate(item);
    assert.equal(c.sido, "서울");
    assert.equal(c.sgg, "강남구");
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
