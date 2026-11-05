import { Container } from "@/components/container";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLegalDoc, LEGAL_EFFECTIVE_DATE, type LegalKind } from "@/lib/legal";
import type { Locale } from "@/i18n/config";

/** Shared layout of the terms and privacy pages. */
export function LegalPage({ kind, lang, dict }: { kind: LegalKind; lang: Locale; dict: Dictionary }) {
  const doc = getLegalDoc(kind, lang);
  return (
    <Container className="max-w-3xl space-y-8 py-10 md:py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold leading-[1.5] md:text-[40px]">{doc.title}</h1>
        <p className="text-xs text-muted">
          {dict.legal.effective}: {LEGAL_EFFECTIVE_DATE}
        </p>
        <p className="text-[15px] leading-relaxed text-muted">{doc.intro}</p>
      </header>

      {doc.sections.map((s) => (
        <section key={s.heading} className="space-y-3">
          <h2 className="text-lg font-bold">{s.heading}</h2>
          {s.paragraphs?.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-muted">
              {p}
            </p>
          ))}
          {s.items && (
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
              {s.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </Container>
  );
}
