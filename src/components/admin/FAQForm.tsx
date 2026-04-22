import React, { useState, useEffect } from 'react';
import { FAQ } from '@/hooks/useSupabaseFAQ';
import { EditorialInput, EditorialTextarea, EditorialSelect } from '@/components/admin/editor/EditorialField';
import EditorialButton from '@/components/admin/editorial/EditorialButton';

interface FAQFormProps {
  faq?: FAQ;
  onSubmit: (data: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const FAQForm: React.FC<FAQFormProps> = ({ faq, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{
    language: string;
    question: string;
    answer: string;
    display_order: number;
    is_active: boolean;
    display_locations: string[];
  }>({
    language: 'pl',
    question: '',
    answer: '',
    display_order: 0,
    is_active: true,
    display_locations: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (faq) {
      setFormData({
        language: faq.language,
        question: faq.question,
        answer: faq.answer,
        display_order: faq.display_order,
        is_active: faq.is_active,
        display_locations: faq.display_locations ?? [],
      });
    }
  }, [faq]);

  const toggleLocation = (loc: string) => {
    setFormData((prev) => ({
      ...prev,
      display_locations: prev.display_locations.includes(loc)
        ? prev.display_locations.filter((l) => l !== loc)
        : [...prev.display_locations, loc],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      if (!faq) {
        setFormData({
          language: 'pl',
          question: '',
          answer: '',
          display_order: 0,
          is_active: true,
          display_locations: [],
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditorialSelect
          label="Język"
          required
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          options={languages}
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

      <label className="flex items-center gap-2.5 cursor-pointer pt-1">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="h-4 w-4 accent-editorial-accent"
        />
        <span className="text-sm text-editorial-ink">Aktywne</span>
      </label>

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
