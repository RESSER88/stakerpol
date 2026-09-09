ALTER TABLE public.shared_lists ADD COLUMN IF NOT EXISTS channel_detail text;

ALTER TABLE public.shared_lists DROP CONSTRAINT shared_lists_channel_check;
ALTER TABLE public.shared_lists ADD CONSTRAINT shared_lists_channel_check CHECK (
  channel IS NULL OR channel = ANY (ARRAY[
    'email','whatsapp','sms','telefon',
    'facebook','youtube','instagram','allegro','olx','google','chatgpt','powracajacy','inne'
  ])
);

CREATE OR REPLACE FUNCTION public.create_offer(
  _token text,
  _filters jsonb,
  _nazwa text,
  _telefon text,
  _email text DEFAULT NULL::text,
  _tygodnie integer DEFAULT 2,
  _notatka text DEFAULT NULL::text,
  _kanal text DEFAULT NULL::text,
  _renewed_from uuid DEFAULT NULL::uuid,
  _firma text DEFAULT NULL::text,
  _kanal_detail text DEFAULT NULL::text
)
RETURNS TABLE(shared_list_id uuid, contact_id uuid, token text, kontakt_nowy boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _nazwa_t text := btrim(coalesce(_nazwa, ''));
  _telefon_t text := btrim(coalesce(_telefon, ''));
  _firma_t text := btrim(coalesce(_firma, ''));
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
  IF _tygodnie IS NULL OR _tygodnie < 1 OR _tygodnie > 4 THEN
    RAISE EXCEPTION 'Liczba tygodni musi mieszczic sie w zakresie 1-4';
  END IF;
  IF _token IS NULL OR btrim(_token) = '' THEN
    RAISE EXCEPTION 'Token jest wymagany';
  END IF;

  _phone_norm := CASE WHEN _telefon_t = '' THEN NULL ELSE public.norm_phone(_telefon_t) END;
  _mail_norm := CASE WHEN _email IS NULL OR btrim(_email) = '' THEN NULL ELSE public.norm_email(_email) END;

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

    INSERT INTO public.contacts (osoba, firma, telefon, email, zrodlo, krok, sprawdz_duplikat)
    VALUES (
      _nazwa_t,
      NULLIF(_firma_t, ''),
      NULLIF(_telefon_t, ''),
      NULLIF(btrim(coalesce(_email, '')), ''),
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
  ELSIF _firma_t <> '' THEN
    -- Dopisz firmę tylko gdy kontakt jej nie ma — nie nadpisuj istniejących danych.
    UPDATE public.contacts c
    SET firma = _firma_t
    WHERE c.id = _contact_id AND (c.firma IS NULL OR btrim(c.firma) = '');
  END IF;

  INSERT INTO public.shared_lists (
    token, filters, label, created_by, expires_at, contact_id, note, channel, channel_detail, sent_at, renewed_from
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
    _kanal_detail,
    CASE WHEN _kanal IS NOT NULL THEN now() ELSE NULL END,
    _renewed_from
  )
  RETURNING id INTO _list_id;

  INSERT INTO public.contact_activities (contact_id, typ, shared_list_id, tresc, data)
  VALUES (_contact_id, 'oferta', _list_id, _notatka, now());

  RETURN QUERY SELECT _list_id, _contact_id, _token, _new;
END;
$function$;