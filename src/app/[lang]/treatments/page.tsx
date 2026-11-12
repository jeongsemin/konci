import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { GLOSSARY_UPDATED, TREATMENTS, type TreatmentKind } from "@/lib/treatment-glossary";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/container";

const KINDS: TreatmentKind[] = ["laser", "injection", "device", "care"];

export async function generateMetadata({ params }: PageProps<"/[lang]/treatments">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const g = (await getDictionary(lang)).glossary;
  return pageMetadata({ lang, path: "/treatments", title: g.title, description: g.intro });
}

export default async function TreatmentsPage({ params }: PageProps<"/[lang]/treatments">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const g = (await getDictionary(lang)).glossary;

  return (
    <Container className="max-w-4xl space-y-10 py-10 md:py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold leading-[1.5] md:text-[40px]">{g.title}</h1>
        <p className="text-xs text-muted">
          {g.updated}: {GLOSSARY_UPDATED}
        </p>
        <p className="text-[15px] leading-relaxed text-muted">{g.intro}</p>
      </header>

      {KINDS.map((kind) => (
        <section key={kind} className="space-y-4">
          <h2 className="text-lg font-bold">{g.kinds[kind]}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {TREATMENTS.filter((t) => t.kind === kind).map((t) => (
              <li key={t.slug}>
                <Link href={`/${lang}/treatments/${t.slug}`} className="block h-full space-y-1.5 rounded-md border border-border bg-card p-5 hover:border-brand">
                  <p className="text-[15px] font-bold">{t.text[lang].name}</p>
                  <p lang="ko" className="text-xs font-bold text-brand">
                    {t.ko}
                  </p>
                  <p className="text-[13px] leading-relaxed text-muted">{t.text[lang].summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="rounded-md bg-brand-soft p-5 text-xs leading-relaxed text-muted">{g.disclaimer}</p>
    </Container>
  );
}
