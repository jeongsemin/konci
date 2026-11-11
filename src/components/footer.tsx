import Link from "next/link";
import { locales, localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Container } from "./container";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="bg-surface">
      <Container className="space-y-6 py-10">
        <Link href={`/${lang}`} className="block text-[25px] font-bold leading-none">
          konci
        </Link>
        <p className="max-w-3xl text-xs leading-relaxed text-muted">{dict.footer.disclaimer}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
          <Link href={`/${lang}/booking-guide`} className="hover:text-brand">
            {dict.booking.link}
          </Link>
          <Link href={`/${lang}/terms`} className="hover:text-brand">
            {dict.legal.terms}
          </Link>
          <Link href={`/${lang}/privacy`} className="hover:text-brand">
            {dict.legal.privacy}
          </Link>
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
          <p>{dict.footer.meta}</p>
          <p className="flex gap-3">
            {locales.map((l) => (
              <Link key={l} href={`/${l}`} className={l === lang ? "font-bold text-foreground" : "hover:text-foreground"}>
                {localeNames[l]}
              </Link>
            ))}
          </p>
        </div>
      </Container>
    </footer>
  );
}
