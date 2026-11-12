-- Saved clinics: a member's private list of clinics to come back to. Run once after 0014.
-- Only the member can see or change their list; it goes away with the account.

create table public.saved_hospitals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, hospital_id)
);
create index saved_hospitals_user_idx on public.saved_hospitals (user_id, created_at desc);

alter table public.saved_hospitals enable row level security;

create policy "saved_hospitals: read own" on public.saved_hospitals
  for select to authenticated using (user_id = auth.uid());
create policy "saved_hospitals: add own" on public.saved_hospitals
  for insert to authenticated with check (user_id = auth.uid());
create policy "saved_hospitals: remove own" on public.saved_hospitals
  for delete to authenticated using (user_id = auth.uid());

-- At most 200 saved clinics per member, so the list cannot be used to fill the database.
create function public.limit_saved_hospitals() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.saved_hospitals where user_id = new.user_id) >= 200 then
    raise exception 'saved_hospitals limit reached' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger saved_hospitals_limit
  before insert on public.saved_hospitals
  for each row execute function public.limit_saved_hospitals();

revoke all on function public.limit_saved_hospitals() from public, anon, authenticated;
