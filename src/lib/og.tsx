// Link-preview cards (Open Graph) drawn with next/og. Korean, Japanese and Chinese need real fonts,
// so only the glyphs a card uses are fetched from Google Fonts; if that fails the card still renders.
import type { Locale } from "@/i18n/config";

export const OG_SIZE = { width: 1200, height: 630 };

const FAMILIES: Record<Locale, string[]> = {
  en: ["Noto Sans KR"],
  ko: ["Noto Sans KR"],
  ja: ["Noto Sans JP", "Noto Sans KR"],
  zh: ["Noto Sans SC", "Noto Sans KR"],
};

type OgFont = { name: string; data: ArrayBuffer; weight: 700; style: "normal" };

async function loadFont(family: string, text: string): Promise<OgFont | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}:wght@700&text=${encodeURIComponent(text)}`;
    // Without a browser user agent Google serves TrueType, which the image renderer can read.
    const css = await (await fetch(url, { cache: "force-cache" })).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src, { cache: "force-cache" });
    if (!res.ok) return null;
    return { name: family, data: await res.arrayBuffer(), weight: 700, style: "normal" };
  } catch {
    return null;
  }
}

export async function ogFonts(lang: Locale, text: string): Promise<OgFont[]> {
  const fonts = await Promise.all(FAMILIES[lang].map((f) => loadFont(f, text)));
  return fonts.filter((f): f is OgFont => f !== null);
}

const BRAND = "#087f83";

/** The KONCI mark: the same drawing as the site icon. */
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512">
      <rect width="512" height="512" rx="116" fill={BRAND} />
      <g stroke="#fff" strokeWidth="68" strokeLinecap="round" fill="none">
        <path d="M168 118v276" />
        <path d="M190 300 262 228" />
        <path d="M226 272 336 394" />
      </g>
      <circle cx="338" cy="150" r="42" fill="#fff" />
    </svg>
  );
}

/** Shared card layout: brand row on top, a headline, and up to two lines below it. */
export function OgCard({ eyebrow, title, lines }: { eyebrow: string; title: string; lines: string[] }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", padding: "64px 72px", fontFamily: "Noto Sans KR" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Mark size={64} />
        <div style={{ fontSize: 44, fontWeight: 700, color: "#172f35" }}>konci</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: BRAND }}>{eyebrow}</div>
        <div style={{ fontSize: title.length > 22 ? 56 : 68, fontWeight: 700, color: "#172f35", lineHeight: 1.25 }}>{title}</div>
        {lines.map((l) => (
          <div key={l} style={{ fontSize: 32, fontWeight: 700, color: "#63767b" }}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", height: 12, background: BRAND, borderRadius: 6 }} />
    </div>
  );
}
