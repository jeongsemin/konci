// Fills the booking-date phrase in the browser; kept apart from the guide texts so the client bundle stays small.
import type { Locale } from "../i18n/config.ts";
import type { BookingPhrase } from "./booking-guide.ts";

/**
 * The booking-date phrase with the visitor's date (YYYY-MM-DD) and time (HH:MM) filled in.
 * Numbers stay as digits: clinics read "12월 3일 14시" at a glance. Returns null for anything else.
 */
export function fillBookingDate(phrase: BookingPhrase, date: string, time: string, lang: Locale): BookingPhrase | null {
  const d = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!phrase.dateMeaning || !d || !t) return null;
  const [month, day, hour, minute] = [d[1], d[2], t[1], t[2]].map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const min = minute > 0;
  // The Korean page explains the phrases in English.
  const locale = lang === "ko" ? "en" : lang;
  const utc = { timeZone: "UTC" } as const;
  const dateText = new Intl.DateTimeFormat(locale, { ...utc, month: "long", day: "numeric" }).format(Date.UTC(2000, month - 1, day));
  const timeText = new Intl.DateTimeFormat(locale, { ...utc, hour: "numeric", minute: "2-digit" }).format(Date.UTC(2000, 0, 1, hour, minute));
  return {
    ko: `${month}월 ${day}일 ${hour}시${min ? ` ${minute}분` : ""}에 예약할 수 있나요?`,
    romanized: `${month}-wol ${day}-il ${hour}-si${min ? ` ${minute}-bun` : ""}-e yeyakal su innayo?`,
    meaning: phrase.dateMeaning.replace("{date}", dateText).replace("{time}", timeText),
  };
}
