import type { Locale } from "../../i18n/config.ts";
import { PRIVACY } from "./privacy.ts";
import { TERMS } from "./terms.ts";
import { contactEmail, fillContact, type LegalDoc } from "./types.ts";

export type LegalKind = "terms" | "privacy";

const DOCS: Record<LegalKind, Record<Locale, LegalDoc>> = { terms: TERMS, privacy: PRIVACY };

/** The document in the viewer's language with the contact address filled in. */
export function getLegalDoc(kind: LegalKind, lang: Locale, email = contactEmail()): LegalDoc {
  return fillContact(DOCS[kind][lang], email);
}

export { LEGAL_EFFECTIVE_DATE } from "./types.ts";
