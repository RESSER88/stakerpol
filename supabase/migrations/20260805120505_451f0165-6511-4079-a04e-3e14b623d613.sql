CREATE OR REPLACE FUNCTION public.cleanup_old_handled_leads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  anonymized_count integer;
BEGIN
  UPDATE public.leads
  SET name = NULL,
      email = NULL,
      message = NULL,
      phone = 'zanonimizowany'
  WHERE created_at < now() - interval '24 months'
    AND phone IS DISTINCT FROM 'zanonimizowany';
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
  RETURN anonymized_count;
END;
$function$;