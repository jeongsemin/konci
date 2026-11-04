import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireProfile } from "@/lib/auth";
import { MAX_MANAGERS, hasRoomForManager } from "@/lib/manager-input";
import { regionLabel } from "@/lib/region";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/container";
import { decideManager, revokeManager } from "../actions";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

type Hospital = { id: string; name: string; sido: string | null; sgg: string | null; phone: string | null } | null;
type Named = { display_name: string | null } | null;

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/managers">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata({ lang, path: "/admin/managers", title: dict.admin.managers.title, noindex: true });
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

export default async function ManagersPage({ params }: PageProps<"/[lang]/admin/managers">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, `/${lang}/admin/managers`);
  if (!profile.is_admin) notFound();
  const dict = await getDictionary(lang);
  const t = dict.admin.managers;

  const admin = createAdminClient();
  // The table points at profiles twice (applicant, decider), so each embed names its foreign key.
  const base = "id, hospital_id, position, contact, proof_path, status, reject_reason, created_at, decided_at, hospitals(id, name, sido, sgg, phone)";
  const applicant = "applicant:profiles!hospital_managers_user_id_fkey(id, display_name)";
  const [{ data: pending }, { data: active }, { data: past }] = await Promise.all([
    admin.from("hospital_managers").select(`${base}, ${applicant}`).eq("status", "pending").order("created_at").limit(50),
    admin.from("hospital_managers").select(`${base}, ${applicant}`).eq("status", "active").order("decided_at", { ascending: false }).limit(100),
    admin.from("hospital_managers").select(`${base}, ${applicant}`).in("status", ["rejected", "revoked"]).order("decided_at", { ascending: false }).limit(10),
  ]);

  // How many active managers each hospital in the queue already has.
  const activeCount = new Map<string, number>();
  for (const a of active ?? []) activeCount.set(a.hospital_id, (activeCount.get(a.hospital_id) ?? 0) + 1);

  // Emails live in auth.users, so they come from the auth admin API (a handful of people at most).
  const emails = new Map<string, string | null>();
  await Promise.all(
    [...new Set((pending ?? []).map((p) => (p.applicant as unknown as { id: string } | null)?.id).filter(Boolean) as string[])].map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      emails.set(id, data.user?.email ?? null);
    }),
  );

  // Proofs are private: a link that works for a few minutes.
  const proofUrls = new Map<string, string | null>();
  await Promise.all(
    (pending ?? []).map(async (p) => {
      const { data } = await admin.storage.from("manager-proofs").createSignedUrl(p.proof_path, 300);
      proofUrls.set(p.id, data?.signedUrl ?? null);
    }),
  );

  const fmt = (iso: string) => new Date(iso).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" });
  const nameOf = (a: unknown) => (a as Named)?.display_name ?? "—";

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
        {/* Waiting */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold leading-snug md:text-[28px]">{t.queueTitle}</h2>
            <p className="text-sm text-muted">
              {t.open}: <strong className="text-star">{(pending ?? []).length}</strong>
            </p>
          </div>

          {(pending ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t.empty}</p>
          ) : (
            <ul className="space-y-5">
              {(pending ?? []).map((p) => {
                const hospital = p.hospitals as unknown as Hospital;
                const who = p.applicant as unknown as { id: string; display_name: string | null } | null;
                const url = proofUrls.get(p.id);
                const isPdf = p.proof_path.endsWith(".pdf");
                const room = hasRoomForManager(activeCount.get(p.hospital_id) ?? 0);
                return (
                  <li key={p.id} className="grid gap-6 rounded-md border border-border bg-card p-5 md:grid-cols-[240px_1fr] md:p-6">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block space-y-2">
                        {isPdf ? (
                          <span className="flex h-24 items-center justify-center rounded-sm border border-border bg-surface text-sm font-bold text-brand">PDF</span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="" className="max-h-[300px] w-full rounded-sm border border-border bg-surface object-contain" />
                        )}
                        <span className="text-xs text-brand hover:underline">{t.card.viewProof}</span>
                      </a>
                    ) : (
                      <div className="rounded-sm bg-surface p-4 text-xs text-muted">{t.card.noProof}</div>
                    )}

                    <div className="min-w-0 space-y-4">
                      <div className="space-y-1">
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
                          {regionLabel(hospital?.sido, hospital?.sgg)} · {fmt(p.created_at)}
                        </p>
                      </div>

                      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                        <dt className="text-muted">{t.card.applicant}</dt>
                        <dd className="break-all font-bold">
                          {who?.display_name ?? "—"} · {who ? emails.get(who.id) ?? "—" : "—"}
                        </dd>
                        <dt className="text-muted">{t.card.position}</dt>
                        <dd className="break-words">{p.position}</dd>
                        <dt className="text-muted">{t.card.contact}</dt>
                        <dd className="break-words">{p.contact}</dd>
                        <dt className="text-muted">{t.card.registeredPhone}</dt>
                        <dd className="break-all">{hospital?.phone ?? t.card.none}</dd>
                        <dt className="text-muted">{t.card.managers}</dt>
                        <dd>{fill(t.card.managersCount, { n: activeCount.get(p.hospital_id) ?? 0, max: MAX_MANAGERS })}</dd>
                      </dl>

                      <form action={decideManager} className="space-y-3">
                        <input type="hidden" name="lang" value={lang} />
                        <input type="hidden" name="managerId" value={p.id} />
                        <input
                          name="reason"
                          maxLength={200}
                          placeholder={t.card.reasonPlaceholder}
                          className="min-h-12 w-full rounded-sm border border-border bg-white px-3.5 text-sm outline-none focus:border-focus"
                        />
                        {!room && <p className="text-xs text-error">{t.card.full}</p>}
                        <div className="flex flex-wrap gap-3">
                          <button
                            name="decision"
                            value="approve"
                            disabled={!room}
                            className="min-h-12 rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t.card.approve}
                          </button>
                          <button name="decision" value="reject" className="min-h-12 rounded-sm border border-error bg-white px-5 py-3 text-sm font-bold text-error hover:bg-error-soft">
                            {t.card.reject}
                          </button>
                        </div>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Current managers */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold leading-snug md:text-[28px]">{t.activeTitle}</h2>
          {(active ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t.activeEmpty}</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {(active ?? []).map((a) => {
                const hospital = a.hospitals as unknown as Hospital;
                return (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold">
                        {hospital?.name ?? "—"} <span className="font-normal text-muted">· {regionLabel(hospital?.sido, hospital?.sgg)}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {nameOf(a.applicant)} · {a.position}
                        {a.decided_at && ` · ${fmt(a.decided_at)}`}
                      </p>
                    </div>
                    <form
                      action={revokeManager}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="managerId" value={a.id} />
                      <input
                        name="reason"
                        maxLength={200}
                        placeholder={t.revokeReason}
                        className="min-h-10 rounded-sm border border-border bg-white px-3 text-xs outline-none focus:border-focus"
                      />
                      <button className="min-h-10 rounded-sm border border-error bg-white px-4 text-xs font-bold text-error hover:bg-error-soft">{t.revoke}</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Past decisions */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold leading-snug md:text-[28px]">{t.recent.title}</h2>
          {(past ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t.recent.empty}</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {(past ?? []).map((r) => {
                const hospital = r.hospitals as unknown as Hospital;
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold">{hospital?.name ?? "—"}</p>
                      <p className="text-xs text-muted">
                        {nameOf(r.applicant)} · {r.position}
                        {r.decided_at && ` · ${fmt(r.decided_at)}`}
                        {r.reject_reason && ` · ${r.reject_reason}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-error-soft px-3 py-1 text-xs font-bold text-error">{r.status === "revoked" ? t.recent.revoked : t.recent.rejected}</span>
                  </li>
                );
              })}
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
