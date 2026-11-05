-- Suggestion board: members write what is inconvenient or what they wish for, everyone can read it,
-- an administrator answers and sets a status. Run once after 0010_account_deletion.sql.

create table public.feedback_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('bug', 'inconvenience', 'idea', 'other')),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'done', 'declined')),
  admin_reply text check (char_length(admin_reply) <= 1000),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index feedback_posts_list_idx on public.feedback_posts (created_at desc);
create index feedback_posts_status_idx on public.feedback_posts (status, created_at desc);
create index feedback_posts_user_idx on public.feedback_posts (user_id, created_at desc);

alter table public.feedback_posts enable row level security;

-- Anyone may read the board. Posts of a suspended member stay visible only to them and administrators.
create policy "feedback readable" on public.feedback_posts
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or not public.is_suspended(user_id)
  );

-- A member writes an open post of their own, at most 5 a day. Answers and statuses are set by the
-- server with the service role (no update policy).
create policy "feedback insert own" on public.feedback_posts
  for insert with check (
    user_id = auth.uid()
    and status = 'open'
    and admin_reply is null
    and replied_at is null
    and not public.is_suspended(auth.uid())
    and (
      select count(*) from public.feedback_posts f
      where f.user_id = auth.uid() and f.created_at > now() - interval '1 day'
    ) < 5
  );

-- A member may take their own post down.
create policy "feedback delete own" on public.feedback_posts
  for delete using (user_id = auth.uid());
