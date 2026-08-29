-- 1. create_offer: dopisanie opcjonalnego parametru _renewed_from NA KOŃCU listy.
--    NewOfferView.tsx woła funkcję argumentami nazwanymi, więc dopisanie nie łamie wywołania.
DROP FUNCTION IF EXISTS public.create_offer(text, jsonb, text, text, text, integer, text, text);

CREATE OR REPLACE FUNCTION public.create_offer(
  _token text,
  _filters jsonb,
  _nazwa text,
  _telefon text,
  _email text DEFAULT NULL::text,
  _tygodnie integer DEFAULT 2,
  _notatka text DEFAULT NULL::text,
  _kanal text DEFAULT NULL::text,
  _renewed_from uuid DEFAULT NULL::uuid
)
RETURNS TABLE(shared_list_id uuid, contact_id uuid, token text, kontakt_nowy boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
    token, filters, label, created_by, expires_at, contact_id, note, channel, sent_at, renewed_from
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
    CASE WHEN _kanal IS NOT NULL THEN now() ELSE NULL END,
    _renewed_from
  )
  RETURNING id INTO _list_id;

  INSERT INTO public.contact_activities (contact_id, typ, shared_list_id, tresc, data)
  VALUES (_contact_id, 'oferta', _list_id, _notatka, now());

  RETURN QUERY SELECT _list_id, _contact_id, _token, _new;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_offer(text, jsonb, text, text, text, integer, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_offer(text, jsonb, text, text, text, integer, text, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_offer(text, jsonb, text, text, text, integer, text, text, uuid) TO authenticated;

-- 2. import_lead_to_contact: jedno zgloszenie z leads -> kartoteka kontaktow.
CREATE OR REPLACE FUNCTION public.import_lead_to_contact(_lead_id uuid)
RETURNS TABLE(contact_id uuid, kontakt_nowy boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _lead public.leads;
  _mail_norm text;
  _phone_norm text;
  _cid uuid;
  _new boolean := false;
BEGIN
  SELECT * INTO _lead FROM public.leads WHERE id = _lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Zgloszenie o podanym identyfikatorze nie istnieje: %', _lead_id;
  END IF;

  -- Idempotencja: jesli zgloszenie juz jest w historii, zwroc istniejacy kontakt.
  SELECT ca.contact_id INTO _cid
  FROM public.contact_activities ca
  WHERE ca.lead_id = _lead_id
  LIMIT 1;
  IF _cid IS NOT NULL THEN
    RETURN QUERY SELECT _cid, false;
    RETURN;
  END IF;

  _mail_norm := public.norm_email(_lead.email);
  -- norm_phone zwraca NULL dla wartosci z '@' (w leads.phone czesto siedzi e-mail).
  _phone_norm := public.norm_phone(_lead.phone);

  PERFORM pg_advisory_xact_lock(hashtext(coalesce(_mail_norm, _phone_norm, _lead_id::text)));

  IF _mail_norm IS NOT NULL THEN
    SELECT c.id INTO _cid
    FROM public.contacts c
    WHERE c.ukryty = false AND c.email_norm = _mail_norm
    ORDER BY c.utworzony
    LIMIT 1;
  END IF;

  IF _cid IS NULL AND _phone_norm IS NOT NULL THEN
    SELECT c.id INTO _cid
    FROM public.contacts c
    WHERE c.ukryty = false AND c.telefon_norm = _phone_norm
    ORDER BY c.utworzony
    LIMIT 1;
  END IF;

  IF _cid IS NULL THEN
    INSERT INTO public.contacts (osoba, telefon, email, zrodlo, krok)
    VALUES (_lead.name, _lead.phone, _lead.email, 'www', 'nowy')
    RETURNING id INTO _cid;
    _new := true;
  ELSE
    -- Uzupelniamy WYLACZNIE puste pola; krok i termin_followup pozostaja nietkniete.
    UPDATE public.contacts c
    SET osoba = coalesce(c.osoba, _lead.name),
        telefon = coalesce(c.telefon, _lead.phone),
        email = coalesce(c.email, _lead.email),
        sprawdz_duplikat = true
    WHERE c.id = _cid;
  END IF;

  INSERT INTO public.contact_activities (contact_id, typ, lead_id, tresc, data)
  VALUES (_cid, 'formularz', _lead_id, _lead.message, _lead.created_at);

  RETURN QUERY SELECT _cid, _new;

EXCEPTION WHEN unique_violation THEN
  -- Rownolegle wywolanie zdazylo wstawic wpis dla tego lead_id.
  SELECT ca.contact_id INTO _cid
  FROM public.contact_activities ca
  WHERE ca.lead_id = _lead_id
  LIMIT 1;
  RETURN QUERY SELECT _cid, false;
END;
$function$;

REVOKE ALL ON FUNCTION public.import_lead_to_contact(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_lead_to_contact(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.import_lead_to_contact(uuid) TO authenticated;

-- 3. log_contact_activity: aktualizacja kontaktu + wpis w historii w jednej transakcji.
--    Rozroznienie "nie zmieniaj" od "wyczysc": osobny parametr boolean _wyczysc_termin
--    (czytelniejszy od sentinela z magiczna data). _termin_followup = NULL przy
--    _wyczysc_termin = false oznacza "pole bez zmian"; _wyczysc_termin = true czysci pole.
CREATE OR REPLACE FUNCTION public.log_contact_activity(
  _contact_id uuid,
  _typ text,
  _tresc text DEFAULT NULL::text,
  _wynik text DEFAULT NULL::text,
  _krok text DEFAULT NULL::text,
  _termin_followup date DEFAULT NULL::date,
  _data_sprzedazy date DEFAULT NULL::date,
  _udzwig_kg integer DEFAULT NULL::integer,
  _wysokosc_m numeric DEFAULT NULL::numeric,
  _wyczysc_termin boolean DEFAULT false
)
RETURNS TABLE(activity_id uuid)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _act_id uuid;
BEGIN
  IF _contact_id IS NULL THEN
    RAISE EXCEPTION 'Identyfikator kontaktu jest wymagany';
  END IF;
  IF _typ IS NULL OR btrim(_typ) = '' THEN
    RAISE EXCEPTION 'Typ wpisu jest wymagany';
  END IF;
  IF _krok = 'kupil' THEN
    RAISE EXCEPTION 'Krok nie moze przyjac wartosci kupil';
  END IF;

  UPDATE public.contacts c
  SET krok = coalesce(_krok, c.krok),
      termin_followup = CASE
        WHEN coalesce(_wyczysc_termin, false) THEN NULL
        ELSE coalesce(_termin_followup, c.termin_followup)
      END,
      data_sprzedazy = coalesce(_data_sprzedazy, c.data_sprzedazy),
      udzwig_kg = coalesce(_udzwig_kg, c.udzwig_kg),
      wysokosc_m = coalesce(_wysokosc_m, c.wysokosc_m)
  WHERE c.id = _contact_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontakt o podanym identyfikatorze nie istnieje: %', _contact_id;
  END IF;

  INSERT INTO public.contact_activities (contact_id, typ, tresc, wynik, data)
  VALUES (_contact_id, _typ, _tresc, _wynik, now())
  RETURNING id INTO _act_id;

  RETURN QUERY SELECT _act_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_contact_activity(uuid, text, text, text, text, date, date, integer, numeric, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_contact_activity(uuid, text, text, text, text, date, date, integer, numeric, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_contact_activity(uuid, text, text, text, text, date, date, integer, numeric, boolean) TO authenticated;