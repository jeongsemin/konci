// Legal documents (terms of service, privacy policy). Plain data so they can be unit tested and rendered by one page component.

export type LegalSection = {
  heading: string;
  /** Paragraphs shown before the list. */
  paragraphs?: string[];
  items?: string[];
};

export type LegalDoc = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

/** Date the current texts take effect (YYYY-MM-DD). Change it whenever the texts change. */
export const LEGAL_EFFECTIVE_DATE = "2026-11-11";

/** Token replaced by the operator's contact address. */
export const CONTACT_TOKEN = "{contact}";

/** Contact address shown in the documents; set NEXT_PUBLIC_CONTACT_EMAIL before launch. */
export function contactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@konci.example";
}

/** Fills the contact token in every string of a document. */
export function fillContact(doc: LegalDoc, email: string): LegalDoc {
  const fill = (s: string) => s.replaceAll(CONTACT_TOKEN, email);
  return {
    title: doc.title,
    intro: fill(doc.intro),
    sections: doc.sections.map((s) => ({
      heading: fill(s.heading),
      paragraphs: s.paragraphs?.map(fill),
      items: s.items?.map(fill),
    })),
  };
}
