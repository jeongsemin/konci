// Metadata helpers shared by every page. No server-only imports so it can be unit tested.
import type { Metadata } from "next";
// The ".ts" extension lets the plain Node test runner resolve this import.
import { locales, type Locale } from "../i18n/config.ts";

export const SITE_NAME = "KONCI";

const HREFLANG: Record<Locale, string> = { en: "en", ja: "ja", zh: "zh-CN", ko: "ko" };
const OG_LOCALE: Record<Locale, string> = { en: "en_US", ja: "ja_JP", zh: "zh_CN", ko: "ko_KR" };

/** Public origin of the site, without a trailing slash. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** hreflang map for a path that exists in every locale (relative to metadataBase). */
export function languageAlternates(path = ""): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of locales) map[HREFLANG[l]] = `/${l}${path}`;
  map["x-default"] = `/en${path}`;
  return map;
}

export type PageMetaOptions = {
  lang: Locale;
  /** Path after the locale, e.g. "/search" or "/hospitals/<id>". */
  path?: string;
  title?: string;
  /** Open Graph / Twitter title when the page has no `title` of its own (the home page). */
  socialTitle?: string;
  description?: string;
  /** Keep the page out of search results. `follow` lets crawlers still follow its links. */
  noindex?: boolean;
  follow?: boolean;
  type?: "website" | "article";
  /** Path of a page's own link-preview image; the site card otherwise. */
  image?: string;
};

export function pageMetadata(o: PageMetaOptions): Metadata {
  const path = o.path ?? "";
  const url = `/${o.lang}${path}`;
  // A page's own openGraph replaces the parent's, image included, so every page names its card explicitly.
  const image = { url: o.image ?? `/${o.lang}/opengraph-image`, width: 1200, height: 630, alt: SITE_NAME };
  const ogTitle = o.title ? `${o.title} | ${SITE_NAME}` : o.socialTitle;

  return {
    ...(o.title ? { title: o.title } : {}),
    ...(o.description ? { description: o.description } : {}),
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: o.type ?? "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[o.lang],
      alternateLocale: locales.filter((l) => l !== o.lang).map((l) => OG_LOCALE[l]),
      url,
      images: [image],
      ...(ogTitle ? { title: ogTitle } : {}),
      ...(o.description ? { description: o.description } : {}),
    },
    twitter: {
      card: "summary_large_image",
      images: [image.url],
      ...(ogTitle ? { title: ogTitle } : {}),
      ...(o.description ? { description: o.description } : {}),
    },
    ...(o.noindex ? { robots: { index: false, follow: o.follow ?? false } } : {}),
  };
}

/** One-line description of a clinic for search results and link previews. */
export function clinicDescription(c: {
  name: string;
  address?: string | null;
  reviewCount?: number;
  avgRating?: number | null;
}): string {
  const parts = [c.name, c.address].filter(Boolean) as string[];
  const text = parts.join(" – ");
  return c.reviewCount && c.avgRating ? `${text} · ★${c.avgRating.toFixed(1)} (${c.reviewCount})` : text;
}

/**
 * schema.org data for a clinic page, so search engines can show the address and rating.
 * The rating is only included when there are reviews, as search engines require.
 */
export function clinicJsonLd(c: {
  name: string;
  url: string;
  address?: string | null;
  telephone?: string | null;
  lat?: number | null;
  lng?: number | null;
  reviewCount: number;
  avgRating: number | null;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: c.name,
    url: c.url,
    ...(c.address ? { address: { "@type": "PostalAddress", streetAddress: c.address, addressCountry: "KR" } } : {}),
    ...(c.telephone ? { telephone: c.telephone } : {}),
    ...(c.lat != null && c.lng != null ? { geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng } } : {}),
    ...(c.reviewCount > 0 && c.avgRating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(c.avgRating * 10) / 10,
            reviewCount: c.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
