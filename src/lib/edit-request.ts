// Parsing of the "request a correction" form. Pure helpers: the database and the session live in the action.
import { toHomepage } from "./hira.ts";

/** What any signed-in member may ask for. */
export const MEMBER_FIELDS = ["phone", "homepage", "name_en", "closure", "other"] as const;
/** What only the hospital's own manager may ask for. */
export const MANAGER_FIELDS = ["name_ja", "name_zh", "hours_note"] as const;
export const EDIT_FIELDS = [...MEMBER_FIELDS, ...MANAGER_FIELDS] as const;
export type EditField = (typeof EDIT_FIELDS)[number];

/** The fields offered on the form, in the order shown ("other" last). */
export function fieldsFor(isManager: boolean): EditField[] {
  return isManager
    ? ["phone", "homepage", "name_en", "name_ja", "name_zh", "hours_note", "closure", "other"]
    : ["phone", "homepage", "name_en", "closure", "other"];
}

/** A closure report says the clinic has closed, or moved (the note then gives the new address). */
export const CLOSURE_VALUES = ["closed", "moved"] as const;
export type ClosureValue = (typeof CLOSURE_VALUES)[number];
export const isClosureValue = (v: unknown): v is ClosureValue => (CLOSURE_VALUES as readonly unknown[]).includes(v);

export const NOTE_MAX = 300;
export const NAME_EN_MAX = 80;
export const NAME_MAX = 60;
export const HOURS_MAX = 200;
export const DAILY_LIMIT = 5;
export const MANAGER_DAILY_LIMIT = 20;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isEditField = (v: unknown): v is EditField => (EDIT_FIELDS as readonly unknown[]).includes(v);

/** Counts by code point so emoji and Korean/Japanese/Chinese text are measured like the form shows them. */
const charCount = (s: string) => [...s].length;

const clean = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

/**
 * A Korean phone number as 02-123-4567 / 031-123-4567 / 1588-1234, or null when it is not one.
 * Accepts spaces, dots, hyphens and brackets as separators and a +82 prefix.
 */
export function normalizePhone(raw: string): string | null {
  const text = raw.trim();
  if (!/^[+\d\s().-]+$/.test(text)) return null;
  let digits = text.replace(/\D/g, "");
  if (text.startsWith("+")) {
    if (!digits.startsWith("82")) return null;
    digits = `0${digits.slice(2)}`;
  }
  // 1588-1234 style representative numbers
  if (/^1[5-9]\d{2}\d{4}$/.test(digits)) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  // 02 is Seoul; every other area or mobile code is three digits
  const areaLength = digits.startsWith("02") ? 2 : 3;
  if (!/^0[1-9]\d*$/.test(digits)) return null;
  const rest = digits.slice(areaLength);
  if (rest.length < 7 || rest.length > 8) return null;
  const area = digits.slice(0, areaLength);
  return `${area}-${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
}

/** An English name: Latin letters, digits and common punctuation, with at least one letter. */
export function normalizeEnglishName(raw: string): string | null {
  const name = clean(raw);
  if (name === "" || charCount(name) > NAME_EN_MAX) return null;
  if (!/^[A-Za-z0-9 .,&'’()/+-]+$/.test(name)) return null;
  return /[A-Za-z]/.test(name) ? name : null;
}

const KANA_OR_HAN = /[぀-ヿ㐀-䶿一-鿿]/;

/** A Japanese name: kana and kanji (plus Latin letters, digits and common punctuation), at least one kana or kanji. */
export function normalizeJapaneseName(raw: string): string | null {
  const name = clean(raw);
  if (name === "" || charCount(name) > NAME_MAX) return null;
  if (!/^[぀-ヿ㐀-䶿一-鿿ｦ-ﾟA-Za-z0-9 .,&'’()/+\-・ー々〜（）]+$/.test(name)) return null;
  return KANA_OR_HAN.test(name) ? name : null;
}

/** A Chinese name: Han characters (plus Latin letters, digits and common punctuation), at least one Han character, no kana. */
export function normalizeChineseName(raw: string): string | null {
  const name = clean(raw);
  if (name === "" || charCount(name) > NAME_MAX) return null;
  if (!/^[㐀-䶿一-鿿A-Za-z0-9 .,&'’()/+\-（）·]+$/.test(name)) return null;
  return /[㐀-䶿一-鿿]/.test(name) ? name : null;
}

/**
 * A short note on opening hours and days off. Plain text: markup characters and control characters
 * are refused, line breaks become spaces, and it is shown as text only.
 */
export function normalizeHoursNote(raw: string): string | null {
  if (/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw)) return null;
  const note = clean(raw);
  if (note === "" || charCount(note) > HOURS_MAX) return null;
  return /[\p{L}\p{N}]/u.test(note) ? note : null;
}

export type ValueField = Exclude<EditField, "other">;
/** The fields that take typed text (a closure report picks one of two values instead). */
export type TextField = Exclude<ValueField, "closure">;

/** The value in the form we store it, or null when it is not acceptable for that field. */
export function normalizeValue(field: ValueField, raw: string): string | null {
  switch (field) {
    case "phone":
      return normalizePhone(raw);
    case "homepage":
      return toHomepage(raw.trim());
    case "name_en":
      return normalizeEnglishName(raw);
    case "name_ja":
      return normalizeJapaneseName(raw);
    case "name_zh":
      return normalizeChineseName(raw);
    case "hours_note":
      return normalizeHoursNote(raw);
    case "closure": {
      const choice = raw.trim().toLowerCase();
      return isClosureValue(choice) ? choice : null;
    }
  }
}

/** True when a proposed (already normalised) value equals what the hospital has now. */
export function isSameValue(field: ValueField, proposed: string, current: string | null): boolean {
  if (!current) return false;
  if (field === "phone") return proposed.replace(/\D/g, "") === current.replace(/\D/g, "");
  if (field === "homepage") return proposed.replace(/\/+$/, "").toLowerCase() === current.replace(/\/+$/, "").toLowerCase();
  return proposed.toLowerCase() === current.trim().toLowerCase();
}

export type EditInput = { hospitalId: string; field: EditField; value: string | null; note: string | null };

/**
 * Reads the form. A field the member may ask for is required (`allowed`: members by default, a
 * hospital's manager gets more), the value must be valid for it, and "other" is a free-text report
 * that needs an explanation. A note over the limit is rejected, not cut.
 */
export function parseEditInput(get: (key: string) => string | null, allowed: readonly EditField[] = fieldsFor(false)): EditInput | null {
  const hospitalId = (get("hospitalId") ?? "").trim();
  const field = get("field");
  if (!UUID.test(hospitalId) || !isEditField(field) || !allowed.includes(field)) return null;

  const note = clean(get("note"));
  if (charCount(note) > NOTE_MAX) return null;

  if (field === "other") return note === "" ? null : { hospitalId, field, value: null, note };

  const value = normalizeValue(field, get("value") ?? "");
  if (value === null) return null;
  // A clinic that moved needs its new address, so the move can be checked.
  if (field === "closure" && value === "moved" && note === "") return null;
  return { hospitalId, field, value, note: note || null };
}
