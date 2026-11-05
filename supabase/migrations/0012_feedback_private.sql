-- Suggestions are private: only the author and administrators can read them.
-- Run once after 0011_feedback.sql.
drop policy "feedback readable" on public.feedback_posts;
create policy "feedback readable" on public.feedback_posts
  for select using (user_id = auth.uid() or public.is_admin());
