-- Email sign-in: a member who signs in with an email link has no Google name, and the nickname used to
-- fall back to the part of the email before the "@". Nicknames are shown on reviews, so that would
-- publish half of someone's address. Use a neutral starting nickname instead (members can change it).
-- Run once after 0012_feedback_private.sql.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Member ' || substr(new.id::text, 1, 4)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;
