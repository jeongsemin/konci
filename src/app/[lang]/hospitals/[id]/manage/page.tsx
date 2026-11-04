import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireProfile } from "@/lib/auth";
import { categoryLine } from "@/lib/region";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/container";
import { ManageForm } from "./manage-form";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-star-soft text-star",
  active: "bg-brand-soft text-brand",
  rejected: "bg-error-soft text-error",
  revoked: "bg-error-soft text-error",
};

export async function generateMetadata({ params }: PageProps<"/[lang]/hospitals/[id]/manage">): Promise<Metadata> {
  const { lang, id } = await params;
  if (!hasLocale(lang) || !UUID.test(id)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata({ lang, path: `/hospitals/${id}/manage`, title: dict.manager.title, noindex: true });
}

export default async function ManagePage({ params }: PageProps<"/[lang]/hospitals/[id]/manage">) {
  const { lang, id } = await params;
  if (!hasLocale(lang) || !UUID.test(id)) notFound();
  const profile = await requireProfile(lang, `/${lang}/hospitals/${id}/manage`);
  const dict = await getDictionary(lang);
  const t = dict.manager;
  const supabase = await createClient();

  const { data: hospital } = await supabase
    .from("hospitals")
    .select("id, name, category, sido, sgg, road_address, address")
    .eq("id", id)
    .maybeSingle();
  if (!hospital) notFound();

  // RLS: a member sees only their own applications.
  const { data: mine } = await supabase
    .from("hospital_managers")
    .select("id, position, status, reject_reason, created_at")
    .eq("hospital_id", id)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const live = (mine ?? []).find((m) => m.status === "pending" || m.status === "active");
  const kind = categoryLine(hospital.category, hospital.sido, hospital.sgg);

  return (
    <>
      <section className="pb-9 pt-8">
        <Container className="space-y-4">
          <Link href={`/${lang}/hospitals/${id}`} className="inline-block text-sm font-bold text-brand hover:underline">
            ← {t.back}
          </Link>
          <h1 className="text-3xl font-bold leading-snug md:text-[36px]">{t.title}</h1>
          <p className="max-w-3xl text-sm text-muted">{t.subtitle}</p>
          <div className="space-y-1 rounded-md border border-border bg-card p-5">
            {kind && <p className="text-[11px] font-bold text-brand">{kind}</p>}
            <p className="text-[19px] font-bold">{hospital.name}</p>
            <p className="text-xs text-muted">{hospital.road_address || hospital.address}</p>
          </div>
        </Container>
      </section>

      <Container className="max-w-3xl space-y-10 pb-16">
        {live?.status === "active" ? (
          <div role="status" className="space-y-3 rounded-md bg-brand-soft p-5">
            <p className="text-sm font-bold text-brand">{t.activeNotice}</p>
            <Link
              href={`/${lang}/hospitals/${id}/edit`}
              className="inline-flex min-h-12 items-center rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong"
            >
              {t.goEdit}
            </Link>
          </div>
        ) : live ? (
          <p role="status" className="rounded-md bg-star-soft p-5 text-sm font-bold text-star">
            {t.pendingNotice}
          </p>
        ) : (
          <ManageForm
            hospitalId={id}
            text={{
              position: t.position,
              positionHelp: t.positionHelp,
              contact: t.contact,
              contactHelp: t.contactHelp,
              proof: t.proof,
              proofHelp: t.proofHelp,
              submit: t.submit,
              submitting: t.submitting,
              done: t.done,
              errors: t.errors,
            }}
          />
        )}

        <section className="space-y-4">
          <h2 className="text-2xl font-bold leading-snug">{t.mine}</h2>
          {(mine ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t.mineEmpty}</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {(mine ?? []).map((m) => (
                <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-bold">{m.position}</p>
                    <p className="text-[11px] text-muted">{new Date(m.created_at).toLocaleDateString(lang)}</p>
                    {(m.status === "rejected" || m.status === "revoked") && m.reject_reason && (
                      <p className="text-xs text-error">
                        {t.reason}: {m.reject_reason}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[m.status] ?? ""}`}>
                    {t.status[m.status as keyof typeof t.status]}
                  </span>
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
