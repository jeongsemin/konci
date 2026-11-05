"use client";

export function DeleteButton({ label, confirmText }: { label: string; confirmText: string }) {
  return (
    <button
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className="min-h-11 text-sm font-bold text-error hover:underline"
    >
      {label}
    </button>
  );
}
