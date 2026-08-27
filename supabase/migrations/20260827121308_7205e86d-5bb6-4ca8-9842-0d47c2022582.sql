-- ============================================================
-- 1. Funkcje normalizacji (inwariant 1)
-- ============================================================
CREATE OR REPLACE FUNCTION public.norm_email(_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $$
  SELECT NULLIF(lower(btrim(coalesce(_value, ''))), '')
$$;

-- Numer telefonu: wartość zawierająca '@' NIE jest telefonem (NULL).
-- Pozostałe: same cyfry, 9 cyfr -> +48XXXXXXXXX, 11 cyfr z 48 -> +48..., inaczej +cyfry.
CREATE OR REPLACE FUNCTION public.norm_phone(_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $$
DECLARE
  v text := btrim(coalesce(_value, ''));
  digits text;
BEGIN
  IF v = '' OR position('@' in v) > 0 THEN
    RETURN NULL;
  END IF;
  digits := regexp_replace(v, '[^0-9]', '', 'g');
  IF digits = '' THEN
    RETURN NULL;
  END IF;
  IF length(digits) = 9 THEN
    RETURN '+48' || digits;
  ELSIF length(digits) = 11 AND left(digits, 2) = '48' THEN
    RETURN '+' || digits;
  ELSIF length(digits) = 10 AND left(digits, 1) = '0' THEN
    RETURN '+48' || right(digits, 9);
  END IF;
  RETURN '+' || digits;
END;
$$;

CREATE OR REPLACE FUNCTION public.norm_company(_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $$
  SELECT NULLIF(regexp_replace(lower(btrim(coalesce(_value, ''))), '\s+', ' ', 'g'), '')
$$;

-- ============================================================
-- 2. public.contacts — kartoteka klienta
-- ============================================================
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  osoba text,
  firma text,
  firma_norm text GENERATED ALWAYS AS (public.norm_company(firma)) STORED,
  telefon text,
  telefon_norm text GENERATED ALWAYS AS (public.norm_phone(telefon)) STORED,
  email text,
  email_norm text GENERATED ALWAYS AS (public.norm_email(email)) STORED,
  zrodlo text NOT NULL DEFAULT 'telefon' CHECK (zrodlo IN ('telefon', 'www')),
  krok text NOT NULL DEFAULT 'nowy'
    CHECK (krok IN ('nowy', 'oferta', 'oddzwonic', 'porownuje', 'cena', 'nieaktualne')),
  termin_followup date,
  data_sprzedazy date,
  udzwig_kg integer CHECK (udzwig_kg IS NULL OR udzwig_kg > 0),
  wysokosc_m numeric CHECK (wysokosc_m IS NULL OR wysokosc_m > 0),
  sprawdz_duplikat boolean NOT NULL DEFAULT false,
  ukryty boolean NOT NULL DEFAULT false,
  utworzony_przez text,
  zaktualizowany_przez text,
  utworzony timestamptz NOT NULL DEFAULT now(),
  zaktualizowany timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_kontakt_check CHECK (telefon IS NOT NULL OR email IS NOT NULL OR osoba IS NOT NULL OR firma IS NOT NULL)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contacts" ON public.contacts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contacts" ON public.contacts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER contacts_set_zaktualizowany
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indeksy częściowe (inwarianty 2 i 10)
CREATE INDEX contacts_email_norm_idx ON public.contacts (email_norm) WHERE ukryty = false;
CREATE INDEX contacts_telefon_norm_idx ON public.contacts (telefon_norm) WHERE ukryty = false;
CREATE INDEX contacts_firma_norm_idx ON public.contacts (firma_norm) WHERE ukryty = false;
CREATE INDEX contacts_followup_idx ON public.contacts (termin_followup)
  WHERE ukryty = false AND data_sprzedazy IS NULL;

-- update_updated_at_column ustawia NEW.updated_at, którego tu nie ma — własny trigger
DROP TRIGGER contacts_set_zaktualizowany ON public.contacts;

CREATE OR REPLACE FUNCTION public.set_zaktualizowany()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  NEW.zaktualizowany := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER contacts_set_zaktualizowany
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_zaktualizowany();

-- ============================================================
-- 3. shared_lists — rozszerzenie istniejącej tabeli
-- ============================================================
ALTER TABLE public.shared_lists
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN note text,
  ADD COLUMN sent_at timestamptz,
  ADD COLUMN channel text CHECK (channel IS NULL OR channel IN ('email', 'whatsapp', 'sms', 'telefon')),
  ADD COLUMN renewed_from uuid REFERENCES public.shared_lists(id) ON DELETE SET NULL;

CREATE INDEX shared_lists_contact_id_idx ON public.shared_lists (contact_id);
CREATE INDEX shared_lists_active_idx ON public.shared_lists (last_viewed_at DESC NULLS LAST, sent_at DESC NULLS LAST)
  WHERE archived_at IS NULL;

-- ============================================================
-- 4. public.contact_activities — historia zdarzeń
-- ============================================================
CREATE TABLE public.contact_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  typ text NOT NULL CHECK (typ IN ('telefon', 'formularz', 'oferta', 'sprzedaz', 'ukrycie', 'notatka')),
  data timestamptz NOT NULL DEFAULT now(),
  tresc text,
  wynik text,
  sku text,
  utworzony_przez text,
  lead_id uuid,
  shared_list_id uuid REFERENCES public.shared_lists(id) ON DELETE SET NULL,
  utworzony timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_activities TO authenticated;
GRANT ALL ON public.contact_activities TO service_role;

ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contact activities" ON public.contact_activities
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create contact activities" ON public.contact_activities
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contact activities" ON public.contact_activities
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contact activities" ON public.contact_activities
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Idempotencja importu ze skrzynki (inwariant 5)
CREATE UNIQUE INDEX contact_activities_lead_id_uniq ON public.contact_activities (lead_id)
  WHERE lead_id IS NOT NULL;
CREATE INDEX contact_activities_contact_data_idx ON public.contact_activities (contact_id, data DESC);
CREATE INDEX contact_activities_shared_list_idx ON public.contact_activities (shared_list_id);

-- ============================================================
-- 5. public.shared_list_views — historia otwarć oferty (bez IP)
-- ============================================================
CREATE TABLE public.shared_list_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_list_id uuid NOT NULL REFERENCES public.shared_lists(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  device text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_list_views TO authenticated;
GRANT ALL ON public.shared_list_views TO service_role;

ALTER TABLE public.shared_list_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view shared list views" ON public.shared_list_views
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create shared list views" ON public.shared_list_views
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update shared list views" ON public.shared_list_views
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete shared list views" ON public.shared_list_views
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX shared_list_views_list_idx ON public.shared_list_views (shared_list_id, viewed_at DESC);

-- ============================================================
-- 6. Archiwizacja zamiast kasowania (etap 0)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_lists()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  archived_count integer;
  deleted_count integer;
BEGIN
  -- Wygasłe oraz unieważnione (7 dni po revoked_at) -> archiwizacja, nigdy DELETE.
  UPDATE public.shared_lists
  SET archived_at = now()
  WHERE archived_at IS NULL
    AND (
      expires_at < now()
      OR revoked_at < now() - interval '7 days'
    );
  GET DIAGNOSTICS archived_count = ROW_COUNT;

  -- Fizyczne kasowanie dopiero po 12 miesiącach od archiwizacji.
  -- shared_list_views idzie kaskadą; contacts pozostaje (contact_id ON DELETE SET NULL).
  DELETE FROM public.shared_lists
  WHERE archived_at < now() - interval '12 months';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN archived_count + deleted_count;
END;
$function$;

-- ============================================================
-- 7. v_followup_today — jedno miejsce z warunkiem (inwariant 10)
-- ============================================================
CREATE OR REPLACE VIEW public.v_followup_today
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.osoba,
  c.firma,
  c.telefon,
  c.telefon_norm,
  c.email,
  c.zrodlo,
  c.krok,
  c.termin_followup,
  c.udzwig_kg,
  c.wysokosc_m,
  c.sprawdz_duplikat,
  (c.termin_followup < CURRENT_DATE) AS po_terminie,
  (c.termin_followup - CURRENT_DATE) AS dni_do_terminu
FROM public.contacts c
WHERE c.ukryty = false
  AND c.data_sprzedazy IS NULL
  AND c.termin_followup IS NOT NULL;

GRANT SELECT ON public.v_followup_today TO authenticated;
GRANT ALL ON public.v_followup_today TO service_role;