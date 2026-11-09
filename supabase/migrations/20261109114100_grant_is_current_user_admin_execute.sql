-- The approval trigger runs as the signed-in user and calls
-- public.is_current_user_admin(). The previous migration revoked EXECUTE
-- from authenticated, which blocked admin status updates with 42501.
-- Keep the helper SECURITY INVOKER so it still reads only the caller's
-- own profiles row under RLS.

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

NOTIFY pgrst, 'reload schema';
