import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Info, MapPin, SlidersHorizontal, Square, SquareCheck, X } from "lucide-react";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { searchHospitals, type SearchResult } from "@/lib/hospital-search";
import { categoryLine, namesLine, regionLabel } from "@/lib/region";
import {
  PAGE_SIZE,
  aggregateReviews,
  areaSpec,
  composeQuery,
  displayQuery,
  pageWindow,
  parseParams,
  toQueryString,
  toggleCompare,
  type CompareStats,
  type Filters,
  type ReviewRow,
} from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/container";
import { SearchForm } from "@/components/search-form";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

type CompareHospital = { id: string; name: string; region: string | null; address: string; stats: CompareStats };

async function loadCompare(ids: string[]): Promise<CompareHospital[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const [{ data: hospitals }, { data: reviews }] = await Promise.all([
    supabase.from("hospitals").select("id, name, road_address, address, sido, sgg").in("id", ids),
    supabase
      .from("reviews")
      .select("hospital_id, rating, english_support, interpreter_available, director_consultation, price_explained, no_upselling")
      .in("hospital_id", ids),
  ]);
  return ids.flatMap((id) => {
    const h = hospitals?.find((x) => x.id === id);
    if (!h) return [];
    const rows = ((reviews ?? []) as ReviewRow[]).filter((r) => r.hospital_id === id);
    return [{ id, name: h.name, region: regionLabel(h.sido, h.sgg), address: h.road_address || h.address || "", stats: aggregateReviews(rows) }];
  });
}

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/search">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const phrase = displayQuery(parseParams(await searchParams));
  return pageMetadata({
    lang,
    path: "/search",
    title: phrase ? fill(dict.search.title, { q: phrase }) : dict.search.titleEmpty,
    description: dict.search.subtitle,
    noindex: true,
    follow: true,
  });
}

