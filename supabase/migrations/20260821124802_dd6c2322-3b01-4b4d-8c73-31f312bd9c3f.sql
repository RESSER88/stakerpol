ALTER TABLE public.leads ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.leads ADD CONSTRAINT leads_contact_check CHECK (phone IS NOT NULL OR email IS NOT NULL);