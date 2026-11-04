import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NOTE_MAX,
  fieldsFor,
  isSameValue,
  normalizeChineseName,
  normalizeEnglishName,
  normalizeHoursNote,
  normalizeJapaneseName,
  normalizePhone,
  parseEditInput,
} from "../src/lib/edit-request.ts";

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

describe("normalizeJapaneseName and normalizeChineseName", () => {
  it("accept a name in the right script and tidy the spacing", () => {
    assert.equal(normalizeJapaneseName("  アビジュ  クリニック "), "アビジュ クリニック");
    assert.equal(normalizeJapaneseName("江南皮膚科"), "江南皮膚科");
    assert.equal(normalizeJapaneseName("Abijou アビジュ"), "Abijou アビジュ");
    assert.equal(normalizeChineseName("阿比朱皮肤科"), "阿比朱皮肤科");
    assert.equal(normalizeChineseName("江南 Abijou 诊所"), "江南 Abijou 诊所");
  });
  it("reject Korean, Latin-only, kana in a Chinese name, markup, and overlong text", () => {
    for (const bad of ["", "   ", "아비쥬", "Abijou", "1234", "<b>江南</b>", "江".repeat(61)]) {
      assert.equal(normalizeJapaneseName(bad), null, `ja: ${bad}`);
      assert.equal(normalizeChineseName(bad), null, `zh: ${bad}`);
    }
    assert.equal(normalizeChineseName("アビジュクリニック"), null);
    assert.equal(normalizeJapaneseName("江".repeat(60))?.length, 60);
  });
});

describe("normalizeHoursNote", () => {
  it("keeps a short plain-text note, turning line breaks into spaces", () => {
    assert.equal(normalizeHoursNote("평일 10:00~19:00\n토 10:00~16:00 / 일 휴진"), "평일 10:00~19:00 토 10:00~16:00 / 일 휴진");
    assert.equal(normalizeHoursNote("Mon-Fri 10:00-19:00, closed Sunday"), "Mon-Fri 10:00-19:00, closed Sunday");
  });
  it("refuses markup, control characters, empty or symbol-only text and anything over 200 characters", () => {
    for (const bad of ["", "   ", "<script>alert(1)</script>", "a > b", "ok\u0000", "----", "가".repeat(201)]) {
      assert.equal(normalizeHoursNote(bad), null, bad);
    }
    assert.equal(normalizeHoursNote("가".repeat(200))?.length, 200);
  });
});

describe("fieldsFor", () => {
  it("offers a manager the extra fields, with the closure report and 'other' last", () => {
    assert.deepEqual(fieldsFor(false), ["phone", "homepage", "name_en", "closure", "other"]);
    assert.deepEqual(fieldsFor(true), ["phone", "homepage", "name_en", "name_ja", "name_zh", "hours_note", "closure", "other"]);
  });
});

describe("closure reports", () => {
  it("accept 'closed' or 'moved' as the value", () => {
    assert.deepEqual(parseEditInput(form({ hospitalId: ID, field: "closure", value: "closed" })), {
      hospitalId: ID,
      field: "closure",
      value: "closed",
      note: null,
    });
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "closure", value: " CLOSED " }))?.value, "closed");
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "closure", value: "closed", note: "closed in March" }))?.note, "closed in March");
  });
  it("need the new address for a move", () => {
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "closure", value: "moved" })), null);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "closure", value: "moved", note: "   " })), null);
    assert.deepEqual(parseEditInput(form({ hospitalId: ID, field: "closure", value: "moved", note: "서울 강남구 테헤란로 1" })), {
      hospitalId: ID,
      field: "closure",
      value: "moved",
      note: "서울 강남구 테헤란로 1",
    });
  });
  it("refuse any other value, and are open to every member", () => {
    for (const bad of ["", "open", "closed;drop", "폐업", "true"]) {
      assert.equal(parseEditInput(form({ hospitalId: ID, field: "closure", value: bad })), null, bad);
    }
    assert.ok(parseEditInput(form({ hospitalId: ID, field: "closure", value: "closed" }), fieldsFor(false)));
    assert.equal(isSameValue("closure", "closed", "closed"), true);
    assert.equal(isSameValue("closure", "closed", "moved"), false);
    assert.equal(isSameValue("closure", "closed", null), false);
  });
});

describe("parseEditInput for managers", () => {
  it("refuses the manager-only fields unless they are allowed", () => {
    const f = form({ hospitalId: ID, field: "name_ja", value: "アビジュ" });
    assert.equal(parseEditInput(f), null);
    assert.equal(parseEditInput(f, fieldsFor(false)), null);
    assert.deepEqual(parseEditInput(f, fieldsFor(true)), { hospitalId: ID, field: "name_ja", value: "アビジュ", note: null });
  });
  it("validates each manager field the same way, and still refuses an unknown one", () => {
    const all = fieldsFor(true);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "name_zh", value: "아비쥬" }), all), null);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "hours_note", value: "<b>x</b>" }), all), null);
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "hours_note", value: "Mon-Sat 10-19" }), all)?.value, "Mon-Sat 10-19");
    assert.equal(parseEditInput(form({ hospitalId: ID, field: "name", value: "x" }), all), null);
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
