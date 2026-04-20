CREATE OR REPLACE FUNCTION public.notify_lead_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  product_model_value text := 'Zapytanie ogólne';
  product_serial_value text := NULL;
  payload jsonb;
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    SELECT name, serial_number INTO product_model_value, product_serial_value FROM public.products WHERE id = NEW.product_id;
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

  PERFORM extensions.http_post(
    url := 'https://peztqgfmmnxaaoapzpbw.supabase.co/functions/v1/notify-lead',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenRxZ2ZtbW54YWFvYXB6cGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDU3NDAsImV4cCI6MjA2NjAyMTc0MH0.wXaJlrVMbf1z2egXCpdQUxTLv_dM9bswaZkOt6fLr-g'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_lead_created failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;