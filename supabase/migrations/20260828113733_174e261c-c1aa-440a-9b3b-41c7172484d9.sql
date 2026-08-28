BEGIN;
ALTER TABLE public.contact_activities DROP CONSTRAINT contact_activities_typ_check;
ALTER TABLE public.contact_activities ADD CONSTRAINT contact_activities_typ_check CHECK (typ IN ('telefon','formularz','oferta','sprzedaz','cofniecie_sprzedazy','ukrycie','notatka'));
COMMIT;