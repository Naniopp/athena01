-- trigger-only functions: not callable by any API role
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.sync_like_count() from public, anon, authenticated;
revoke all on function public.sync_comment_count() from public, anon, authenticated;

-- RBAC helpers: signed-in users only (RLS policies rely on these)
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.has_permission(uuid, text) from public, anon;
revoke all on function public.my_department() from public, anon;
revoke all on function public.my_profile_id() from public, anon;
revoke all on function public.teaches_subject(uuid, uuid) from public, anon;
revoke all on function public.in_conversation(uuid) from public, anon;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.has_permission(uuid, text) to authenticated;
grant execute on function public.my_department() to authenticated;
grant execute on function public.my_profile_id() to authenticated;
grant execute on function public.teaches_subject(uuid, uuid) to authenticated;
grant execute on function public.in_conversation(uuid) to authenticated;
