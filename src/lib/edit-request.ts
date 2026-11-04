// Parsing of the "request a correction" form. Pure helpers: the database and the session live in the action.
import { toHomepage } from "./hira.ts";

export const EDIT_FIELDS = ["phone", "homepage", "name_en", "other"] as const;
export type EditField = (typeof EDIT_FIELDS)[number];

export const NOTE_MAX = 300;
export const NAME_EN_MAX = 80;
export const DAILY_LIMIT = 5;

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

/** The value in the form we store it, or null when it is not acceptable for that field. */
export function normalizeValue(field: Exclude<EditField, "other">, raw: string): string | null {
  if (field === "phone") return normalizePhone(raw);
  if (field === "homepage") return toHomepage(raw.trim());
  return normalizeEnglishName(raw);
}

/** True when a proposed (already normalised) value equals what the hospital has now. */
export function isSameValue(field: Exclude<EditField, "other">, proposed: string, current: string | null): boolean {
  if (!current) return false;
  if (field === "phone") return proposed.replace(/\D/g, "") === current.replace(/\D/g, "");
  if (field === "homepage") return proposed.replace(/\/+$/, "").toLowerCase() === current.replace(/\/+$/, "").toLowerCase();
  return proposed.toLowerCase() === current.trim().toLowerCase();
}

export type EditInput = { hospitalId: string; field: EditField; value: string | null; note: string | null };

/**
 * Reads the form. A known field is required, the value must be valid for it, and "other" is a
 * free-text report that needs an explanation. A note over the limit is rejected, not cut.
 */
export function parseEditInput(get: (key: string) => string | null): EditInput | null {
  const hospitalId = (get("hospitalId") ?? "").trim();
  const field = get("field");
  if (!UUID.test(hospitalId) || !isEditField(field)) return null;

  const note = clean(get("note"));
  if (charCount(note) > NOTE_MAX) return null;

  if (field === "other") return note === "" ? null : { hospitalId, field, value: null, note };

  const value = normalizeValue(field, get("value") ?? "");
  return value === null ? null : { hospitalId, field, value, note: note || null };
}
