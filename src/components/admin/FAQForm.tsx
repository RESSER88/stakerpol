import React, { useState, useEffect } from 'react';
import { FAQ, FAQCategory, useSupabaseFAQ } from '@/hooks/useSupabaseFAQ';
import { EditorialInput, EditorialTextarea, EditorialSelect, FieldWrap } from '@/components/admin/editor/EditorialField';
import EditorialButton from '@/components/admin/editorial/EditorialButton';
import ProductMultiSelect from './ProductMultiSelect';

interface FAQFormProps {
  faq?: FAQ;
  onSubmit: (data: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const CATEGORY_OPTIONS: { value: FAQCategory; label: string }[] = [
  { value: 'pre_purchase', label: 'Przed zakupem' },
  { value: 'tech_specs', label: 'Specyfikacja techniczna' },
  { value: 'delivery', label: 'Dostawa i transport' },
  { value: 'service_warranty', label: 'Serwis i gwarancja' },
];

const CTA_ACTION_OPTIONS = [
  { value: '', label: 'Brak CTA' },
  { value: 'open_inquiry_modal', label: 'Formularz zapytania' },
  { value: 'open_test_drive', label: 'Umów test wózka' },
  { value: 'open_booking_modal', label: 'Umów wizytę' },
  { value: 'link_to_contact', label: 'Przejdź do kontaktu' },
  { value: 'link_to_leasing', label: 'Leasing' },
  { value: 'transport_quote', label: 'Wycena transportu' },
  { value: 'request_callback', label: 'Poproś o oddzwonienie' },
];

type FormData = {
  language: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  display_locations: string[];
  category: FAQCategory;
  is_featured: boolean;
  linked_product_ids: string[];
  inline_cta_action: string | null;
  inline_cta_label: string | null;
};

const FAQForm: React.FC<FAQFormProps> = ({ faq, onSubmit, onCancel }) => {
  const { fetchFeaturedCountByLanguage } = useSupabaseFAQ();
  const [formData, setFormData] = useState<FormData>({
    language: 'pl',
    question: '',
    answer: '',
    display_order: 0,
    is_active: true,
    display_locations: [],
    category: 'pre_purchase',
    is_featured: false,
    linked_product_ids: [],
    inline_cta_action: null,
    inline_cta_label: null,
  });
  const [loading, setLoading] = useState(false);
  const [featuredCount, setFeaturedCount] = useState<number>(0);

  useEffect(() => {
    if (faq) {
      setFormData({
        language: faq.language,
        question: faq.question,
        answer: faq.answer,
        display_order: faq.display_order,
        is_active: faq.is_active,
        display_locations: faq.display_locations ?? [],
        category: faq.category ?? 'pre_purchase',
        is_featured: faq.is_featured ?? false,
        linked_product_ids: faq.linked_product_ids ?? [],
        inline_cta_action: faq.inline_cta_action ?? null,
        inline_cta_label: faq.inline_cta_label ?? null,
      });
    }
  }, [faq]);

  // Refresh featured count whenever language changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await fetchFeaturedCountByLanguage(formData.language);
      if (!cancelled) setFeaturedCount(c);
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.language, formData.is_featured]);

  const toggleLocation = (loc: string) => {
    setFormData((prev) => ({
      ...prev,
      display_locations: prev.display_locations.includes(loc)
        ? prev.display_locations.filter((l) => l !== loc)
        : [...prev.display_locations, loc],
    }));
  };

