// Parsing of the "I manage this hospital" application. Pure helpers: the session, the database and
// the file storage live in the route handler.
import { isAcceptableSize, sniffImage } from "./receipt-file.ts";

/** At most this many managers per hospital. */
export const MAX_MANAGERS = 3;
/** A member can have at most this many applications waiting at once. */
export const MAX_PENDING_PER_USER = 5;

export const POSITION_MIN = 2;
export const POSITION_MAX = 60;
export const CONTACT_MIN = 5;
export const CONTACT_MAX = 100;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProofFormat = "jpg" | "png" | "pdf";

export const PROOF_MIME: Record<ProofFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

/**
 * Identifies the real type of a proof document from its first bytes (a photo, a scan or a PDF).
 * The client-supplied MIME type and file name are never trusted.
 */
export function sniffProof(bytes: Uint8Array): ProofFormat | null {
  const image = sniffImage(bytes);
  if (image) return image;
  // "%PDF-"
  const pdf = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return bytes.length >= pdf.length && pdf.every((b, i) => bytes[i] === b) ? "pdf" : null;
}

export { isAcceptableSize as isAcceptableProofSize };

/** Counts by code point so emoji and Korean/Japanese/Chinese text are measured like the form shows them. */
const charCount = (s: string) => [...s].length;

const clean = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

export type ManagerInput = { hospitalId: string; position: string; contact: string };

/**
 * Reads the application form. The position and the contact are required and measured by code point;
 * anything outside the limits, or containing markup characters, is rejected rather than cut.
 */
export function parseManagerInput(get: (key: string) => string | null): ManagerInput | null {
  const hospitalId = (get("hospitalId") ?? "").trim();
  const position = clean(get("position"));
  const contact = clean(get("contact"));
  if (!UUID.test(hospitalId)) return null;
  if (charCount(position) < POSITION_MIN || charCount(position) > POSITION_MAX) return null;
  if (charCount(contact) < CONTACT_MIN || charCount(contact) > CONTACT_MAX) return null;
  if (/[<>]/.test(position) || /[<>]/.test(contact)) return null;
  return { hospitalId, position, contact };
}

/** Whether another manager can still be approved for a hospital. */
export const hasRoomForManager = (activeCount: number): boolean => activeCount < MAX_MANAGERS;
