import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getProfile } from "@/lib/auth";
import { Container } from "./container";
import { LanguageSwitcher } from "./language-switcher";

export function BrandMark({ lang }: { lang: Locale }) {
  return (
    <Link href={`/${lang}`} className="flex items-center gap-2">
      <svg viewBox="0 0 512 512" className="size-[30px]" aria-hidden="true">
        <rect width="512" height="512" rx="116" className="fill-brand" />
        <g stroke="#fff" strokeWidth="68" strokeLinecap="round" fill="none">
          <path d="M168 118v276" />
          <path d="M190 300 262 228" />
          <path d="M226 272 336 394" />
        </g>
        <circle cx="338" cy="150" r="42" fill="#fff" />
      </svg>
      <span className="text-[25px] font-bold leading-none text-foreground">konci</span>
    </Link>
  );
}

export async function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const profile = await getProfile();

  const links = [
    { href: `/${lang}#search`, label: dict.nav.find },
    { href: `/${lang}/booking-guide`, label: dict.booking.link },
    { href: `/${lang}/feedback`, label: dict.nav.feedback },
    ...(profile ? [{ href: `/${lang}/my`, label: dict.nav.my }] : []),
    ...(profile?.is_admin ? [{ href: `/${lang}/admin`, label: dict.nav.admin }] : []),
  ];

  return (
    <header className="border-b border-border bg-card">
      <Container className="flex h-[72px] items-center justify-between gap-4 md:h-[88px]">
        <BrandMark lang={lang} />

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-sm md:gap-6">
          <LanguageSwitcher current={lang} label={dict.common.lang} />
          {profile ? (
            <form action="/auth/logout" method="post">
              <input type="hidden" name="lang" value={lang} />
              <button className="hover:text-brand">{dict.nav.logout}</button>
            </form>
          ) : (
            <Link href={`/${lang}/login`} className="hover:text-brand">
              {dict.nav.login}
            </Link>
          )}
        </div>
      </Container>

      {/* The desktop menu is hidden below md; the same links get their own row so nothing is unreachable. */}
      <nav className="border-t border-border md:hidden">
        <Container className="flex gap-6 overflow-x-auto py-1 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex min-h-11 shrink-0 items-center hover:text-brand">
              {l.label}
            </Link>
          ))}
        </Container>
      </nav>
    </header>
  );
}
