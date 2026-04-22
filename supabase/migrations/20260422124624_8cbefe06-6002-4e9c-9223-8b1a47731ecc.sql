-- Reset i odtworzenie polityk RLS dla public.faqs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Only admins can insert FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Only admins can update FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Only admins can delete FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can view all FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Public can view active FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can insert FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can update FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can delete FAQs" ON public.faqs;

-- Publiczny odczyt: tylko aktywne FAQ
CREATE POLICY "Public can view active FAQs"
ON public.faqs
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin widzi wszystkie FAQ (także nieaktywne)
CREATE POLICY "Admins can view all FAQs"
ON public.faqs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin może dodawać
CREATE POLICY "Admins can insert FAQs"
ON public.faqs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin może aktualizować (toggle is_active)
CREATE POLICY "Admins can update FAQs"
ON public.faqs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin może usuwać
CREATE POLICY "Admins can delete FAQs"
ON public.faqs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));