  const ctaActive = !!formData.inline_cta_action && formData.inline_cta_action !== 'none';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ctaActive && !(formData.inline_cta_label || '').trim()) {
      alert('Podaj tekst przycisku CTA lub wybierz "Brak CTA".');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        ...formData,
        inline_cta_action: ctaActive ? formData.inline_cta_action : null,
        inline_cta_label: ctaActive ? (formData.inline_cta_label || '').trim() : null,
      };
      await onSubmit(payload as any);
      if (!faq) {
        setFormData({
          language: 'pl',
          question: '',
          answer: '',
          display_order: 0,
          is_active: true,
          display_locations: [],
          category: 'pre_purchase',
          is_featured: false,
          linked_product_ids: [],
          inline_cta_action: null,
          inline_cta_label: null,
        });
      }
    } catch (error) {
      console.error('Error submitting FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { value: 'pl', label: 'Polski' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'cs', label: 'Čeština' },
    { value: 'sk', label: 'Slovenčina' },
  ];

  const labelLength = (formData.inline_cta_label || '').length;
  const overLimit = labelLength > 40;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[70vh] -mx-6 -mb-6">
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditorialSelect
          label="Język"
          required
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          options={languages}
        />

        <EditorialSelect
          label="Kategoria"
          required
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as FAQCategory })}
          options={CATEGORY_OPTIONS}
        />

        <EditorialInput
          label="Kolejność wyświetlania"
          type="number"
          min={0}
          value={formData.display_order}
          onChange={(e) =>
            setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
          }
        />
      </div>

      <div className="border border-editorial-line p-4 space-y-3">
        <div>
          <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
            Wyświetlaj na stronach
          </span>
          <p className="text-[11px] text-editorial-muted mt-1 italic">
            Zaznacz, gdzie pytanie ma się pojawić. Strona /faq i karty produktów działają niezależnie.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.display_locations.includes('home')}
              onChange={() => toggleLocation('home')}
              className="h-4 w-4 accent-editorial-accent"
            />
            <span className="text-sm text-editorial-ink">Strona główna</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.display_locations.includes('reviews')}
              onChange={() => toggleLocation('reviews')}
              className="h-4 w-4 accent-editorial-accent"
            />
            <span className="text-sm text-editorial-ink">Opinie klientów</span>
          </label>
        </div>
      </div>

      <EditorialInput
        label="Pytanie"
        required
        value={formData.question}
        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
        placeholder="Wpisz pytanie..."
      />

      <EditorialTextarea
        label="Odpowiedź"
        required
        rows={5}
        value={formData.answer}
        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
        placeholder="Wpisz odpowiedź..."
      />

      <FieldWrap label="Powiązane produkty (max 3)" hint="Opcjonalne. Pojawią się jako kontekst pytania.">
        <ProductMultiSelect
          value={formData.linked_product_ids}
          onChange={(ids) => setFormData({ ...formData, linked_product_ids: ids })}
          maxItems={3}
        />
      </FieldWrap>

      {/* Mini-CTA section */}
      <div className="border border-editorial-line p-4 space-y-3">
        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
          Mini-CTA pod odpowiedzią
        </span>
        <EditorialSelect
          label="Akcja CTA"
          value={formData.inline_cta_action ?? ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              inline_cta_action: e.target.value === '' ? null : e.target.value,
              inline_cta_label: e.target.value === '' || e.target.value === 'none' ? null : formData.inline_cta_label,
            })
          }
          options={CTA_ACTION_OPTIONS}
        />
        {ctaActive && (
          <div>
            <EditorialInput
              label="Tekst przycisku CTA"
              required
              maxLength={40}
              value={formData.inline_cta_label ?? ''}
              onChange={(e) => setFormData({ ...formData, inline_cta_label: e.target.value })}
              placeholder="np. Umów test, Wyceń transport"
            />
            <p className={`text-[11px] mt-1 italic ${overLimit ? 'text-editorial-bad' : 'text-editorial-muted'}`}>
              {labelLength} / 40 znaków
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 accent-editorial-accent"
          />
          <span className="text-sm text-editorial-ink">Aktywne</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_featured}
            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
            className="h-4 w-4 accent-editorial-accent"
          />
          <span className="text-sm text-editorial-ink">Wyróżnione (blok sprzedażowy)</span>
        </label>
        <p
          className={`text-[11px] italic pl-6 ${
            featuredCount >= 5 ? 'text-editorial-accent' : 'text-editorial-muted'
          }`}
        >
          Wyróżnionych w tym języku: {featuredCount} / 5 zalecanych
          {featuredCount >= 5 && ' — przekroczono zalecaną liczbę.'}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-editorial-line">
        <EditorialButton type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </EditorialButton>
        <EditorialButton type="submit" variant="solid" disabled={loading}>
          {loading ? 'Zapisywanie…' : faq ? 'Aktualizuj' : 'Dodaj'}
        </EditorialButton>
      </div>
    </form>
  );
};

export default FAQForm;