export default async function SearchPage({ params, searchParams }: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.search;
  const f = parseParams(await searchParams);

  const { query, type } = composeQuery(f);
  const searched = Boolean(query || areaSpec(f.area));
  const outcome = searched
    ? await searchHospitals({ q: query, type, area: f.area, rating: f.rating, reviews: f.reviews, english: f.english, director: f.director, sort: f.sort, page: f.page })
    : { results: [] as SearchResult[], total: 0, page: 1, error: undefined };
  const results = outcome.results;
  const totalPages = Math.max(1, Math.ceil(outcome.total / PAGE_SIZE));
  const compare = await loadCompare(f.compare);

  // Changing a filter or the sort goes back to page 1; the compare links and the pager keep where you are.
  const href = (patch: Partial<Filters>) => `/${lang}/search${toQueryString({ ...f, page: 1, ...patch })}`;
  const reset: Partial<Filters> = { area: "", treatment: "", rating: 0, reviews: 0, english: false, director: false };

  const label = (items: { name: string; q: string }[], q: string) => items.find((i) => i.q === q)?.name ?? q;
  const phrase = displayQuery(f, label(dict.home.areas.items, f.area));
  const chips: { key: string; text: string; patch: Partial<Filters> }[] = [
    f.area && { key: "area", text: label(dict.home.areas.items, f.area), patch: { area: "" } },
    f.treatment && { key: "treatment", text: label(dict.home.treatments.items, f.treatment), patch: { treatment: "" } },
    f.q && { key: "q", text: f.q, patch: { q: "" } },
    f.rating && { key: "rating", text: fill(t.chips.rating, { n: (f.rating / 10).toFixed(1) }), patch: { rating: 0 } },
    f.reviews && { key: "reviews", text: fill(t.chips.reviews, { n: f.reviews }), patch: { reviews: 0 } },
    f.english && { key: "english", text: t.chips.english, patch: { english: false } },
    f.director && { key: "director", text: t.chips.director, patch: { director: false } },
  ].filter(Boolean) as { key: string; text: string; patch: Partial<Filters> }[];

  const keep: Record<string, string> = {};
  if (f.area) keep.area = f.area;
  if (f.treatment) keep.treatment = f.treatment;
  if (f.rating) keep.rating = String(f.rating);
  if (f.reviews) keep.reviews = String(f.reviews);
  if (f.english) keep.english = "1";
  if (f.director) keep.director = "1";

  return (
    <>
      {/* Search context */}
      <section className="bg-white pb-7 pt-8">
        <Container className="space-y-5">
          <p className="whitespace-pre text-[11px] text-muted">{t.breadcrumb}</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold leading-snug md:text-[30px]">
              {phrase ? fill(t.title, { q: phrase }) : t.titleEmpty}
            </h1>
            <p className="text-sm text-muted">{t.subtitle}</p>
          </div>
          {/* keyed by the current filters: uncontrolled inputs must remount to follow URL changes */}
          <SearchForm key={toQueryString(f)} lang={lang} dict={dict} q={f.q} keep={keep} showExtras={false} />
          {chips.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <li key={c.key}>
                  <Link
                    href={href(c.patch)}
                    className="flex min-h-10 items-center gap-1.5 rounded-full border border-brand bg-brand-soft px-3.5 py-2 text-[13px] font-bold text-brand"
                  >
                    {c.text}
                    <X className="size-[13px]" aria-label="remove" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={href(reset)} className="ml-1 text-xs text-brand hover:underline">
                  {t.resetAll}
                </Link>
              </li>
            </ul>
          )}
        </Container>
      </section>

      {/* Workspace */}
      <Container className="grid gap-6 py-8 lg:grid-cols-[200px_1fr] xl:grid-cols-[200px_1fr_280px]">
        <FilterSidebar key={toQueryString(f)} lang={lang} dict={dict} f={f} />

        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold">{fill(t.count, { n: outcome.total })}</p>
            <p className="flex items-center gap-3 text-xs text-muted">
              <span>{t.sortLabel}</span>
              {(["relevance", "rating", "reviews"] as const).map((s) => (
                <Link
                  key={s}
                  href={href({ sort: s })}
                  aria-current={f.sort === s}
                  className={f.sort === s ? "font-bold text-brand" : "hover:text-foreground"}
                >
                  {t.sorts[s]}
                </Link>
              ))}
            </p>
          </div>

          <div aria-live="polite" className="space-y-4">
            {!searched ? (
              <p className="text-sm text-muted">{t.prompt}</p>
            ) : outcome.results.length === 0 && outcome.error ? (
              <p className="text-sm text-error">{t.error}</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted">{t.empty}</p>
            ) : (
              <ul className="space-y-4">
                {results.map((r) => (
                  <ResultCard key={r.id} r={r} lang={lang} dict={dict} selected={f.compare.includes(r.id)} toggleHref={href({ compare: toggleCompare(f, r.id).compare, page: outcome.page })} />
                ))}
              </ul>
            )}
          </div>

          <Pager dict={dict} page={outcome.page} totalPages={totalPages} hrefFor={(p) => href({ page: p })} />

          {results.length > 0 && <p className="text-[11px] text-muted">{t.end}</p>}

          {compare.length >= 2 && (
            <ComparePanel
              lang={lang}
              dict={dict}
              items={compare}
              clearHref={href({ compare: [], page: outcome.page })}
              removeHref={(id) => href({ compare: f.compare.filter((x) => x !== id), page: outcome.page })}
            />
          )}
        </div>

        <aside className="space-y-5 lg:col-span-2 xl:col-span-1">
          <div className="space-y-4 rounded-md border border-border bg-card p-5">
            <p className="text-base font-bold">{fill(t.summary.title, { n: compare.length })}</p>
            {compare.length === 0 ? (
              <p className="text-xs text-muted">{t.summary.empty}</p>
            ) : (
              <ul className="space-y-1 text-[13px]">
                {compare.map((c) => (
                  <li key={c.id}>
                    {/* Unticking removes it from the selection, so the choice can be changed from here too. */}
                    <Link
                      href={href({ compare: f.compare.filter((x) => x !== c.id), page: outcome.page })}
                      scroll={false}
                      aria-pressed
                      className="flex min-h-8 items-center gap-2 hover:text-brand"
                    >
                      <SquareCheck className="size-4 shrink-0 text-brand" aria-hidden />
                      <span>
                        {c.name}
                        {c.region && <span className="text-muted"> · {c.region}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {compare.length === 1 ? (
              <p className="text-[11px] text-muted">{t.compareBox.needTwo}</p>
            ) : compare.length >= 2 ? (
              <>
                <p className="text-[11px] text-muted">{t.summary.hint}</p>
                <a href="#compare" className="flex min-h-12 items-center justify-center rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong">
                  {t.summary.button}
                </a>
              </>
            ) : null}
          </div>
          <Note title={t.notes.checkTitle} body={t.notes.checkBody} />
          <Note title={t.notes.rankTitle} body={t.notes.rankBody} />
        </aside>
      </Container>
    </>
  );
}

function Pager({ dict, page, totalPages, hrefFor }: { dict: Dictionary; page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const t = dict.search.pager;
  const box = "flex size-10 items-center justify-center rounded-sm border text-sm font-bold";
  const arrow = (target: number, enabled: boolean, text: string, icon: React.ReactNode) =>
    enabled ? (
      <Link href={hrefFor(target)} aria-label={text} className={`${box} border-border bg-card text-brand hover:border-brand`}>
        {icon}
      </Link>
    ) : (
      <span aria-hidden className={`${box} border-border bg-surface text-muted opacity-50`}>
        {icon}
      </span>
    );
  return (
    <nav aria-label={t.label} className="flex flex-wrap items-center justify-center gap-2">
      {arrow(page - 1, page > 1, t.prev, <ChevronLeft className="size-4" aria-hidden />)}
      {pageWindow(page, totalPages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${box} ${p === page ? "border-brand bg-brand text-white" : "border-border bg-card hover:border-brand"}`}
          >
            {p}
          </Link>
        ),
      )}
      {arrow(page + 1, page < totalPages, t.next, <ChevronRight className="size-4" aria-hidden />)}
    </nav>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] bg-brand-soft p-5">
      <Info className="size-5 shrink-0 text-brand" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-bold text-brand">{title}</p>
        <p className="text-xs leading-relaxed text-muted">{body}</p>
      </div>
    </div>
  );
}

function Option({ type, name, value, checked, children }: { type: "radio" | "checkbox"; name: string; value: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted has-[:checked]:text-brand">
      <input type={type} name={name} value={value} defaultChecked={checked} className="size-3.5 accent-brand" />
      {children}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 border-b border-border pb-5">
      <legend className="mb-3 text-sm font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

function FilterSidebar({ lang, dict, f }: { lang: Locale; dict: Dictionary; f: Filters }) {
  const t = dict.search;
  return (
    <form action={`/${lang}/search`} className="space-y-6 lg:w-[200px]">
      <input type="hidden" name="q" value={f.q} />
      <input type="hidden" name="sort" value={f.sort} />
      <input type="hidden" name="compare" value={f.compare.join(",")} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t.filters}</h2>
        <SlidersHorizontal className="size-5" aria-hidden />
      </div>

      <Group title={t.groups.area}>
        <Option type="radio" name="area" value="" checked={!f.area}>{t.any}</Option>
        {dict.home.areas.items.map((a) => (
          <Option key={a.q} type="radio" name="area" value={a.q} checked={f.area === a.q}>{a.name}</Option>
        ))}
      </Group>
      <Group title={t.groups.treatment}>
        <Option type="radio" name="treatment" value="" checked={!f.treatment}>{t.any}</Option>
        {dict.home.treatments.items.map((x) => (
          <Option key={x.q} type="radio" name="treatment" value={x.q} checked={f.treatment === x.q}>{x.name}</Option>
        ))}
      </Group>
      <Group title={t.groups.rating}>
        <Option type="radio" name="rating" value="0" checked={!f.rating}>{t.any}</Option>
        <Option type="radio" name="rating" value="45" checked={f.rating === 45}>{t.ratingOpts[0]}</Option>
        <Option type="radio" name="rating" value="40" checked={f.rating === 40}>{t.ratingOpts[1]}</Option>
      </Group>
      <Group title={t.groups.reviews}>
        <Option type="radio" name="reviews" value="0" checked={!f.reviews}>{t.any}</Option>
        {([10, 5, 1] as const).map((n, i) => (
          <Option key={n} type="radio" name="reviews" value={String(n)} checked={f.reviews === n}>{t.reviewOpts[i]}</Option>
        ))}
      </Group>
      <Group title={t.groups.support}>
        <Option type="checkbox" name="english" value="1" checked={f.english}>{t.supportOpts.english}</Option>
        <Option type="checkbox" name="director" value="1" checked={f.director}>{t.supportOpts.director}</Option>
      </Group>

      <button className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-sm bg-brand px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-strong">
        <Check className="size-4" aria-hidden />
        {t.apply}
      </button>
    </form>
  );
}

function ResultCard({ r, lang, dict, selected, toggleHref }: { r: SearchResult; lang: Locale; dict: Dictionary; selected: boolean; toggleHref: string }) {
  const t = dict.search;
  const badges = [
    r.fluent_english_count > 0 && `${dict.hospital.englishFluent} ${r.fluent_english_count}`,
    r.director_count > 0 && `${dict.hospital.director} ${r.director_count}`,
  ].filter(Boolean) as string[];
  const kind = categoryLine(r.category, r.sido, r.sgg);
  return (
    <li className={`space-y-3 rounded-md border bg-card p-5 ${selected ? "border-brand" : "border-border"}`}>
      {kind && <p className="text-[10px] font-bold text-brand">{kind}</p>}
      <h2 className="text-[19px] font-bold leading-snug">
        <Link href={`/${lang}/hospitals/${r.id}`} className="hover:text-brand">
          {r.name}
        </Link>
      </h2>
      {namesLine(r) && <p className="text-xs text-muted">{namesLine(r)}</p>}
      <p className="text-xs">
        {r.review_count > 0 ? (
          <>
            <span className="text-star">★</span> {r.avg_rating?.toFixed(1)} · {dict.hospital.reviews} {r.review_count}
          </>
        ) : (
          <span className="text-muted">{t.noReviews}</span>
        )}
      </p>
      <p className="flex items-center gap-1 text-xs text-muted">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        {r.road_address || r.address}
      </p>
      {badges.length > 0 && <p className="text-xs text-brand">{badges.join(" · ")}</p>}
      <div className="flex items-center justify-between gap-3 pt-1 text-xs font-bold text-brand">
        <Link href={`/${lang}/hospitals/${r.id}`} className="hover:underline">
          {t.viewDetail} →
        </Link>
        <Link href={toggleHref} scroll={false} aria-pressed={selected} className="flex items-center gap-1.5 hover:underline">
          {selected ? <SquareCheck className="size-4" aria-hidden /> : <Square className="size-4" aria-hidden />}
          {selected ? t.compareOn : t.compare}
        </Link>
      </div>
    </li>
  );
}

function ComparePanel({ lang, dict, items, clearHref, removeHref }: { lang: Locale; dict: Dictionary; items: CompareHospital[]; clearHref: string; removeHref: (id: string) => string }) {
  const c = dict.search.compareBox;
  const cols = { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` };
  const ratio = (n: number, total: number) => (total === 0 ? c.noData : `${n} / ${total}`);
  const rows: { label: string; values: string[] }[] = [
    { label: c.rows.rating, values: items.map((i) => (i.stats.total ? `${i.stats.avgRating?.toFixed(1)} / ${i.stats.total}` : c.noData)) },
    { label: c.rows.english, values: items.map((i) => ratio(i.stats.fluentEnglish, i.stats.total)) },
    { label: c.rows.interpreter, values: items.map((i) => ratio(i.stats.interpreter, i.stats.total)) },
    { label: c.rows.director, values: items.map((i) => ratio(i.stats.director, i.stats.total)) },
    { label: c.rows.price, values: items.map((i) => ratio(i.stats.priceExplained, i.stats.total)) },
    { label: c.rows.upselling, values: items.map((i) => ratio(i.stats.noUpselling, i.stats.total)) },
    { label: c.rows.address, values: items.map((i) => i.address || c.noData) },
  ];
  return (
    <section id="compare" className="scroll-mt-6 space-y-5 rounded-md border border-brand bg-brand-soft p-5 md:p-7">
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-brand">{fill(c.eyebrow, { n: items.length })}</p>
        <h2 className="text-2xl font-bold leading-snug md:text-[30px]">{fill(c.title, { n: items.length })}</h2>
        <p className="text-sm text-muted">{c.subtitle}</p>
      </div>
      <div className="grid gap-4" style={cols}>
        {items.map((i) => (
          <div key={i.id} className="space-y-1">
            <p className="text-[15px] font-bold">{i.name}</p>
            {i.region && <p className="text-xs text-muted">{i.region}</p>}
            <Link href={removeHref(i.id)} scroll={false} className="text-[11px] text-muted hover:text-foreground">
              {c.remove}
            </Link>
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="space-y-2 border-t border-[#c6ddda] pt-3.5">
          <p className="text-[11px] text-muted">{row.label}</p>
          <div className="grid gap-4 text-sm font-bold" style={cols}>
            {row.values.map((v, idx) => (
              <p key={idx} className="min-w-0 break-words">
                {v}
              </p>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted">{c.footnote}</p>
      <div className="flex flex-wrap gap-3">
        <Link href={`/${lang}/hospitals/${items[0].id}`} className="flex min-h-12 items-center justify-center rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong">
          {fill(c.detail, { name: items[0].name })}
        </Link>
        <Link href={clearHref} scroll={false} className="flex min-h-12 items-center justify-center rounded-sm bg-white px-5 py-3 text-sm font-bold text-brand hover:bg-brand-soft">
          {c.clear}
        </Link>
      </div>
    </section>
  );
}
