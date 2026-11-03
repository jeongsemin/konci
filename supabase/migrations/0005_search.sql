-- One row per hospital with its review statistics, so the search can filter, order and
-- paginate in the database (a page of 10 out of thousands) instead of in application code.
-- security_invoker: the caller's row-level security still applies, as it does for hospital_stats.

create view public.hospital_directory with (security_invoker = true) as
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
  s.director_count
from public.hospitals h
join public.hospital_stats s on s.hospital_id = h.id;
