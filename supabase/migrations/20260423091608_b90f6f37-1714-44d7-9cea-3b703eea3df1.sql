-- 1. Add handled_at column
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS handled_at timestamptz;

-- 2. Backfill existing handled leads
UPDATE public.leads SET handled_at = created_at WHERE status = 'handled' AND handled_at IS NULL;

-- 3. Trigger to maintain handled_at
CREATE OR REPLACE FUNCTION public.set_lead_handled_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'handled' THEN
      NEW.handled_at := now();
    ELSE
      NEW.handled_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_lead_handled_at ON public.leads;
CREATE TRIGGER trg_set_lead_handled_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_lead_handled_at();

-- 4. Cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_handled_leads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.leads
  WHERE status = 'handled'
    AND handled_at IS NOT NULL
    AND handled_at < now() - interval '60 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 5. Enable pg_cron and schedule daily cleanup at 03:00 UTC
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-handled-leads') THEN
    PERFORM cron.unschedule('cleanup-old-handled-leads');
  END IF;
  PERFORM cron.schedule(
    'cleanup-old-handled-leads',
    '0 3 * * *',
    $cron$ SELECT public.cleanup_old_handled_leads(); $cron$
  );
END $$;