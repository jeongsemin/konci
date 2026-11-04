"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { NOTE_MAX, type EditField } from "@/lib/edit-request";
import { submitEditRequest, type EditState } from "./actions";

type Text = {
  field: string;
  fields: Record<EditField, string>;
  current: string;
  empty: string;
  value: string;
  placeholders: Record<Exclude<EditField, "other">, string>;
  note: string;
  noteOther: string;
  noteHelp: string;
  submit: string;
  submitting: string;
  done: string;
  another: string;
  errors: Record<"invalid" | "same" | "duplicate" | "suspended" | "limit" | "notLoggedIn" | "generic", string>;
};

type Props = {
  lang: string;
  hospitalId: string;
  /** The fields offered: a hospital's manager gets more than other members. */
  fields: EditField[];
  current: Record<Exclude<EditField, "other">, string | null>;
  text: Text;
};

/** "Send another" mounts a fresh form, which also clears the previous result. */
export function EditForm(props: Props) {
  const [round, setRound] = useState(0);
  return <Form key={round} {...props} onAnother={() => setRound((n) => n + 1)} />;
}

function Form({ lang, hospitalId, fields, current, text, onAnother }: Props & { onAnother: () => void }) {
  const [state, action, pending] = useActionState<EditState, FormData>(submitEditRequest, null);
  const [field, setField] = useState<EditField>(fields[0]);
  // <form action> would reset the form after an error and wipe what the member typed.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  if (state?.ok) {
    return (
      <div role="status" className="space-y-4 rounded-md bg-brand-soft p-5">
        <p className="text-sm font-bold text-brand">{text.done}</p>
        <button
          type="button"
          onClick={onAnother}
          className="min-h-12 rounded-sm border border-brand bg-white px-5 py-3 text-sm font-bold text-brand hover:bg-brand-soft"
        >
          {text.another}
        </button>
      </div>
    );
  }

  const shown = field === "other" ? null : current[field];

  return (
    <form onSubmit={submit} className="space-y-5 rounded-md border border-border bg-card p-5 md:p-6">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="hospitalId" value={hospitalId} />

      <fieldset className="space-y-2.5">
        <legend className="text-[13px] font-bold">{text.field}</legend>
        {fields.map((f) => (
          <label key={f} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="radio" name="field" value={f} checked={field === f} onChange={() => setField(f)} className="size-4 accent-brand" />
            {text.fields[f]}
          </label>
        ))}
      </fieldset>

      {field !== "other" && (
        <>
          <p className="rounded-sm bg-surface p-3 text-xs text-muted">
            {text.current}: <span className="break-all font-bold text-foreground">{shown || text.empty}</span>
          </p>
          <label className="block space-y-2">
            <span className="text-[13px] font-bold">{text.value}</span>
            <input
              key={field}
              name="value"
              required
              maxLength={200}
              placeholder={text.placeholders[field]}
              className="min-h-[52px] w-full rounded-sm border border-border bg-white p-3.5 text-sm outline-none focus:border-focus"
            />
          </label>
        </>
      )}

      <label className="block space-y-2">
        <span className="text-[13px] font-bold">{field === "other" ? text.noteOther : text.note}</span>
        <textarea
          name="note"
          rows={3}
          maxLength={NOTE_MAX}
          required={field === "other"}
          className="w-full rounded-sm border border-border bg-white p-3.5 text-sm outline-none focus:border-focus"
        />
        <span className="block text-xs text-muted">{text.noteHelp}</span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="min-h-12 rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-60">
          {pending ? text.submitting : text.submit}
        </button>
        {state?.error && (
          <p role="alert" className="text-xs text-error">
            {text.errors[state.error]}
          </p>
        )}
      </div>
    </form>
  );
}
