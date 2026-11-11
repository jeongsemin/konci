import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { BOOKING_GUIDE_UPDATED, getBookingGuide } from "@/lib/booking-guide";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/container";
import { PhoneText } from "@/components/phone-text";
import { PhraseCard } from "@/components/phrase-card";

export async function generateMetadata({ params }: PageProps<"/[lang]/booking-guide">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const guide = getBookingGuide(lang);
  return pageMetadata({ lang, path: "/booking-guide", title: guide.title, description: guide.intro });
}

export default async function BookingGuidePage({ params }: PageProps<"/[lang]/booking-guide">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const guide = getBookingGuide(lang);
  const { showLarge, close, copy, copied, date, time } = dict.booking;
  const labels = { showLarge, close, copy, copied, date, time };

  return (
    <Container className="max-w-3xl space-y-10 py-10 md:py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold leading-[1.5] md:text-[40px]">{guide.title}</h1>
        <p className="text-xs text-muted">
          {dict.booking.updated}: {BOOKING_GUIDE_UPDATED}
        </p>
        <p className="text-[15px] leading-relaxed text-muted">{guide.intro}</p>
      </header>

      {guide.sections.map((s) => (
        <section key={s.heading} className="space-y-3">
          <h2 className="text-lg font-bold">{s.heading}</h2>
          {s.paragraphs?.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-muted">
              <PhoneText text={p} />
            </p>
          ))}
          {s.items && (
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
              {s.items.map((i) => (
                <li key={i}>
                  <PhoneText text={i} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section id="phrases" className="scroll-mt-6 space-y-4 rounded-lg bg-surface p-5 md:p-7">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold leading-snug">{guide.phrasesTitle}</h2>
          <p className="text-sm text-muted">{guide.phrasesIntro}</p>
        </div>
        <ol className="space-y-3">
          {guide.phrases.map((p) => (
            <PhraseCard key={p.ko} phrase={p} lang={lang} labels={labels} />
          ))}
        </ol>
      </section>
    </Container>
  );
}
