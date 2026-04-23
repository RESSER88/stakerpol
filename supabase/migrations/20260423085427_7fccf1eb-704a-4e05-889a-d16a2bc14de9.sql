CREATE OR REPLACE FUNCTION public.notify_lead_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  product_model_value text := 'Zapytanie ogólne';
  product_serial_value text := NULL;
  payload jsonb;
  req_id bigint;
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    SELECT name, serial_number INTO product_model_value, product_serial_value
    FROM public.products WHERE id = NEW.product_id;
    IF product_model_value IS NULL THEN
      product_model_value := 'Zapytanie ogólne';
    END IF;
  END IF;

  payload := jsonb_build_object(
    'id', NEW.id,
    'product_id', NEW.product_id,
    'product_model', product_model_value,
    'serial_number', product_serial_value,
    'name', NEW.name,
    'phone', NEW.phone,
    'email', NEW.email,
    'source', NEW.source,
    'language', 'pl',
    'message', NEW.message,
    'page_url', NEW.page_url,
    'user_agent', NEW.user_agent,
    'created_at', NEW.created_at
  );

  -- Use public.http_post (http extension is installed in public schema)
  PERFORM public.http_post(
    'https://peztqgfmmnxaaoapzpbw.supabase.co/functions/v1/notify-lead'::varchar,
    payload::text::varchar,
    'application/json'::varchar
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_lead_created failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Test insert (Krok 1a/1b combined)
INSERT INTO public.leads (name, email, phone, message, source, rodo_accepted, page_url, user_agent)
VALUES ('TEST TRIGGER 1', 'info@stakerpol.pl', '600000001',
        'Test triggera trg_leads_notify - wstawka po naprawie http_post.', 'trigger_test', true,
        'https://test.local/step1', 'pg-trigger-test');