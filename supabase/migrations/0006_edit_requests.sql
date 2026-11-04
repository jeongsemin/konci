-- Edit requests: members ask for a correction to a hospital, administrators review and apply it.
-- Run once after 0005_search.sql.

-- ───────────── hospital columns ─────────────
alter table public.hospitals
  add column name_en text,                                    -- English name, set from an approved request
  add column locked_fields text[] not null default '{}';      -- columns edited by hand: the HIRA import must not overwrite them

-- ───────────── requests ─────────────
create table public.hospital_edit_requests (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  field text not null check (field in ('phone', 'homepage', 'name_en', 'other')),
  value text check (char_length(value) <= 200),
  note text check (char_length(note) <= 300),
  status text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  reject_reason text check (char_length(reject_reason) <= 200),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  -- "other" is a free-text report and needs an explanation; every other field needs the new value.
  check (
    (field = 'other' and value is null and note is not null)
    or (field <> 'other' and value is not null)
  )
);
create index hospital_edit_requests_queue_idx on public.hospital_edit_requests (status, created_at);
create index hospital_edit_requests_requester_idx on public.hospital_edit_requests (requester_id, created_at);
-- A member can have one open request per hospital and field.
create unique index hospital_edit_requests_one_open_idx
  on public.hospital_edit_requests (requester_id, hospital_id, field)
  where status = 'open' and field <> 'other';

alter table public.hospital_edit_requests enable row level security;

create policy "edit requests select own or admin" on public.hospital_edit_requests
  for select using (requester_id = auth.uid() or public.is_admin());

-- Members file open requests for themselves. Decisions are made by the server with the service role
-- (no update/delete policy).
create policy "edit requests insert own" on public.hospital_edit_requests
  for insert with check (
    requester_id = auth.uid()
    and status = 'open'
    and reject_reason is null
    and resolved_by is null
    and resolved_at is null
    and not public.is_suspended(auth.uid())
  );

-- ───────────── history ─────────────
create table public.hospital_edit_log (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  request_id uuid references public.hospital_edit_requests (id) on delete set null,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index hospital_edit_log_hospital_idx on public.hospital_edit_log (hospital_id, created_at desc);

alter table public.hospital_edit_log enable row level security;
create policy "edit log admin only" on public.hospital_edit_log
  for select using (public.is_admin());

-- ───────────── applying a request ─────────────
-- One transaction: change the hospital, lock the field, write the history, close the request.
-- Only the server (service role) can call it.
create function public.apply_edit_request(p_request uuid, p_admin uuid)
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

  if r.field <> 'other' then
    -- r.field is limited to the three columns by the table's check constraint.
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

-- ───────────── search sees the English name ─────────────
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
  h.name_en
from public.hospitals h
join public.hospital_stats s on s.hospital_id = h.id;
