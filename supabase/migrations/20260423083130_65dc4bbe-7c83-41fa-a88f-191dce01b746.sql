-- Auto-notification trigger for new leads
-- Calls public.notify_lead_created() AFTER each INSERT into public.leads,
-- which in turn invokes the notify-lead Edge Function (sending email via Resend).

DROP TRIGGER IF EXISTS trg_leads_notify ON public.leads;

CREATE TRIGGER trg_leads_notify
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_lead_created();