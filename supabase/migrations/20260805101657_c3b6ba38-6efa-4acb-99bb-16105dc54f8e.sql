DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-translations-every-minute') THEN
    PERFORM cron.unschedule('process-translations-every-minute');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-translations-1min') THEN
    PERFORM cron.unschedule('process-translations-1min');
  END IF;
END $$;