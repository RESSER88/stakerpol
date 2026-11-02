-- Grupa A: tylko automatyzacje (service_role) i cron (właściciel postgres)
REVOKE EXECUTE ON FUNCTION public.log_social_post(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_platform_rotation(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_unposted_product(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_unposted_product(text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_unposted_product_debug(text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_rotation_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_handled_leads() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_social_post(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_platform_rotation(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_unposted_product(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_unposted_product(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_unposted_product_debug(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_rotation_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_handled_leads() TO service_role;

-- Grupa B: panel admina (zalogowani) — odbieramy tylko anonimom
REVOKE EXECUTE ON FUNCTION public.health_check() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.security_audit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.health_check() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.security_audit() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;