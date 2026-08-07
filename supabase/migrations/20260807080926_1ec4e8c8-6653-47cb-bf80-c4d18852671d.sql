CREATE TABLE public.shared_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  label text,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_lists_expires_at ON public.shared_lists (expires_at);
CREATE INDEX idx_shared_lists_created_by ON public.shared_lists (created_by);

CREATE TRIGGER update_shared_lists_updated_at
BEFORE UPDATE ON public.shared_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT ALL ON public.shared_lists TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_lists TO authenticated;
REVOKE ALL ON public.shared_lists FROM anon;

ALTER TABLE public.shared_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view shared lists"
ON public.shared_lists FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create shared lists"
ON public.shared_lists FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update shared lists"
ON public.shared_lists FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shared lists"
ON public.shared_lists FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_lists()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.shared_lists
  WHERE expires_at < now()
     OR revoked_at < now() - interval '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

SELECT cron.schedule(
  'cleanup-expired-shared-lists',
  '15 3 * * *',
  $$SELECT public.cleanup_expired_shared_lists();$$
);