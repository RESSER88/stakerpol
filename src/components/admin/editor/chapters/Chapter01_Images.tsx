import { Product } from '@/types';
import ProductImageManager from '../../ProductImageManager';
import SectionHeader from '../../editorial/SectionHeader';
import EditorialButton from '../../editorial/EditorialButton';
import { EditorialInput } from '../EditorialField';
import { getMainImageAlt } from '@/utils/productImageAlt';

interface Props {
  images: string[];
  onChange: (imgs: string[]) => void;
  product: Product;
  onProductChange: (p: Product) => void;
  onSave: () => void;
  saving: boolean;
}

const Chapter01_Images = ({ images, onChange, product, onProductChange, onSave, saving }: Props) => {
  const altValue = product.mainImageAlt || '';
  const fallbackAlt = getMainImageAlt({ ...product, mainImageAlt: '' } as any);

  return (
    <div className="space-y-6">
      <SectionHeader number="01" title="Zdjęcia produktu" />
      <ProductImageManager
        currentImages={images}
        onImagesChange={onChange}
        maxImages={10}
        useSupabaseStorage
      />

      <EditorialInput
        label="ALT (SEO) — zdjęcie główne"
        maxLength={125}
        value={altValue}
        onChange={(e) => onProductChange({ ...product, mainImageAlt: e.target.value.slice(0, 125) })}
        placeholder={fallbackAlt || 'np. Wózek widłowy Toyota BT SWE 200D 2018'}
        hint={`${altValue.length}/125 — puste pole: „${fallbackAlt || 'brak'}”`}
      />

      <div className="sticky bottom-0 z-20 bg-editorial-bg pt-4 pb-4 border-t border-editorial-line flex justify-end -mx-4 md:mx-0 px-4 md:px-0">
        <EditorialButton onClick={onSave} disabled={saving}>
          {saving ? 'Zapisuję…' : 'Zapisz zmiany'}
        </EditorialButton>
      </div>
    </div>
  );
};

export default Chapter01_Images;
