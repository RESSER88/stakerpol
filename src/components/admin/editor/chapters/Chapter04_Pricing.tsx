import { Product } from '@/types';
import SectionHeader from '../../editorial/SectionHeader';
import EditorialButton from '../../editorial/EditorialButton';
import { EditorialInput, EditorialSelect } from '../EditorialField';

interface Props {
  product: Product;
  onChange: (p: Product) => void;
  onSave: () => void;
  saving: boolean;
}

const Chapter04_Pricing = ({ product, onChange, onSave, saving }: Props) => {
  const set = (patch: Partial<Product>) => onChange({ ...product, ...patch });
  const mode = (product as any).priceDisplayMode || 'inquiry_only';

  return (
    <div className="space-y-6">
      <SectionHeader number="04" title="Cena & Leasing" />

      <div className="grid gap-6 md:grid-cols-2">
        <EditorialSelect
          label="Tryb wyświetlania ceny"
          value={mode}
          onChange={(e) => set({ ...(product as any), priceDisplayMode: e.target.value } as any)}
          options={[
            { value: 'inquiry_only', label: 'Tylko zapytanie' },
            { value: 'show_price', label: 'Pokaż cenę' },
          ]}
          hint='Tryb "Tylko zapytanie" ukrywa cenę netto na stronie produktu'
        />
        <EditorialInput
          label="Cena netto"
          type="number"
          value={(product as any).netPrice ?? ''}
          onChange={(e) => set({ ...(product as any), netPrice: e.target.value } as any)}
          placeholder="np. 25000"
        />
        <EditorialSelect
          label="Waluta"
          value={(product as any).priceCurrency || 'PLN'}
          onChange={(e) => set({ ...(product as any), priceCurrency: e.target.value } as any)}
          options={[
            { value: 'PLN', label: 'PLN' },
            { value: 'EUR', label: 'EUR' },
            { value: 'USD', label: 'USD' },
          ]}
        />
        <EditorialInput
          label="Leasing od (PLN/mies.)"
          type="number"
          value={product.leasingMonthlyFromPln ?? ''}
          onChange={(e) =>
            set({ leasingMonthlyFromPln: e.target.value ? Number(e.target.value) : null })
          }
          placeholder="np. 850"
          hint="Wyświetlane jako rata od X PLN/mies."
        />
        <EditorialInput
          label="Gwarancja (miesiące)"
          type="number"
          value={product.warrantyMonths ?? 3}
          onChange={(e) => set({ warrantyMonths: Number(e.target.value || 3) })}
        />
      </div>

      <div className="sticky bottom-0 z-20 bg-editorial-bg pt-4 pb-4 border-t border-editorial-line flex justify-end -mx-4 md:mx-0 px-4 md:px-0">
        <EditorialButton onClick={onSave} disabled={saving}>
          {saving ? 'Zapisuję…' : 'Zapisz zmiany'}
        </EditorialButton>
      </div>
    </div>
  );
};

export default Chapter04_Pricing;
