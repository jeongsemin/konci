"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { BODY_MAX, FEEDBACK_CATEGORIES, TITLE_MAX } from "@/lib/feedback-input";
import { submitFeedback, type FeedbackState } from "./actions";

type Text = {
  open: string;
  category: string;
  categories: Record<(typeof FEEDBACK_CATEGORIES)[number], string>;
  title: string;
  titlePlaceholder: string;
  body: string;
  bodyPlaceholder: string;
  bodyHelp: string;
  submit: string;
  submitting: string;
  done: string;
  publicNote: string;
  errors: Record<"invalid" | "suspended" | "limit" | "notLoggedIn" | "generic", string>;
};

export function FeedbackForm({ lang, text }: { lang: string; text: Text }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(submitFeedback, null);
  const formRef = useRef<HTMLFormElement>(null);

  // <form action> would reset the form after an error and wipe what the member typed,
  // so submit by hand and clear the fields only once the post went through.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <details className="rounded-md border border-border bg-card p-5" open={Boolean(state)}>
      <summary className="min-h-6 cursor-pointer text-sm font-bold text-brand">{text.open}</summary>
      <form ref={formRef} onSubmit={submit} className="mt-5 space-y-5">
        <input type="hidden" name="lang" value={lang} />

        <fieldset className="space-y-2.5">
          <legend className="text-[13px] font-bold">{text.category}</legend>
          <div className="flex flex-wrap gap-x-5">
            {FEEDBACK_CATEGORIES.map((c, i) => (
              <label key={c} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
                <input type="radio" name="category" value={c} required defaultChecked={i === 1} className="size-4 accent-brand" />
                {text.categories[c]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-2">
          <span className="text-[13px] font-bold">{text.title}</span>
          <input
            name="title"
            required
            maxLength={TITLE_MAX}
            placeholder={text.titlePlaceholder}
            className="min-h-[52px] w-full rounded-sm border border-border bg-white p-3.5 text-sm outline-none focus:border-focus"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[13px] font-bold">{text.body}</span>
          <textarea
            name="body"
            rows={5}
            required
            maxLength={BODY_MAX}
            placeholder={text.bodyPlaceholder}
            className="w-full rounded-sm border border-border bg-white p-3.5 text-sm outline-none focus:border-focus"
          />
          <span className="block text-xs text-muted">{text.bodyHelp}</span>
        </label>

        <p className="text-xs text-muted">{text.publicNote}</p>

        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="min-h-12 rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-60">
            {pending ? text.submitting : text.submit}
          </button>
          {state?.ok && (
            <p role="status" className="text-sm font-bold text-brand">
              {text.done}
            </p>
          )}
          {state?.error && (
            <p role="alert" className="text-xs text-error">
              {text.errors[state.error]}
            </p>
          )}
        </div>
      </form>
    </details>
  );
}
