-- Newer Supabase images grant anon select on new tables by default, so the
-- column-only insert grant in 20261022140000 left anon able to select from
-- kb_feedback (RLS still hid the rows). Make the intended access explicit.
revoke all on public.kb_feedback, public.kb_feedback_totals from anon;
grant insert (article_id, helpful) on public.kb_feedback to anon;
