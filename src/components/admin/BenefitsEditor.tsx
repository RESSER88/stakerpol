import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export interface BenefitDraft {
  icon_name: string;
  title: string;
  description: string;
}

const ICONS = ['check', 'battery', 'shield', 'zap', 'award', 'wrench', 'truck', 'clock'];

interface Props {
  benefits: BenefitDraft[];
  onChange: (next: BenefitDraft[]) => void;
}

const BenefitsEditor = ({ benefits, onChange }: Props) => {
  const update = (idx: number, patch: Partial<BenefitDraft>) => {
    const next = benefits.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    onChange(next);
  };
  const add = () => {
    if (benefits.length >= 3) return;
    onChange([...benefits, { icon_name: 'check', title: '', description: '' }]);
  };
  const remove = (idx: number) => {
    onChange(benefits.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {benefits.length === 0 && (
        <p className="text-sm text-muted-foreground">Brak zalet. Dodaj do 3 pozycji.</p>
      )}
      {benefits.map((b, idx) => (
        <div key={idx} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex gap-2 items-start">
            <div className="w-32">
              <label className="block text-xs font-medium mb-1">Ikona</label>
              <select
                value={b.icon_name}
                onChange={(e) => update(idx, { icon_name: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm"
              >
                {ICONS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Tytuł</label>
              <Input
                value={b.title}
                onChange={(e) => update(idx, { title: e.target.value })}
                placeholder="np. Wbudowany prostownik"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(idx)}
              className="mt-5 text-destructive"
              aria-label="Usuń"
            >
              <Trash2 size={16} />
            </Button>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Opis</label>
            <Textarea
              value={b.description}
              onChange={(e) => update(idx, { description: e.target.value })}
              placeholder="Krótkie zdanie opisujące zaletę"
              rows={2}
            />
          </div>
        </div>
      ))}
      {benefits.length < 3 && (
        <Button type="button" variant="outline" onClick={add} size="sm">
          <Plus size={14} className="mr-1" /> Dodaj zaletę ({benefits.length}/3)
        </Button>
      )}
    </div>
  );
};

export default BenefitsEditor;
