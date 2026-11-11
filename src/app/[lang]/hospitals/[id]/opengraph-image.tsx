import { ImageResponse } from "next/og";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { OG_SIZE, OgCard, ogFonts } from "@/lib/og";
import { categoryLine } from "@/lib/region";
import { createClient } from "@/lib/supabase/server";

// A clinic's link preview: its name, where it is, and its rating.
export const alt = "KONCI";
export const size = OG_SIZE;
export const contentType = "image/png";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Image({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: raw, id } = await params;
  const lang = hasLocale(raw) ? raw : "en";
  const dict = await getDictionary(lang);

  let card = { eyebrow: dict.hospital.verified, title: dict.meta.title, lines: [] as string[] };
  if (UUID.test(id)) {
    const supabase = await createClient();
    const [{ data: h }, { data: stats }] = await Promise.all([
      supabase.from("hospitals").select("name, road_address, address, category, sido, sgg").eq("id", id).maybeSingle(),
      supabase.from("hospital_stats").select("review_count, avg_rating").eq("hospital_id", id).maybeSingle(),
    ]);
    if (h) {
      const count = stats?.review_count ?? 0;
      const rating =
        count > 0 && stats?.avg_rating != null
          ? `★ ${Number(stats.avg_rating).toFixed(1)} · ${dict.hospital.detail.reviewCount.replace("{n}", String(count))}`
          : dict.search.noReviews;
      card = {
        eyebrow: categoryLine(h.category, h.sido, h.sgg) || dict.hospital.verified,
        title: h.name,
        lines: [h.road_address || h.address, rating].filter(Boolean) as string[],
      };
    }
  }

  return new ImageResponse(<OgCard {...card} />, {
    ...size,
    fonts: await ogFonts(lang, `konci${card.eyebrow}${card.title}${card.lines.join("")}`),
  });
}
