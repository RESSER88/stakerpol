ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS termin_followup_note text;

DROP FUNCTION IF EXISTS public.log_contact_activity(uuid, text, text, text, text, date, date, integer, numeric, boolean);

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
  _wyczysc_termin boolean DEFAULT false,
  _termin_note text DEFAULT NULL::text,
  _shared_list_id uuid DEFAULT NULL::uuid
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
      termin_followup_note = CASE
        WHEN coalesce(_wyczysc_termin, false) THEN NULL
        WHEN _termin_note IS NOT NULL THEN NULLIF(btrim(_termin_note), '')
        ELSE c.termin_followup_note
      END,
      data_sprzedazy = coalesce(_data_sprzedazy, c.data_sprzedazy),
      udzwig_kg = coalesce(_udzwig_kg, c.udzwig_kg),
      wysokosc_m = coalesce(_wysokosc_m, c.wysokosc_m)
  WHERE c.id = _contact_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontakt o podanym identyfikatorze nie istnieje: %', _contact_id;
  END IF;

  INSERT INTO public.contact_activities (contact_id, typ, tresc, wynik, data, shared_list_id)
  VALUES (_contact_id, _typ, _tresc, _wynik, now(), _shared_list_id)
  RETURNING id INTO _act_id;

  RETURN QUERY SELECT _act_id;
END;
$function$;