import { ImageResponse } from "next/og";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { OG_SIZE, OgCard, ogFonts } from "@/lib/og";

// The site card, used by every page that has no card of its own.
export const alt = "KONCI";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = hasLocale(raw) ? raw : "en";
  const dict = await getDictionary(lang);
  const title = dict.meta.title.split(" – ").slice(1).join(" – ") || dict.meta.title;
  const card = { eyebrow: dict.home.eyebrow, title, lines: [dict.meta.description] };
  return new ImageResponse(<OgCard {...card} />, {
    ...size,
    fonts: await ogFonts(lang, `konci${card.eyebrow}${card.title}${card.lines.join("")}`),
  });
}
