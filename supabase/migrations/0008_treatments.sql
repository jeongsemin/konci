-- Two fixes for the search. Run once after 0007_hospital_managers.sql.
--
-- 1. Review statistics only count reviews the public can see (not hidden, author not suspended).
--    Until now the rule lived only in row-level security, so the search, which reads with the
--    service role, counted hidden reviews in the rating and the review count.
-- 2. The search can filter by the treatment named in the reviews, and by "lists dermatology".

-- Same columns as before, so existing queries keep working.
create or replace view public.hospital_stats with (security_invoker = true) as
select
  h.id as hospital_id,
  count(r.id)::int as review_count,
  round(avg(r.rating), 1) as avg_rating,
  count(*) filter (where r.english_support = 'fluent')::int as fluent_english_count,
  count(*) filter (where r.director_consultation)::int as director_count
from public.hospitals h
left join public.reviews r
  on r.hospital_id = h.id
  and r.hidden_at is null
  and not public.is_suspended(r.user_id)
group by h.id;

-- New columns at the end: existing columns keep their positions.
--   derm_listed  the hospital lists dermatology among its departments (HIRA data)
--   treatments   the treatments written in its visible reviews, lower-cased and joined by " | "
create or replace view public.hospital_directory with (security_invoker = true) as
select
  h.id,
  h.name,
  h.category,
  h.address,
  h.road_address,
  h.sido,
  h.sgg,
  h.type_code,
  s.review_count,
  s.avg_rating,
  s.fluent_english_count,
  s.director_count,
  h.name_en,
  h.name_ja,
  h.name_zh,
  concat_ws(' ', h.name_en, h.name_ja, h.name_zh) as alt_names,
  h.derm_listed,
  (
    select string_agg(distinct lower(r.treatment), ' | ')
    from public.reviews r
    where r.hospital_id = h.id
      and r.treatment is not null
      and r.hidden_at is null
      and not public.is_suspended(r.user_id)
  ) as treatments
from public.hospitals h
join public.hospital_stats s on s.hospital_id = h.id;
