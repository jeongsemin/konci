import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireProfile } from "@/lib/auth";
import { fieldsFor, isEditField } from "@/lib/edit-request";
import { categoryLine } from "@/lib/region";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/container";
import { EditForm } from "./edit-form";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/[lang]/hospitals/[id]/edit">): Promise<Metadata> {
  const { lang, id } = await params;
  if (!hasLocale(lang) || !UUID.test(id)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata({ lang, path: `/hospitals/${id}/edit`, title: dict.edit.title, noindex: true });
}

export default async function EditRequestPage({ params }: PageProps<"/[lang]/hospitals/[id]/edit">) {
  const { lang, id } = await params;
  if (!hasLocale(lang) || !UUID.test(id)) notFound();
  const profile = await requireProfile(lang, `/${lang}/hospitals/${id}/edit`);
  const dict = await getDictionary(lang);
  const t = dict.edit;
  const supabase = await createClient();

  const { data: hospital } = await supabase
    .from("hospitals")
    .select("id, name, category, sido, sgg, road_address, address, phone, homepage, name_en, name_ja, name_zh, hours_note")
    .eq("id", id)
    .maybeSingle();
  if (!hospital) notFound();

  // RLS: a member sees only their own assignments, so this says whether *they* manage this hospital.
  const { data: manager } = await supabase
    .from("hospital_managers")
    .select("id")
    .eq("hospital_id", id)
    .eq("user_id", profile.id)
    .eq("status", "active")
    .maybeSingle();
  const isManager = Boolean(manager);

  // RLS: a member sees only their own requests.
  const { data: mine } = await supabase
    .from("hospital_edit_requests")
    .select("id, field, value, status, reject_reason, created_at")
    .eq("hospital_id", id)
    .eq("requester_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const kind = categoryLine(hospital.category, hospital.sido, hospital.sgg);
  const formText = {
    field: t.field,
    fields: t.fields,
    current: t.current,
    empty: t.empty,
    value: t.value,
    placeholders: t.placeholders,
    note: t.note,
    noteOther: t.noteOther,
    noteHelp: t.noteHelp,
    submit: t.submit,
    submitting: t.submitting,
    done: t.done,
    another: t.another,
    errors: t.errors,
  };

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
        {isManager && (
          <p role="status" className="rounded-md bg-brand-soft p-4 text-xs font-bold leading-relaxed text-brand">
            {t.managerNotice}
          </p>
        )}
        <EditForm
          lang={lang}
          hospitalId={id}
          fields={fieldsFor(isManager)}
          current={{
            phone: hospital.phone,
            homepage: hospital.homepage,
            name_en: hospital.name_en,
            name_ja: hospital.name_ja,
            name_zh: hospital.name_zh,
            hours_note: hospital.hours_note,
          }}
          text={formText}
        />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold leading-snug">{t.mine}</h2>
          {(mine ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t.mineEmpty}</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {(mine ?? []).map((r) => (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-bold">{isEditField(r.field) ? t.fields[r.field] : r.field}</p>
                    {r.value && <p className="break-all text-xs text-muted">{r.value}</p>}
                    <p className="text-[11px] text-muted">{new Date(r.created_at).toLocaleDateString(lang)}</p>
                    {r.status === "rejected" && r.reject_reason && (
                      <p className="text-xs text-error">
                        {t.reason}: {r.reject_reason}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      r.status === "approved" ? "bg-brand-soft text-brand" : r.status === "rejected" ? "bg-error-soft text-error" : "bg-star-soft text-star"
                    }`}
                  >
                    {r.field === "other" && r.status === "approved" ? t.status.handled : t.status[r.status as keyof typeof t.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex items-start gap-3 rounded-[12px] bg-brand-soft p-5">
          <Info className="size-5 shrink-0 text-brand" aria-hidden />
          <p className="text-xs leading-relaxed text-muted">{t.note2}</p>
        </div>
      </Container>
    </>
  );
}
