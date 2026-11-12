import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Info, Search } from "lucide-react";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { consultationPhrase, getTreatment, GLOSSARY_UPDATED } from "@/lib/treatment-glossary";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/container";
import { PhraseCard } from "@/components/phrase-card";

export async function generateMetadata({ params }: PageProps<"/[lang]/treatments/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const t = getTreatment(slug);
  if (!hasLocale(lang) || !t) return {};
  const text = t.text[lang];
  return pageMetadata({ lang, path: `/treatments/${slug}`, title: `${text.name} (${t.ko})`, description: text.summary });
}

export default async function TreatmentPage({ params }: PageProps<"/[lang]/treatments/[slug]">) {
  const { lang, slug } = await params;
  const t = getTreatment(slug);
  if (!hasLocale(lang) || !t) notFound();
  const dict = await getDictionary(lang);
  const g = dict.glossary;
  const text = t.text[lang];

  // The Korean page explains phrases in English, like the booking guide.
  const meaningName = lang === "ko" ? t.text.en.name : text.name;
  const phrase = { ...consultationPhrase(t), meaning: g.phraseMeaning.replace("{name}", meaningName) };
  const { showLarge, close, copy, copied, date, time } = dict.booking;

  return (
    <Container className="max-w-3xl space-y-10 py-10 md:py-16">
      <header className="space-y-3">
        <p className="text-sm">
          <Link href={`/${lang}/treatments`} className="text-muted hover:text-foreground">
            ← {g.back}
          </Link>
        </p>
        <p className="text-[11px] font-bold text-brand">{g.kinds[t.kind]}</p>
        <h1 className="text-3xl font-bold leading-[1.4] md:text-[40px]">{text.name}</h1>
        <p className="text-sm text-muted">
          {g.koreanName}:{" "}
          <span lang="ko" className="font-bold text-foreground">
            {t.ko}
          </span>{" "}
          <span lang="ko-Latn" className="italic">
            ({t.romanized})
          </span>
        </p>
        <p className="text-[15px] leading-relaxed">{text.summary}</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{g.about}</h2>
        <p className="text-sm leading-relaxed text-muted">{text.about}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{g.after}</h2>
        <p className="text-sm leading-relaxed text-muted">{text.after}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{g.ask}</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          {text.ask.map((q) => (
            <li key={q}>{q}</li>
          ))}
          <li>{g.priceNote}</li>
        </ul>
      </section>

      <section className="space-y-4 rounded-lg bg-surface p-5 md:p-7">
        <h2 className="text-lg font-bold">{g.phraseTitle}</h2>
        <ol>
          <PhraseCard phrase={phrase} lang={lang} labels={{ showLarge, close, copy, copied, date, time }} />
        </ol>
        <p className="text-sm font-bold">
          <Link href={`/${lang}/booking-guide#phrases`} className="text-brand hover:underline">
            {dict.booking.phrases} →
          </Link>
        </p>
      </section>

      <Link
        href={`/${lang}/search?treatment=${encodeURIComponent(t.ko)}`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong"
      >
        <Search className="size-4" aria-hidden />
        {g.findClinics}
      </Link>

      <div className="flex items-start gap-3 rounded-[12px] bg-brand-soft p-5">
        <Info className="size-5 shrink-0 text-brand" aria-hidden />
        <div className="space-y-1">
          <p className="text-xs leading-relaxed text-muted">{g.disclaimer}</p>
          <p className="text-xs text-muted">
            {g.updated}: {GLOSSARY_UPDATED}
          </p>
        </div>
      </div>
    </Container>
  );
}
