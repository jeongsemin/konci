-- Hospital managers: a member applies to manage one hospital, an administrator checks the proof and
-- approves. A manager can send more kinds of edit requests for that hospital; those still go through
-- the administrators' review queue. Run once after 0006_edit_requests.sql.

-- ───────────── more things a hospital can tell us ─────────────
alter table public.hospitals
  add column name_ja text,       -- Japanese name
  add column name_zh text,       -- Chinese name
  add column hours_note text;    -- opening hours / days off, as a short note

-- ───────────── applications and assignments ─────────────
create table public.hospital_managers (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  position text not null check (char_length(position) between 2 and 60),
  contact text not null check (char_length(contact) between 5 and 100),
  proof_path text not null,                    -- file in the private manager-proofs bucket
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'revoked')),
  reject_reason text check (char_length(reject_reason) <= 200),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
-- One pending or active assignment per member and hospital (a rejected one can be applied for again).
create unique index hospital_managers_one_live_idx
  on public.hospital_managers (hospital_id, user_id)
  where status in ('pending', 'active');
create index hospital_managers_queue_idx on public.hospital_managers (status, created_at);
create index hospital_managers_user_idx on public.hospital_managers (user_id, created_at);

alter table public.hospital_managers enable row level security;

create policy "managers select own or admin" on public.hospital_managers
  for select using (user_id = auth.uid() or public.is_admin());

-- A member files a pending application for themselves. Decisions are made by the server with the
-- service role (no update/delete policy).
create policy "managers insert own" on public.hospital_managers
  for insert with check (
    user_id = auth.uid()
    and status = 'pending'
    and reject_reason is null
    and decided_by is null
    and decided_at is null
    and not public.is_suspended(auth.uid())
  );

create function public.is_hospital_manager(p_hospital uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.hospital_managers
    where hospital_id = p_hospital and user_id = p_user and status = 'active'
  )
$$;

-- ───────────── proof files ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('manager-proofs', 'manager-proofs', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;
-- No storage.objects policies: only the service role touches this bucket.

-- ───────────── edit requests from managers ─────────────
alter table public.hospital_edit_requests add column by_manager boolean not null default false;

-- Decided by the database, so a request can't claim to come from a manager.
create function public.set_edit_request_by_manager()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.by_manager := public.is_hospital_manager(new.hospital_id, new.requester_id);
  return new;
end;
$$;

create trigger hospital_edit_requests_by_manager
  before insert on public.hospital_edit_requests
  for each row execute function public.set_edit_request_by_manager();

alter table public.hospital_edit_requests drop constraint hospital_edit_requests_field_check;
alter table public.hospital_edit_requests
  add constraint hospital_edit_requests_field_check
  check (field in ('phone', 'homepage', 'name_en', 'other', 'name_ja', 'name_zh', 'hours_note'));

-- Only the hospital's manager may ask for the extra fields.
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
      field in ('phone', 'homepage', 'name_en', 'other')
      or public.is_hospital_manager(hospital_id, auth.uid())
    )
  );

-- ───────────── search sees every name ─────────────
-- Columns added at the end: existing columns keep their positions. alt_names is never null,
-- so a search can test it without special cases.
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
  concat_ws(' ', h.name_en, h.name_ja, h.name_zh) as alt_names
from public.hospitals h
join public.hospital_stats s on s.hospital_id = h.id;
