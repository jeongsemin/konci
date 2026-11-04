import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireProfile } from "@/lib/auth";
import { isEditField, type ClosureValue, type EditField } from "@/lib/edit-request";
import { regionLabel } from "@/lib/region";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/container";
import { decideEdit, reopenHospital } from "../actions";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

type Hospital = {
  id: string;
  name: string;
  sido: string | null;
  sgg: string | null;
  phone: string | null;
  homepage: string | null;
  name_en: string | null;
  name_ja: string | null;
  name_zh: string | null;
  hours_note: string | null;
  closed_reason: string | null;
} | null;
type Named = { display_name: string | null } | null;

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/edits">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata({ lang, path: "/admin/edits", title: dict.admin.edits.title, noindex: true });
}

export default async function EditsPage({ params }: PageProps<"/[lang]/admin/edits">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, `/${lang}/admin/edits`);
  if (!profile.is_admin) notFound();
  const dict = await getDictionary(lang);
  const t = dict.admin.edits;
  const labels = dict.edit.fields;

  const admin = createAdminClient();
  // The table points at profiles twice (requester, resolver), so each embed names its foreign key.
  const hospitalCols = "hospitals(id, name, sido, sgg, phone, homepage, name_en, name_ja, name_zh, hours_note, closed_reason)";
  const [{ data: open }, { data: done }, { data: closed }] = await Promise.all([
    admin
      .from("hospital_edit_requests")
      .select(`id, field, value, note, by_manager, created_at, ${hospitalCols}, requester:profiles!hospital_edit_requests_requester_id_fkey(display_name)`)
      .eq("status", "open")
      // A hospital's own manager first, then oldest first.
      .order("by_manager", { ascending: false })
      .order("created_at")
      .limit(50),
    admin
      .from("hospital_edit_requests")
      .select(
        `id, field, value, status, reject_reason, resolved_at, ${hospitalCols}, requester:profiles!hospital_edit_requests_requester_id_fkey(display_name), resolver:profiles!hospital_edit_requests_resolved_by_fkey(display_name)`,
      )
      .neq("status", "open")
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(10),
    // Hospitals currently shown as closed or moved, so a mistaken decision can be undone.
    admin
      .from("hospitals")
      .select("id, name, sido, sgg, closed_at, closed_reason, closed_note")
      .not("closed_at", "is", null)
      .order("closed_at", { ascending: false })
      .limit(50),
  ]);

  const fmt = (iso: string) => new Date(iso).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" });
  const fieldLabel = (f: string) => (isEditField(f) ? labels[f] : f);
  const choices = dict.edit.closure.choices;
  // A closure report's value is "closed" or "moved"; show it in words.
  const choiceLabel = (v: string) => choices[v as ClosureValue] ?? v;
  const currentOf = (h: Hospital, f: EditField) =>
    f === "other" || !h ? null : f === "closure" ? dict.edit.closure.states[(h.closed_reason as ClosureValue | null) ?? "open"] : h[f];

  return (
    <>
      <section className="pb-9 pt-8">
        <Container className="space-y-4">
          <p className="text-xs text-muted">{t.breadcrumb}</p>
          <h1 className="text-3xl font-bold leading-snug md:text-[36px]">{t.title}</h1>
          <p className="max-w-3xl text-sm text-muted">{t.subtitle}</p>
          <Link href={`/${lang}/admin`} className="inline-block text-sm font-bold text-brand hover:underline">
            ← {t.back}
          </Link>
        </Container>
      </section>

      <Container className="space-y-10 pb-16">
        <section className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold leading-snug md:text-[28px]">{t.queueTitle}</h2>
            <p className="text-sm text-muted">
              {t.open}: <strong className="text-star">{(open ?? []).length}</strong>
            </p>
          </div>

          {(open ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t.empty}</p>
          ) : (
            <ul className="space-y-5">
              {(open ?? []).map((r) => {
                const hospital = r.hospitals as unknown as Hospital;
                const field = isEditField(r.field) ? r.field : "other";
                const current = currentOf(hospital, field);
                return (
                  <li key={r.id} className="space-y-4 rounded-md border border-border bg-card p-5 md:p-6">
                    <div className="space-y-1">
                      {r.by_manager && (
                        <p>
                          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-brand">{t.card.byManager}</span>
                        </p>
                      )}
                      <p className="text-[19px] font-bold leading-snug">
                        {hospital ? (
                          <Link href={`/${lang}/hospitals/${hospital.id}`} className="hover:text-brand">
                            {hospital.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        {regionLabel(hospital?.sido, hospital?.sgg)} · {t.card.requester}: {(r.requester as unknown as Named)?.display_name ?? "—"} · {fmt(r.created_at)}
                      </p>
                    </div>

                    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                      <dt className="text-muted">{t.card.field}</dt>
                      <dd className="font-bold">{fieldLabel(r.field)}</dd>
                      {field !== "other" && (
                        <>
                          <dt className="text-muted">{t.card.current}</dt>
                          <dd className="break-all">{current || t.card.none}</dd>
                          <dt className="text-muted">{t.card.proposed}</dt>
                          <dd className="break-all rounded-sm bg-brand-soft px-2 py-1 font-bold text-brand">{field === "closure" ? choiceLabel(r.value ?? "") : r.value}</dd>
                        </>
                      )}
                      {r.note && (
                        <>
                          <dt className="text-muted">{t.card.note}</dt>
                          <dd className="whitespace-pre-line break-words">{r.note}</dd>
                        </>
                      )}
                    </dl>

                    <form action={decideEdit} className="space-y-3">
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="requestId" value={r.id} />
                      <input
                        name="reason"
                        maxLength={200}
                        placeholder={t.card.reasonPlaceholder}
                        className="min-h-12 w-full rounded-sm border border-border bg-white px-3.5 text-sm outline-none focus:border-focus"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button name="decision" value="approve" className="min-h-12 rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong">
                          {field === "other" ? t.card.approveOther : field === "closure" ? t.card.approveClosure : t.card.approve}
                        </button>
                        <button name="decision" value="reject" className="min-h-12 rounded-sm border border-error bg-white px-5 py-3 text-sm font-bold text-error hover:bg-error-soft">
                          {t.card.reject}
                        </button>
                      </div>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-bold leading-snug md:text-[28px]">{t.recent.title}</h2>
          {(done ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t.recent.empty}</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {(done ?? []).map((r) => {
                const hospital = r.hospitals as unknown as Hospital;
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold">
                        {hospital?.name ?? "—"} · {fieldLabel(r.field)}
                      </p>
                      {r.value && <p className="break-all text-xs text-muted">{r.field === "closure" ? choiceLabel(r.value) : r.value}</p>}
                      <p className="text-xs text-muted">
                        {(r.requester as unknown as Named)?.display_name ?? "—"} · {t.recent.by} {(r.resolver as unknown as Named)?.display_name ?? "—"} · {fmt(r.resolved_at as string)}
                        {r.reject_reason && ` · ${r.reject_reason}`}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.status === "approved" ? "bg-brand-soft text-brand" : "bg-error-soft text-error"}`}>
                      {r.status === "approved" ? (r.field === "other" ? t.card.approveOther : t.recent.approved) : t.recent.rejected}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Closed or moved */}
        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold leading-snug md:text-[28px]">{t.closedTitle}</h2>
            <p className="text-sm text-muted">{t.closedSubtitle}</p>
          </div>
          {(closed ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t.closedEmpty}</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {(closed ?? []).map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-bold">
                      <Link href={`/${lang}/hospitals/${h.id}`} className="hover:text-brand">
                        {h.name}
                      </Link>{" "}
                      <span className="font-normal text-muted">· {regionLabel(h.sido, h.sgg)}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {choiceLabel(h.closed_reason ?? "")} · {fmt(h.closed_at as string)}
                      {h.closed_note && ` · ${h.closed_note}`}
                    </p>
                  </div>
                  <form action={reopenHospital}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="hospitalId" value={h.id} />
                    <button className="min-h-10 rounded-sm border border-border bg-white px-4 text-xs font-bold text-brand hover:bg-brand-soft">{t.reopen}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex items-start gap-3 rounded-[12px] bg-brand-soft p-5">
          <Info className="size-5 shrink-0 text-brand" aria-hidden />
          <p className="text-xs leading-relaxed text-muted">{t.note}</p>
        </div>
      </Container>
    </>
  );
}
