import { Product } from '@/types';
import SectionHeader from '../../editorial/SectionHeader';
import EditorialButton from '../../editorial/EditorialButton';
import { EditorialInput, EditorialSelect, EditorialTextarea } from '../EditorialField';

interface Props {
  product: Product;
  onChange: (p: Product) => void;
  onSave: () => void;
  saving: boolean;
  isCreate: boolean;
}

const Chapter02_Basic = ({ product, onChange, onSave, saving, isCreate }: Props) => {
  const set = (patch: Partial<Product>) => onChange({ ...product, ...patch });
  const setSpec = (k: string, v: string) =>
    onChange({ ...product, specs: { ...product.specs, [k]: v } });

  const valid = !!product.model?.trim() && !!product.specs?.serialNumber?.trim();
  const shortDesc = (product as any).shortDescription || '';

  return (
    <div className="space-y-6">
      <SectionHeader number="02" title="Dane podstawowe" />

      {isCreate && (
        <p className="text-xs text-editorial-muted italic border-l-2 border-editorial-accent pl-3 py-1">
          Wypełnij model i numer seryjny, aby utworzyć produkt i odblokować pozostałe rozdziały.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <EditorialInput
          label="Model"
          required
          value={product.model || ''}
          onChange={(e) => set({ model: e.target.value })}
          placeholder="np. Toyota SWE200D"
        />
        <EditorialInput
          label="Numer seryjny"
          required
          value={product.specs?.serialNumber || ''}
          onChange={(e) => setSpec('serialNumber', e.target.value)}
          placeholder="np. 12345678"
        />
      </div>

      <EditorialTextarea
        label="Krótki opis"
        rows={2}
        maxLength={300}
        value={shortDesc}
        onChange={(e) => set({ ...(product as any), shortDescription: e.target.value.slice(0, 300) } as any)}
        placeholder="1–2 zdania o produkcie (max 300 znaków)"
        hint={`${shortDesc.length}/300`}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <EditorialInput
          label="Rok produkcji"
          type="number"
          value={product.specs?.productionYear || ''}
          onChange={(e) => setSpec('productionYear', e.target.value)}
        />
        <EditorialSelect
          label="Stan techniczny"
          value={product.specs?.condition || 'bardzo-dobry'}
          onChange={(e) => setSpec('condition', e.target.value)}
          options={[
            { value: 'bardzo-dobry', label: 'Bardzo dobry' },
            { value: 'dobry', label: 'Dobry' },
            { value: 'idealny', label: 'Idealny' },
            { value: 'po-serwisie', label: 'Po serwisie' },
          ]}
        />
        <EditorialInput
          label="Etykieta stanu (opcjonalnie)"
          value={product.conditionLabel || ''}
          onChange={(e) => set({ conditionLabel: e.target.value })}
          placeholder="np. Stan jak nowy"
        />
        <EditorialInput
          label="Bateria"
          value={product.specs?.battery || ''}
          onChange={(e) => setSpec('battery', e.target.value)}
          placeholder="np. 24V 375Ah"
        />
        <EditorialSelect
          label="Dostępność"
          value={product.availabilityStatus || 'available'}
          onChange={(e) => set({ availabilityStatus: e.target.value as Product['availabilityStatus'] })}
          options={[
            { value: 'available', label: 'Dostępny' },
            { value: 'reserved', label: 'Zarezerwowany' },
            { value: 'sold', label: 'Sprzedany' },
          ]}
        />
        <EditorialInput
          label="Slug (opcjonalnie)"
          value={product.slug || ''}
          onChange={(e) => set({ slug: e.target.value })}
          hint="Pozostaw puste, aby wygenerować automatycznie"
        />
      </div>

      <div className="sticky bottom-0 z-20 bg-editorial-bg pt-4 pb-4 border-t border-editorial-line flex justify-end -mx-4 md:mx-0 px-4 md:px-0">
        <EditorialButton onClick={onSave} disabled={saving || !valid}>
          {saving ? 'Zapisuję…' : isCreate ? 'Utwórz produkt' : 'Zapisz zmiany'}
        </EditorialButton>
      </div>
    </div>
  );
};

export default Chapter02_Basic;
