import { test } from "node:test";
import assert from "node:assert/strict";
import { locales } from "../src/i18n/config.ts";
import { BOOKING_GUIDE_UPDATED, getBookingGuide } from "../src/lib/booking-guide.ts";

test("every language has the same sections, list lengths and phrases", () => {
  const ref = getBookingGuide("en");
  for (const l of locales) {
    const g = getBookingGuide(l);
    assert.equal(g.sections.length, ref.sections.length, `${l} section count`);
    g.sections.forEach((s, i) => {
      assert.equal(s.items?.length ?? 0, ref.sections[i].items?.length ?? 0, `${l} items of section ${i + 1}`);
      assert.equal(s.paragraphs?.length ?? 0, ref.sections[i].paragraphs?.length ?? 0, `${l} paragraphs of section ${i + 1}`);
    });
    assert.equal(g.phrases.length, ref.phrases.length, `${l} phrase count`);
  }
});

test("no text is empty", () => {
  for (const l of locales) {
    const g = getBookingGuide(l);
    assert.ok(g.title && g.intro && g.phrasesTitle && g.phrasesIntro, `${l} header`);
    for (const s of g.sections) assert.ok(s.heading.trim() && ((s.paragraphs?.length ?? 0) + (s.items?.length ?? 0)) > 0);
    for (const p of g.phrases) assert.ok(p.ko.trim() && p.romanized.trim() && p.meaning.trim(), `${l} phrase`);
  }
});

test("phrases are Korean with a Latin reading, and the consultation phrase names the viewer's language", () => {
  const hangul = /[가-힣]/;
  for (const l of locales) {
    for (const p of getBookingGuide(l).phrases) {
      assert.ok(hangul.test(p.ko), `${l}: ${p.ko}`);
      assert.ok(!hangul.test(p.romanized), `${l}: ${p.romanized}`);
    }
  }
  assert.match(getBookingGuide("en").phrases[1].ko, /^영어로/);
  assert.match(getBookingGuide("ja").phrases[1].ko, /^일본어로/);
  assert.match(getBookingGuide("zh").phrases[1].ko, /^중국어로/);
});

test("every language says KONCI does not take bookings and points to the 1330 hotline", () => {
  for (const l of locales) {
    const g = getBookingGuide(l);
    assert.ok(g.intro.includes("KONCI"), `${l} intro`);
    assert.ok(JSON.stringify(g.sections).includes("1330"), `${l} 1330`);
  }
});

test("the last-checked date is a real date", () => {
  assert.match(BOOKING_GUIDE_UPDATED, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(new Date(BOOKING_GUIDE_UPDATED).getTime()));
});

test("the booking-date phrase fills in the visitor's date and time", async () => {
  const { fillBookingDate } = await import("../src/lib/booking-date.ts");
  const en = getBookingGuide("en").phrases.find((p) => p.dateMeaning)!;
  assert.deepEqual(fillBookingDate(en, "2026-12-03", "14:00", "en"), {
    ko: "12월 3일 14시에 예약할 수 있나요?",
    romanized: "12-wol 3-il 14-si-e yeyakal su innayo?",
    meaning: "Can I book for December 3 at 2:00 PM?",
  });
  assert.equal(fillBookingDate(en, "2026-12-03", "09:30", "en")?.ko, "12월 3일 9시 30분에 예약할 수 있나요?");
  // The Korean page explains in English; Japanese and Chinese use their own date words.
  const ko = getBookingGuide("ko").phrases.find((p) => p.dateMeaning)!;
  assert.match(fillBookingDate(ko, "2026-12-03", "14:00", "ko")!.meaning, /December 3/);
  const ja = getBookingGuide("ja").phrases.find((p) => p.dateMeaning)!;
  assert.match(fillBookingDate(ja, "2026-12-03", "14:00", "ja")!.meaning, /^12月3日 .*予約できますか/);
  const zh = getBookingGuide("zh").phrases.find((p) => p.dateMeaning)!;
  assert.match(fillBookingDate(zh, "2026-12-03", "14:00", "zh")!.meaning, /^可以预约12月3日 /);
});

test("the date phrase stays a template until both date and time are valid", async () => {
  const { fillBookingDate } = await import("../src/lib/booking-date.ts");
  const guide = getBookingGuide("en");
  const date = guide.phrases.find((p) => p.dateMeaning)!;
  assert.equal(fillBookingDate(date, "", "14:00", "en"), null);
  assert.equal(fillBookingDate(date, "2026-12-03", "", "en"), null);
  assert.equal(fillBookingDate(date, "2026-13-03", "14:00", "en"), null);
  assert.equal(fillBookingDate(guide.phrases[0], "2026-12-03", "14:00", "en"), null);
  assert.equal(guide.phrases.filter((p) => p.dateMeaning).length, 1);
});
