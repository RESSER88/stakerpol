-- Enable pg_net for async HTTP from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add status column (2 states: 'new' | 'handled')
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'handled'));

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Trigger function: notify edge function on new lead
CREATE OR REPLACE FUNCTION public.notify_lead_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  product_model_value text := 'Zapytanie ogólne';
  payload jsonb;
BEGIN
  -- Resolve product model if product_id present
  IF NEW.product_id IS NOT NULL THEN
    SELECT name INTO product_model_value FROM public.products WHERE id = NEW.product_id;
    IF product_model_value IS NULL THEN
      product_model_value := 'Zapytanie ogólne';
    END IF;
  END IF;

  payload := jsonb_build_object(
    'id', NEW.id,
    'product_id', NEW.product_id,
    'product_model', product_model_value,
    'phone', NEW.phone,
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
  -- Don't block insert if notification fails
  RAISE WARNING 'notify_lead_created failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_notify ON public.leads;
CREATE TRIGGER trg_leads_notify
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_lead_created();