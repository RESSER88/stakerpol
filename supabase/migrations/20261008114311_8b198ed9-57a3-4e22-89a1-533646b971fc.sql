-- 1. Kolumna na zatwierdzony opis AI w product_seo_settings
ALTER TABLE public.product_seo_settings
  ADD COLUMN IF NOT EXISTS delta_content text;

-- 2. Tabela szkiców AI (kilka szkiców na produkt)
CREATE TABLE public.product_ai_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_ai_drafts_product_id ON public.product_ai_drafts(product_id);

-- Walidacja statusu triggerem (zamiast CHECK, zgodnie z wytycznymi projektu)
CREATE OR REPLACE FUNCTION public.validate_product_ai_draft_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Nieprawidłowy status szkicu AI: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_product_ai_drafts_status
  BEFORE INSERT OR UPDATE ON public.product_ai_drafts
  FOR EACH ROW EXECUTE FUNCTION public.validate_product_ai_draft_status();

CREATE TRIGGER trg_product_ai_drafts_updated_at
  BEFORE UPDATE ON public.product_ai_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. GRANTy (brak GRANT dla anon)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_ai_drafts TO authenticated;
GRANT ALL ON public.product_ai_drafts TO service_role;

-- 4. RLS
ALTER TABLE public.product_ai_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI drafts"
  ON public.product_ai_drafts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Akceptacja szkicu: publikuje delta_content w product_seo_settings (admin only)
CREATE OR REPLACE FUNCTION public.approve_product_ai_draft(_draft_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _draft public.product_ai_drafts%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora';
  END IF;

  SELECT * INTO _draft FROM public.product_ai_drafts WHERE id = _draft_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Szkic nie istnieje';
  END IF;

  IF _draft.status = 'approved' THEN
    RAISE EXCEPTION 'Szkic został już zatwierdzony';
  END IF;

  IF length(trim(_draft.content)) = 0 THEN
    RAISE EXCEPTION 'Treść szkicu jest pusta';
  END IF;

  IF length(_draft.content) > 350 THEN
    RAISE EXCEPTION 'Treść przekracza 350 znaków';
  END IF;

  -- Utwórz wiersz product_seo_settings, jeśli go brak, i opublikuj treść
  INSERT INTO public.product_seo_settings (product_id, delta_content)
  VALUES (_draft.product_id, _draft.content)
  ON CONFLICT (product_id)
  DO UPDATE SET delta_content = EXCLUDED.delta_content;

  UPDATE public.product_ai_drafts
  SET status = 'approved'
  WHERE id = _draft_id;

  -- Pozostałe szkice tego produktu wracają do 'draft'
  UPDATE public.product_ai_drafts
  SET status = 'draft'
  WHERE product_id = _draft.product_id
    AND id <> _draft_id
    AND status IN ('pending', 'approved');

  RETURN json_build_object('success', true, 'product_id', _draft.product_id);
END;
$$;

-- 6. Wycofanie publikacji: delta_content = NULL (admin only)
CREATE OR REPLACE FUNCTION public.withdraw_product_delta_content(_product_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora';
  END IF;

  UPDATE public.product_seo_settings
  SET delta_content = NULL
  WHERE product_id = _product_id;

  UPDATE public.product_ai_drafts
  SET status = 'draft'
  WHERE product_id = _product_id
    AND status = 'approved';

  RETURN json_build_object('success', true, 'product_id', _product_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_product_ai_draft(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_product_delta_content(uuid) TO authenticated;