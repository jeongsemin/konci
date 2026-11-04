/** Short area label such as "서울 강남구", so branches sharing a name can be told apart at a glance. */
export function regionLabel(sido: string | null | undefined, sgg: string | null | undefined): string | null {
  const label = [sido, sgg]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
  return label || null;
}

/** The English, Japanese and Chinese names that exist, as "Abijou · アビジュ": null when there are none. */
export function namesLine(h: { name_en?: string | null; name_ja?: string | null; name_zh?: string | null }): string | null {
  const line = [h.name_en, h.name_ja, h.name_zh]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" · ");
  return line || null;
}

/** "의원 · 서울 강남구": the parts that exist, joined; null when there are none. */
export function categoryLine(category: string | null | undefined, sido: string | null | undefined, sgg: string | null | undefined): string | null {
  const line = [category?.trim(), regionLabel(sido, sgg)].filter(Boolean).join(" · ");
  return line || null;
}
