-- Account deletion and receipt retention. Run once after 0009_closures.sql.
--
-- Deleting an account removes the profile, which cascades to reviews, receipts, reports, edit requests
-- and manager applications. Two things get in the way, and one thing must survive:
--   1. receipts.reviewed_by had no delete rule, so deleting an administrator who decided receipts failed.
--   2. When a receipt is deleted (with its review, or with the account) the same photo must still not be
--      usable for a second review. Only a hash is kept for that, never the image or the OCR text.

alter table public.receipts drop constraint if exists receipts_reviewed_by_fkey;
alter table public.receipts
  add constraint receipts_reviewed_by_fkey foreign key (reviewed_by) references public.profiles (id) on delete set null;

-- ───────────── hashes of deleted receipts ─────────────
-- user_id is kept only while the member still exists, so the same member can upload their own receipt
-- again (that is how a review is rewritten: there is no edit). It is cleared when the account goes.
create table public.used_receipt_hashes (
  file_hash text primary key,
  user_id uuid,
  deleted_at timestamptz not null default now()
);
alter table public.used_receipt_hashes enable row level security;
-- No policies: only the server (service role) reads or writes this table.

create function public.remember_receipt_hash() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.used_receipt_hashes (file_hash, user_id)
  values (
    old.file_hash,
    -- When the whole account is being deleted the profile row is already gone here, so this is null.
    case when exists (select 1 from public.profiles where id = old.user_id) then old.user_id end
  )
  on conflict (file_hash) do update set user_id = excluded.user_id, deleted_at = now();
  return old;
end $$;

create trigger receipts_remember_hash
  after delete on public.receipts
  for each row execute function public.remember_receipt_hash();

revoke all on function public.remember_receipt_hash() from public, anon, authenticated;
