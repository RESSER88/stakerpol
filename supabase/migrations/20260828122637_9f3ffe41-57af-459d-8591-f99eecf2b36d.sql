CREATE OR REPLACE FUNCTION public.create_offer(
  _token text,
  _filters jsonb,
  _nazwa text,
  _telefon text,
  _email text DEFAULT NULL,
  _tygodnie integer DEFAULT 2,
  _notatka text DEFAULT NULL,
  _kanal text DEFAULT NULL
)
RETURNS TABLE (shared_list_id uuid, contact_id uuid, token text, kontakt_nowy boolean)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _nazwa_t text := btrim(coalesce(_nazwa, ''));
  _telefon_t text := btrim(coalesce(_telefon, ''));
  _phone_norm text;
  _mail_norm text;
  _contact_id uuid;
  _new boolean := false;
  _list_id uuid;
  _firma_norm text;
BEGIN
  IF _nazwa_t = '' THEN
    RAISE EXCEPTION 'Nazwa jest wymagana';
  END IF;
  IF _telefon_t = '' THEN
    RAISE EXCEPTION 'Telefon jest wymagany';
  END IF;
  IF _tygonie_dummy_check() IS NULL THEN
    NULL;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.create_offer(text, jsonb, text, text, text, integer, text, text);

CREATE FUNCTION public.create_offer(
  _token text,
  _filters jsonb,
  _nazwa text,
  _telefon text,
  _email text DEFAULT NULL,
  _tygodnie integer DEFAULT 2,
  _notatka text DEFAULT NULL,
  _kanal text DEFAULT NULL
)
RETURNS TABLE (shared_list_id uuid, contact_id uuid, token text, kontakt_nowy boolean)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _nazwa_t text := btrim(coalesce(_nazwa, ''));
  _telefon_t text := btrim(coalesce(_telefon, ''));
  _phone_norm text;
  _mail_norm text;
  _contact_id uuid;
  _new boolean := false;
  _list_id uuid;
  _firma_norm text;
BEGIN
  IF _nazwa_t = '' THEN
    RAISE EXCEPTION 'Nazwa jest wymagana';
  END IF;
  IF _telefon_t = '' THEN
    RAISE EXCEPTION 'Telefon jest wymagany';
  END IF;
  IF _tygodnie IS NULL OR _tygodnie < 1 OR _tygodnie > 4 THEN
    RAISE EXCEPTION 'Liczba tygodni musi mieszczic sie w zakresie 1-4';
  END IF;
  IF _token IS NULL OR btrim(_token) = '' THEN
    RAISE EXCEPTION 'Token jest wymagany';
  END IF;

  _phone_norm := public.norm_phone(_telefon_t);
  _mail_norm := CASE WHEN _email IS NULL THEN NULL ELSE public.norm_email(_email) END;

  PERFORM pg_advisory_xact_lock(hashtext(coalesce(_phone_norm, _mail_norm, _token)));

  IF _phone_norm IS NOT NULL THEN
    SELECT c.id INTO _contact_id
    FROM public.contacts c
    WHERE c.ukryty = false AND c.telefon_norm = _phone_norm
    ORDER BY c.utworzony
    LIMIT 1;
  END IF;

  IF _contact_id IS NULL AND _mail_norm IS NOT NULL THEN
    SELECT c.id INTO _contact_id
    FROM public.contacts c
    WHERE c.ukryty = false AND c.email_norm = _mail_norm
    ORDER BY c.utworzony
    LIMIT 1;
  END IF;

  IF _contact_id IS NULL THEN
    _firma_norm := public.norm_company(_nazwa_t);

    INSERT INTO public.contacts (osoba, telefon, email, zrodlo, krok, sprawdz_duplikat)
    VALUES (
      _nazwa_t,
      _telefon_t,
      _email,
      'telefon',
      'oferta',
      CASE
        WHEN _firma_norm IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.contacts c2
          WHERE c2.ukryty = false AND c2.firma_norm = _firma_norm
        ) THEN true
        ELSE false
      END
    )
    RETURNING id INTO _contact_id;

    _new := true;
  END IF;

  INSERT INTO public.shared_lists (
    token, filters, label, created_by, expires_at, contact_id, note, channel, sent_at
  )
  VALUES (
    _token,
    _filters,
    _nazwa_t,
    auth.uid(),
    now() + (_tygodnie * interval '7 days'),
    _contact_id,
    _notatka,
    _kanal,
    CASE WHEN _kanal IS NOT NULL THEN now() ELSE NULL END
  )
  RETURNING id INTO _list_id;

  INSERT INTO public.contact_activities (contact_id, typ, shared_list_id, tresc, data)
  VALUES (_contact_id, 'oferta', _list_id, _notatka, now());

  RETURN QUERY SELECT _list_id, _contact_id, _token, _new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_offer(text, jsonb, text, text, text, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_offer(text, jsonb, text, text, text, integer, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_offer(text, jsonb, text, text, text, integer, text, text) TO authenticated;