import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HiraError, buildUrl, dermSpecialists, parseResponse, toDate, toHomepage, toRow, withoutLocked } from "../src/lib/hira.ts";

const ok = (body: Record<string, unknown>) => ({ response: { header: { resultCode: "00", resultMsg: "NORMAL SERVICE." }, body } });
const item = {
  ykiho: "JDQ4MTg4MSM1MSMk",
  yadmNm: "강남고운세상피부과의원",
  addr: "서울특별시 강남구 테헤란로2길 8, 3층 (역삼동)",
  clCd: 31,
  clCdNm: "의원",
  sidoCdNm: "서울",
  sgguCdNm: "강남구",
  telno: "02-3477-2020",
  hospUrl: "http://www.beautyforever.co.kr",
  estbDd: 20160922,
  drTotCnt: 1,
  XPos: 127.0287286,
  YPos: 37.4976293,
};

describe("parseResponse", () => {
  it("returns an array for several hits and wraps a single hit", () => {
    assert.equal(parseResponse(ok({ items: { item: [item, item] }, totalCount: 2 })).items.length, 2);
    const one = parseResponse(ok({ items: { item }, totalCount: 1 }));
    assert.equal(one.items.length, 1);
    assert.equal(one.totalCount, 1);
  });
  it("treats an empty result (items is a blank string) as no hits", () => {
    assert.deepEqual(parseResponse(ok({ items: "", totalCount: 0 })), { items: [], totalCount: 0 });
    assert.deepEqual(parseResponse(ok({ totalCount: 0 })), { items: [], totalCount: 0 });
  });
  it("throws on an error code or a malformed body, instead of importing nothing", () => {
    assert.throws(() => parseResponse({ response: { header: { resultCode: "30", resultMsg: "SERVICE KEY IS NOT REGISTERED" } } }), HiraError);
    assert.throws(() => parseResponse({ OpenAPI_ServiceResponse: { cmmMsgHeader: { errMsg: "NO_OPENAPI_SERVICE_ERROR" } } }), HiraError);
    assert.throws(() => parseResponse(null), HiraError);
  });
});

describe("toRow", () => {
  it("maps a list item to a hospitals row keyed by the HIRA id", () => {
    assert.deepEqual(toRow(item), {
      external_id: "hira:JDQ4MTg4MSM1MSMk",
      hira_id: "JDQ4MTg4MSM1MSMk",
      source: "hira",
      name: "강남고운세상피부과의원",
      category: "의원",
      road_address: "서울특별시 강남구 테헤란로2길 8, 3층 (역삼동)",
      phone: "02-3477-2020",
      lat: 37.4976293,
      lng: 127.0287286,
      sido: "서울",
      sgg: "강남구",
      type_code: "31",
      homepage: "http://www.beautyforever.co.kr/",
      est_date: "2016-09-22",
      doctor_count: 1,
    });
  });
  it("accepts the string-typed numbers HIRA sometimes sends", () => {
    const row = toRow({ ...item, XPos: "126.9677500", YPos: "37.5684083", drTotCnt: "392", clCd: "01", estbDd: "19790324" });
    assert.equal(row?.lng, 126.96775);
    assert.equal(row?.doctor_count, 392);
    assert.equal(row?.type_code, "01");
    assert.equal(row?.est_date, "1979-03-24");
  });
  it("skips rows without an id or a name, and nulls out missing or bad optional fields", () => {
    assert.equal(toRow({ ...item, ykiho: "" }), null);
    assert.equal(toRow({ ...item, yadmNm: "  " }), null);
    const sparse = toRow({ ykiho: "x", yadmNm: "A의원", XPos: 0, YPos: 0, telno: "", hospUrl: "", estbDd: 0, drTotCnt: "n/a" });
    assert.equal(sparse?.lat, null);
    assert.equal(sparse?.lng, null);
    assert.equal(sparse?.phone, null);
    assert.equal(sparse?.homepage, null);
    assert.equal(sparse?.est_date, null);
    assert.equal(sparse?.doctor_count, null);
  });
  it("rejects swapped or out-of-country coordinates", () => {
    const swapped = toRow({ ...item, XPos: 37.4976293, YPos: 127.0287286 });
    assert.equal(swapped?.lat, null);
    assert.equal(swapped?.lng, null);
  });
});

describe("toHomepage", () => {
  it("keeps http(s) links and adds a scheme to bare hosts", () => {
    assert.equal(toHomepage("https://a.kr/x"), "https://a.kr/x");
    assert.equal(toHomepage("www.a.kr"), "http://www.a.kr/");
  });
  it("drops anything that is not a web link", () => {
    assert.equal(toHomepage("javascript:alert(1)"), null);
    assert.equal(toHomepage("JavaScript:alert(1)"), null);
    assert.equal(toHomepage("data:text/html,<b>"), null);
    assert.equal(toHomepage("ftp://a.kr"), null);
    assert.equal(toHomepage("http://"), null);
    assert.equal(toHomepage(null), null);
  });
});

describe("toDate", () => {
  it("formats valid dates and rejects impossible ones", () => {
    assert.equal(toDate(20010419), "2001-04-19");
    assert.equal(toDate(20010230), null);
    assert.equal(toDate(20011301), null);
    assert.equal(toDate(0), null);
    assert.equal(toDate("abc"), null);
    assert.equal(toDate(undefined), null);
  });
});

describe("dermSpecialists", () => {
  it("reads the 피부과 entry and ignores other departments", () => {
    assert.equal(dermSpecialists([{ dgsbjtCd: 1, dgsbjtPrSdrCnt: 4 }, { dgsbjtCd: 14, dgsbjtPrSdrCnt: 2 }]), 2);
    assert.equal(dermSpecialists([{ dgsbjtCd: "14", dgsbjtPrSdrCnt: "1" }]), 1);
  });
  it("is 0 when 피부과 is not listed or the count is unusable", () => {
    assert.equal(dermSpecialists([]), 0);
    assert.equal(dermSpecialists([{ dgsbjtCd: 1, dgsbjtPrSdrCnt: 3 }]), 0);
    assert.equal(dermSpecialists([{ dgsbjtCd: 14 }]), 0);
  });
});

describe("withoutLocked", () => {
  it("drops only the locked columns and leaves the row itself untouched", () => {
    const row = { name: "A의원", phone: "02-1", homepage: "http://a.kr/" };
    assert.deepEqual(withoutLocked(row, ["phone"]), { name: "A의원", homepage: "http://a.kr/" });
    assert.deepEqual(withoutLocked(row, ["phone", "homepage"]), { name: "A의원" });
    assert.deepEqual(row, { name: "A의원", phone: "02-1", homepage: "http://a.kr/" });
  });
  it("ignores locks on columns the row does not have, and with no locks changes nothing", () => {
    assert.deepEqual(withoutLocked({ name: "A" }, ["name_en"]), { name: "A" });
    assert.deepEqual(withoutLocked({ name: "A" }, []), { name: "A" });
  });
});

describe("buildUrl", () => {
  it("percent-encodes the key once and passes the other params", () => {
    const url = new URL(buildUrl("https://apis.data.go.kr/x", "a+b/c==", { pageNo: 1, dgsbjtCd: "14" }));
    assert.equal(url.searchParams.get("serviceKey"), "a+b/c==");
    assert.equal(url.searchParams.get("_type"), "json");
    assert.equal(url.searchParams.get("pageNo"), "1");
    assert.equal(url.searchParams.get("dgsbjtCd"), "14");
  });
});
