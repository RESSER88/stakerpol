-- Rozszerzenie tabeli leads o pola nowego formularza kontaktowego (HomeHeroForm)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS rodo_accepted BOOLEAN NOT NULL DEFAULT false;

-- Rozluźnienie wymagania na phone (nowy formularz pozwala na sam email + wiadomość, ale walidacja klient-side wymaga tel)
-- Zachowujemy NOT NULL na phone żeby wymusić podanie telefonu również w nowym formularzu (zgodnie z UX z promptu — required)
-- (brak zmian dla phone)

-- Limity długości — ochrona przed nadużyciem
ALTER TABLE public.leads
  ADD CONSTRAINT leads_name_length CHECK (name IS NULL OR char_length(name) <= 120),
  ADD CONSTRAINT leads_email_length CHECK (email IS NULL OR char_length(email) <= 255),
  ADD CONSTRAINT leads_message_length CHECK (message IS NULL OR char_length(message) <= 2000),
  ADD CONSTRAINT leads_phone_length CHECK (char_length(phone) <= 32);

-- Indeks na source dla filtrowania w panelu admin
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- RLS pozostaje bez zmian:
--   * Public can submit leads (INSERT) — pozostaje
--   * Only admins can view/update/delete — pozostaje