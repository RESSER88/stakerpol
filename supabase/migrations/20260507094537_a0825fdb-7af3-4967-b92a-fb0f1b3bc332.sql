
-- ============================================
-- FAQ schema enrichment for sales-driven UI
-- ============================================

-- 1. New columns
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_product_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS inline_cta_label text,
  ADD COLUMN IF NOT EXISTS inline_cta_action text;

-- 2. Backfill `category` for PL records via keyword heuristic
UPDATE public.faqs SET category = CASE
  WHEN question ~* '(UDT|serwis|regenerac|kompleksow|konserwac|pojedyncz)'
    THEN 'service_warranty'
  WHEN question ~* '(transport|dostaw|rozładun)'
    THEN 'delivery'
  WHEN question ~* '(udźwig|wysoko|akumulator|bateria|ładowani|kostk|kamienist|chłodn|bram|creep|kod błęd|koł|rolki|materiał|MTH|maszt|widł|sprawdz|stan|test)'
    THEN 'tech_specs'
  ELSE 'pre_purchase'
END
WHERE language = 'pl' AND category IS NULL;

-- 3. Propagate category from PL to other languages by display_order
UPDATE public.faqs target
SET category = pl_source.category
FROM public.faqs pl_source
WHERE target.language <> 'pl'
  AND pl_source.language = 'pl'
  AND target.display_order = pl_source.display_order
  AND target.category IS NULL;

-- 4. Fallback for any remaining NULLs
UPDATE public.faqs SET category = 'pre_purchase' WHERE category IS NULL;

-- 5. Enforce NOT NULL
ALTER TABLE public.faqs ALTER COLUMN category SET NOT NULL;

-- 6. Constraints
ALTER TABLE public.faqs DROP CONSTRAINT IF EXISTS faqs_category_check;
ALTER TABLE public.faqs ADD CONSTRAINT faqs_category_check
  CHECK (category IN ('pre_purchase', 'tech_specs', 'delivery', 'service_warranty'));

ALTER TABLE public.faqs DROP CONSTRAINT IF EXISTS faqs_inline_cta_action_check;
ALTER TABLE public.faqs ADD CONSTRAINT faqs_inline_cta_action_check
  CHECK (inline_cta_action IS NULL OR inline_cta_action IN (
    'open_inquiry_modal',
    'open_test_drive',
    'open_booking_modal',
    'link_to_contact',
    'link_to_leasing',
    'transport_quote',
    'request_callback',
    'none'
  ));

ALTER TABLE public.faqs DROP CONSTRAINT IF EXISTS faqs_cta_label_consistency;
ALTER TABLE public.faqs ADD CONSTRAINT faqs_cta_label_consistency
  CHECK (
    (inline_cta_action IS NULL AND inline_cta_label IS NULL)
    OR (inline_cta_action = 'none' AND inline_cta_label IS NULL)
    OR (inline_cta_action IS NOT NULL
        AND inline_cta_action <> 'none'
        AND inline_cta_label IS NOT NULL
        AND char_length(inline_cta_label) <= 40)
  );

-- 7. Partial index for the most common front-end query pattern
CREATE INDEX IF NOT EXISTS idx_faqs_category_featured_order
  ON public.faqs (category, is_featured DESC, display_order)
  WHERE is_active = true;
