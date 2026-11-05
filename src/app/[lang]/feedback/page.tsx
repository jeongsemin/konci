import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getProfile } from "@/lib/auth";
import {
  FEEDBACK_STATUSES,
  isFeedbackStatus,
  type FeedbackStatus,
} from "@/lib/feedback-input";
import { pageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/container";
import { deleteFeedback, removeFeedback, replyFeedback } from "./actions";
import { DeleteButton } from "./delete-button";
import { FeedbackForm } from "./feedback-form";
import type { Metadata } from "next";

type Post = {
  id: string;
  user_id: string;
  category: "bug" | "inconvenience" | "idea" | "other";
  title: string;
  body: string;
  status: FeedbackStatus;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
};

const PAGE_SIZE = 50;

const statusTone: Record<FeedbackStatus, string> = {
  open: "bg-surface text-muted",
  reviewing: "bg-star-soft text-star",
  done: "bg-brand-soft text-brand",
  declined: "bg-error-soft text-error",
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/feedback">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata({
    lang,
    path: "/feedback",
    title: dict.feedback.title,
    description: dict.feedback.subtitle,
    noindex: true,
  });
}

export default async function FeedbackPage({
  params,
  searchParams,
}: PageProps<"/[lang]/feedback">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { status: statusParam } = await searchParams;
  const filter =
    typeof statusParam === "string" && isFeedbackStatus(statusParam)
      ? statusParam
      : null;

  const dict = await getDictionary(lang);
  const t = dict.feedback;
  const profile = await getProfile();

  // Suggestions are private: the database only returns the member's own posts (all of them for an
  // administrator), and a visitor who is not signed in gets no list at all.
  const supabase = await createClient();
  let query = supabase
    .from("feedback_posts")
    .select(
      "id, user_id, category, title, body, status, admin_reply, replied_at, created_at, profiles(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (filter) query = query.eq("status", filter);
  const { data } = profile ? await query : { data: [] };
  const posts = (data ?? []) as unknown as Post[];

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(lang, { dateStyle: "medium" });
  const chips: { key: string; label: string; href: string; active: boolean }[] =
    [
      {
        key: "all",
        label: t.filterAll,
        href: `/${lang}/feedback`,
        active: filter === null,
      },
      ...FEEDBACK_STATUSES.map((s) => ({
        key: s,
        label: t.statuses[s],
        href: `/${lang}/feedback?status=${s}`,
        active: filter === s,
      })),
    ];

  return (
    <>
      <section className="pb-9 pt-8">
        <Container className="space-y-4">
          <h1 className="text-3xl font-bold leading-snug md:text-[36px]">
            {t.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted">{t.subtitle}</p>
        </Container>
      </section>

      <Container className="space-y-8 pb-16">
        {profile ? (
          <FeedbackForm
            lang={lang}
            text={{
              ...t.form,
              categories: t.categories,
              publicNote: t.publicNote,
            }}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card p-5">
            <p className="text-sm text-muted">{t.loginPrompt}</p>
            <Link
              href={`/${lang}/login?next=${encodeURIComponent(`/${lang}/feedback`)}`}
              className="flex min-h-12 items-center justify-center rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong"
            >
              {t.loginButton}
            </Link>
          </div>
        )}

        {profile && (
          <nav aria-label={t.title} className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <Link
                key={c.key}
                href={c.href}
                aria-current={c.active ? "page" : undefined}
                className={`flex min-h-10 items-center rounded-full px-4 text-sm font-bold ${c.active ? "bg-brand text-white" : "border border-border bg-card text-muted hover:text-foreground"}`}
              >
                {c.label}
              </Link>
            ))}
          </nav>
        )}

        {!profile ? null : posts.length === 0 ? (
          <p className="text-sm text-muted">
            {profile.is_admin ? t.emptyAdmin : t.empty}
          </p>
        ) : (
          <ul className="space-y-4">
            {posts.map((p) => {
              const mine = profile?.id === p.user_id;
              return (
                <li
                  key={p.id}
                  className="space-y-4 rounded-md border border-border bg-card p-5 md:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[p.status]}`}
                    >
                      {t.statuses[p.status]}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                      {t.categories[p.category]}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="break-words text-[19px] font-bold leading-snug">
                      {p.title}
                    </h2>
                    <p className="text-xs text-muted">
                      {p.profiles?.display_name ?? "—"} · {fmt(p.created_at)}
                    </p>
                  </div>
                  <p className="whitespace-pre-line break-words text-sm leading-relaxed">
                    {p.body}
                  </p>

                  {p.admin_reply && (
                    <div className="space-y-1.5 rounded-sm bg-brand-soft p-4">
                      <p className="text-xs font-bold text-brand">
                        {t.reply}
                        {p.replied_at && (
                          <span className="ml-2 font-normal text-muted">
                            {fmt(p.replied_at)}
                          </span>
                        )}
                      </p>
                      <p className="whitespace-pre-line break-words text-sm leading-relaxed">
                        {p.admin_reply}
                      </p>
                    </div>
                  )}

                  {profile?.is_admin ? (
                    <form
                      action={replyFeedback}
                      className="space-y-3 rounded-sm border border-dashed border-border p-4"
                    >
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="postId" value={p.id} />
                      <label className="flex flex-wrap items-center gap-3 text-xs font-bold">
                        {t.admin.status}
                        <select
                          name="status"
                          defaultValue={p.status}
                          className="min-h-10 rounded-sm border border-border bg-white px-3 text-sm font-normal"
                        >
                          {FEEDBACK_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {t.statuses[s]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <textarea
                        name="reply"
                        rows={3}
                        maxLength={1000}
                        defaultValue={p.admin_reply ?? ""}
                        aria-label={t.admin.reply}
                        placeholder={t.admin.replyPlaceholder}
                        className="w-full rounded-sm border border-border bg-white p-3 text-sm outline-none focus:border-focus"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button className="min-h-11 rounded-sm bg-brand px-5 text-sm font-bold text-white hover:bg-brand-strong">
                          {t.admin.save}
                        </button>
                        <button
                          formAction={removeFeedback}
                          className="min-h-11 rounded-sm border border-error bg-white px-5 text-sm font-bold text-error hover:bg-error-soft"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </form>
                  ) : (
                    mine && (
                      <form action={deleteFeedback}>
                        <input type="hidden" name="lang" value={lang} />
                        <input type="hidden" name="postId" value={p.id} />
                        <DeleteButton
                          label={t.delete}
                          confirmText={t.deleteConfirm}
                        />
                      </form>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
