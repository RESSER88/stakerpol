REVOKE EXECUTE ON FUNCTION public.cleanup_expired_shared_lists() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_shared_lists() TO service_role;