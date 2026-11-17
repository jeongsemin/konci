"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * The submit button of the save form. While the request runs it is disabled and shows a spinner
 * instead of its icon, so a tap gets an answer at once and is not sent twice.
 */
export function SaveSubmit({
  className,
  pressed,
  icon,
  children,
}: {
  className: string;
  pressed?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-pressed={pressed}
      aria-busy={pending || undefined}
      disabled={pending}
      className={`${className} ${pending ? "cursor-wait opacity-70" : ""}`}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
