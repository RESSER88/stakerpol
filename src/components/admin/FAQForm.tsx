import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FAQ } from '@/hooks/useSupabaseFAQ';

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
        // Reset form for new entries
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language">Język</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz język" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="display_order">Kolejność wyświetlania</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
            }
            min="0"
          />
        </div>
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <div>
          <Label className="text-sm font-semibold">Wyświetlaj na stronach</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zaznacz, gdzie pytanie ma się pojawić. Strona /faq i karty produktów działają niezależnie.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.display_locations.includes('home')}
              onChange={() => toggleLocation('home')}
              className="h-4 w-4"
            />
            <span className="text-sm">Strona główna</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.display_locations.includes('reviews')}
              onChange={() => toggleLocation('reviews')}
              className="h-4 w-4"
            />
            <span className="text-sm">Opinie klientów</span>
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="question">Pytanie</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          required
          placeholder="Wpisz pytanie..."
        />
      </div>

      <div>
        <Label htmlFor="answer">Odpowiedź</Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          required
          placeholder="Wpisz odpowiedź..."
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="is_active">Aktywne</Label>
      </div>

      <div className="flex space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Zapisywanie...' : faq ? 'Aktualizuj' : 'Dodaj'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
      </div>
    </form>
  );
};

export default FAQForm;