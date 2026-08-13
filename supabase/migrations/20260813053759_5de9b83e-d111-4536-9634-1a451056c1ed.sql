ALTER TABLE public.leads ADD COLUMN sold_at timestamptz;
CREATE INDEX idx_leads_sold_at ON public.leads (sold_at) WHERE sold_at IS NOT NULL;