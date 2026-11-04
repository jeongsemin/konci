import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NOTE_MAX, isSameValue, normalizeEnglishName, normalizePhone, parseEditInput } from "../src/lib/edit-request.ts";

const ID = "11111111-2222-4333-8444-555555555555";
const form = (o: Record<string, string>) => (k: string) => o[k] ?? null;

describe("normalizePhone", () => {
  it("formats Seoul, regional, mobile and representative numbers", () => {
    assert.equal(normalizePhone("02-3477-2020"), "02-3477-2020");
    assert.equal(normalizePhone("0234772020"), "02-3477-2020");
    assert.equal(normalizePhone("02 786 5123"), "02-786-5123");
    assert.equal(normalizePhone("031-123-4567"), "031-123-4567");
    assert.equal(normalizePhone("(031) 1234 5678"), "031-1234-5678");
    assert.equal(normalizePhone("010.1234.5678"), "010-1234-5678");
    assert.equal(normalizePhone("1588-1234"), "1588-1234");
  });
  it("accepts the +82 international form", () => {
    assert.equal(normalizePhone("+82 2-3477-2020"), "02-3477-2020");
    assert.equal(normalizePhone("+82-10-1234-5678"), "010-1234-5678");
    assert.equal(normalizePhone("+1 212 555 0100"), null);
  });
  it("rejects anything that is not a phone number", () => {
    for (const bad of ["", "abc", "123", "02-12-34", "0212345678901", "call me", "02-3477-2020 ext", "<script>", "00-123-4567"]) {
      assert.equal(normalizePhone(bad), null, bad);
    }
  });
});

describe("normalizeEnglishName", () => {
  it("accepts a Latin name and tidies the spacing", () => {
    assert.equal(normalizeEnglishName("  Abijou   Clinic "), "Abijou Clinic");
    assert.equal(normalizeEnglishName("Dr. Kim's Skin & Laser (Gangnam)"), "Dr. Kim's Skin & Laser (Gangnam)");
  });
  it("rejects empty, markup, non-Latin text, no letters, or too long", () => {
    for (const bad of ["", "   ", "<b>Clinic</b>", "아비쥬", "1234", "Clinic\u0000", "x".repeat(81)]) {
      assert.equal(normalizeEnglishName(bad), null, bad);
    }
    assert.equal(normalizeEnglishName("x".repeat(80))?.length, 80);
  });
});

describe("isSameValue", () => {
  it("compares phone numbers by their digits", () => {
    assert.equal(isSameValue("phone", "02-3477-2020", "023477-2020"), true);
    assert.equal(isSameValue("phone", "02-3477-2021", "02-3477-2020"), false);
  });
  it("ignores a trailing slash and case in links and names", () => {
    assert.equal(isSameValue("homepage", "http://a.kr/", "http://A.kr"), true);
    assert.equal(isSameValue("homepage", "https://a.kr", "http://a.kr"), false);
    assert.equal(isSameValue("name_en", "abijou clinic", "Abijou Clinic"), true);
  });
  it("is never the same as nothing", () => {
    assert.equal(isSameValue("phone", "02-3477-2020", null), false);
    assert.equal(isSameValue("name_en", "A", ""), false);
  });
});

describe("parseEditInput", () => {
  it("normalises the value for its field", () => {
    assert.deepEqual(parseEditInput(form({ hospitalId: ID, field: "phone", value: "0234772020", note: " new  number " })), {
      hospitalId: ID,
      field: "phone",
      value: "02-3477-2020",
      note: "new number",
    });
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "homepage", value: "www.a.kr" }))?.value, "http://www.a.kr/");
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "name_en", value: "Abijou" }))?.note, null);
  });
  it("rejects a value that is not valid for the field", () => {
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "phone", value: "hello" })), null);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "homepage", value: "javascript:alert(1)" })), null);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "name_en", value: "아비쥬" })), null);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "phone" })), null);
  });
  it("needs an explanation, and no value, for a free-text report", () => {
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "other" })), null);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "other", note: "   " })), null);
    assert.deepEqual(parseEditInput(form({ hospitalId: ID, field: "other", value: "ignored", note: "closed in March" })), {
      hospitalId: ID,
      field: "other",
      value: null,
      note: "closed in March",
    });
  });
  it("rejects an unknown field, a bad hospital id and an overlong note instead of cutting it", () => {
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "name", value: "x" })), null);
    assert.equal(parseEditInput(form({ hospitalId: "nope", field: "phone", value: "02-3477-2020" })), null);
    assert.equal(parseEditInput(form({ field: "phone", value: "02-3477-2020" })), null);
    const ok = "가".repeat(NOTE_MAX);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "other", note: ok }))?.note, ok);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "other", note: ok + "가" })), null);
  });
});
