-- Enum dostępności
CREATE TYPE public.availability_status AS ENUM ('available', 'reserved', 'sold');

-- Nowe kolumny w products
ALTER TABLE public.products
  ADD COLUMN availability_status public.availability_status NOT NULL DEFAULT 'available',
  ADD COLUMN condition_label text,
  ADD COLUMN short_marketing_description text,
  ADD COLUMN leasing_monthly_from_pln numeric,
  ADD COLUMN warranty_months integer NOT NULL DEFAULT 3,
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN slogan text;

-- Tabela zalet produktu
CREATE TABLE public.product_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  icon_name text NOT NULL DEFAULT 'check',
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_benefits_product ON public.product_benefits(product_id, sort_order);
ALTER TABLE public.product_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product benefits"
  ON public.product_benefits FOR SELECT USING (true);
CREATE POLICY "Only admins can insert product benefits"
  ON public.product_benefits FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update product benefits"
  ON public.product_benefits FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete product benefits"
  ON public.product_benefits FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Tabela leadów (inline formularz)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'product_page_inline',
  page_url text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit leads"
  ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can view leads"
  ON public.leads FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update leads"
  ON public.leads FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete leads"
  ON public.leads FOR DELETE USING (has_role(auth.uid(), 'admin'));