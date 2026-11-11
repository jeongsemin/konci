-- One paper receipt, one review: block the same receipt photographed again (new photo, new file hash).
-- content_key is a SHA-256 of what the OCR read (payment date | total | approval number or payment time),
-- set by the upload route only when all of it was read. Rejected receipts free their key.

alter table public.receipts add column content_key text;

create unique index receipts_content_key_live_idx
  on public.receipts (content_key)
  where content_key is not null and status <> 'rejected';

-- Remember the key of a deleted receipt like its file hash, so another member cannot reuse the receipt.
-- It is stored in the same table with a "key:" prefix; file hashes are plain hex, so the two never collide.
create or replace function public.remember_receipt_hash() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid := case when exists (select 1 from public.profiles where id = old.user_id) then old.user_id end;
begin
  -- When the whole account is being deleted the profile row is already gone here, so owner is null.
  insert into public.used_receipt_hashes (file_hash, user_id)
  values (old.file_hash, owner)
  on conflict (file_hash) do update set user_id = excluded.user_id, deleted_at = now();
  if old.content_key is not null and old.status <> 'rejected' then
    insert into public.used_receipt_hashes (file_hash, user_id)
    values ('key:' || old.content_key, owner)
    on conflict (file_hash) do update set user_id = excluded.user_id, deleted_at = now();
  end if;
  return old;
end $$;

revoke all on function public.remember_receipt_hash() from public, anon, authenticated;
