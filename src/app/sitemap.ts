import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { BOOKING_GUIDE_UPDATED } from "@/lib/booking-guide";
import { GLOSSARY_UPDATED, TREATMENTS } from "@/lib/treatment-glossary";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";
import { languageAlternates, siteUrl } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";

// Cached by default; the clinic list changes as reviews arrive, so refresh it hourly.
export const revalidate = 3600;

/** One entry per locale for a path, each listing all language versions. */
function localized(path: string, lastModified: Date, priority: number): MetadataRoute.Sitemap {
  const base = siteUrl();
  const languages = Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([code, p]) => [code, `${base}${p}`]),
  );
  return locales.map((l) => ({
    url: `${base}/${l}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = [
    ...localized("", new Date(), 1),
    ...localized("/booking-guide", new Date(BOOKING_GUIDE_UPDATED), 0.6),
    ...localized("/treatments", new Date(GLOSSARY_UPDATED), 0.6),
    ...TREATMENTS.flatMap((t) => localized(`/treatments/${t.slug}`, new Date(GLOSSARY_UPDATED), 0.5)),
    ...localized("/terms", new Date(LEGAL_EFFECTIVE_DATE), 0.3),
    ...localized("/privacy", new Date(LEGAL_EFFECTIVE_DATE), 0.3),
  ];

  // Only clinics that have at least one review are worth indexing.
  try {
    const admin = createAdminClient();
    const [{ data }, { data: suspended }, { data: closed }] = await Promise.all([
      admin
        .from("reviews")
        .select("hospital_id, user_id, created_at")
        .is("hidden_at", null)
        .order("created_at", { ascending: false })
        .limit(5000),
      admin.from("suspensions").select("user_id"),
      // Clinics confirmed as closed or moved are not advertised to search engines.
      admin.from("hospitals").select("id").not("closed_at", "is", null),
    ]);
    // The service role bypasses RLS, so hidden reviews are filtered above and reviews of suspended authors here.
    const hidden = new Set((suspended ?? []).map((s) => s.user_id));
    const gone = new Set((closed ?? []).map((h) => h.id));
    const latest = new Map<string, string>();
    for (const r of data ?? []) {
      if (!hidden.has(r.user_id) && !gone.has(r.hospital_id) && !latest.has(r.hospital_id)) latest.set(r.hospital_id, r.created_at);
    }
    for (const [id, created] of latest) entries.push(...localized(`/hospitals/${id}`, new Date(created), 0.7));
  } catch {
    // The database being unreachable must not break the sitemap: serve the static entries.
  }

  return entries;
}
