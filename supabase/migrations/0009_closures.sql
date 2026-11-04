-- Closed or moved clinics: members report them, an administrator decides, the search stops showing
-- them, and the HIRA import never brings them back. Run once after 0008_treatments.sql.

-- ───────────── the state on the hospital ─────────────
-- The HIRA import never writes these columns, so a re-import leaves a closure alone.
alter table public.hospitals
  add column closed_at timestamptz,
  add column closed_reason text check (closed_reason in ('closed', 'moved')),
  add column closed_note text check (char_length(closed_note) <= 300);   -- e.g. the new address of a clinic that moved

-- ───────────── reports as edit requests ─────────────
alter table public.hospital_edit_requests drop constraint hospital_edit_requests_field_check;
alter table public.hospital_edit_requests
  add constraint hospital_edit_requests_field_check
  check (field in ('phone', 'homepage', 'name_en', 'other', 'name_ja', 'name_zh', 'hours_note', 'closure'));

-- A closure report carries "closed" or "moved" as its value.
alter table public.hospital_edit_requests
  add constraint hospital_edit_requests_closure_value_check
  check (field <> 'closure' or value in ('closed', 'moved'));

-- Any member may report a closure.
drop policy "edit requests insert own" on public.hospital_edit_requests;
create policy "edit requests insert own" on public.hospital_edit_requests
  for insert with check (
    requester_id = auth.uid()
    and status = 'open'
    and reject_reason is null
    and resolved_by is null
    and resolved_at is null
    and not public.is_suspended(auth.uid())
    and (
      field in ('phone', 'homepage', 'name_en', 'closure', 'other')
      or public.is_hospital_manager(hospital_id, auth.uid())
    )
  );

-- ───────────── applying a request ─────────────
-- As before, plus: a closure report closes the hospital instead of setting a column.
create or replace function public.apply_edit_request(p_request uuid, p_admin uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.hospital_edit_requests;
  old_value text;
begin
  select * into r from public.hospital_edit_requests where id = p_request for update;
  if not found then return 'not_found'; end if;
  if r.status <> 'open' then return 'not_open'; end if;

  if r.field = 'closure' then
    select closed_reason into old_value from public.hospitals where id = r.hospital_id;
    update public.hospitals
       set closed_at = now(), closed_reason = r.value, closed_note = r.note
     where id = r.hospital_id;
    insert into public.hospital_edit_log (hospital_id, field, old_value, new_value, request_id, changed_by)
    values (r.hospital_id, 'closure', old_value, r.value, r.id, p_admin);
  elsif r.field <> 'other' then
    -- r.field is limited to the columns the table's check constraint allows.
    execute format('select %I from public.hospitals where id = $1', r.field) into old_value using r.hospital_id;
    execute format(
      'update public.hospitals set %I = $1, locked_fields = (select array_agg(distinct f) from unnest(locked_fields || $2) f) where id = $3',
      r.field
    ) using r.value, array[r.field], r.hospital_id;
    insert into public.hospital_edit_log (hospital_id, field, old_value, new_value, request_id, changed_by)
    values (r.hospital_id, r.field, old_value, r.value, r.id, p_admin);
  end if;

  update public.hospital_edit_requests
     set status = 'approved', resolved_by = p_admin, resolved_at = now()
   where id = r.id;
  return 'ok';
end;
$$;

revoke all on function public.apply_edit_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.apply_edit_request(uuid, uuid) to service_role;

-- ───────────── undoing a closure ─────────────
create function public.reopen_hospital(p_hospital uuid, p_admin uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  old_value text;
begin
  select closed_reason into old_value from public.hospitals where id = p_hospital for update;
  if not found then return 'not_found'; end if;
  if old_value is null then return 'not_closed'; end if;

  update public.hospitals set closed_at = null, closed_reason = null, closed_note = null where id = p_hospital;
  insert into public.hospital_edit_log (hospital_id, field, old_value, new_value, request_id, changed_by)
  values (p_hospital, 'closure', old_value, null, null, p_admin);
  return 'ok';
end;
$$;

revoke all on function public.reopen_hospital(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reopen_hospital(uuid, uuid) to service_role;

-- ───────────── search sees it ─────────────
-- A column added at the end: existing columns keep their positions.
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
  ) as treatments,
  h.closed_at
from public.hospitals h
join public.hospital_stats s on s.hospital_id = h.id;
