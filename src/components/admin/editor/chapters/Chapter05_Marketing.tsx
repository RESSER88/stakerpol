import { Product } from '@/types';
import SectionHeader from '../../editorial/SectionHeader';
import EditorialButton from '../../editorial/EditorialButton';
import { EditorialInput, EditorialTextarea } from '../EditorialField';
import BenefitsEditor, { BenefitDraft } from '../../BenefitsEditor';
import FaqMultiSelect from './FaqMultiSelect';

interface Props {
  product: Product;
  onChange: (p: Product) => void;
  benefits: BenefitDraft[];
  onBenefitsChange: (b: BenefitDraft[]) => void;
  onSave: () => void;
  saving: boolean;
}

const Chapter05_Marketing = ({
  product,
  onChange,
  benefits,
  onBenefitsChange,
  onSave,
  saving,
}: Props) => {
  const set = (patch: Partial<Product>) => onChange({ ...product, ...patch });

  return (
    <div className="space-y-8">
      <SectionHeader number="05" title="Marketing" />

      <div className="space-y-6">
        <EditorialTextarea
          label="Krótki opis marketingowy"
          rows={3}
          value={product.shortMarketingDescription || ''}
          onChange={(e) => set({ shortMarketingDescription: e.target.value })}
          placeholder="2–3 zdania na karcie produktu i w hero"
        />

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!product.isFeatured}
            onChange={(e) => set({ isFeatured: e.target.checked })}
            className="h-4 w-4 accent-editorial-ink"
          />
          <span className="text-sm text-editorial-ink">
            Wyróżnij produkt na stronie głównej
          </span>
        </label>
      </div>

      <div className="space-y-3 pt-4 border-t border-editorial-line">
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
            Zalety produktu
          </h3>
          <p className="text-xs text-editorial-muted mt-1">Maks. 3 pozycje</p>
        </div>
        <BenefitsEditor benefits={benefits} onChange={onBenefitsChange} />
      </div>

      <div className="space-y-3 pt-4 border-t border-editorial-line">
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
            Powiązane FAQ
          </h3>
          <p className="text-xs text-editorial-muted mt-1">Maks. 4 pytania (język PL)</p>
        </div>
        <FaqMultiSelect
          selectedIds={product.faqIds || []}
          onChange={(ids) => set({ faqIds: ids })}
          max={4}
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

export default Chapter05_Marketing;
