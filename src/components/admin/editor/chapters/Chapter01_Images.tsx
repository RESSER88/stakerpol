import ProductImageManager from '../../ProductImageManager';
import SectionHeader from '../../editorial/SectionHeader';
import EditorialButton from '../../editorial/EditorialButton';

interface Props {
  images: string[];
  onChange: (imgs: string[]) => void;
  onSave: () => void;
  saving: boolean;
}

const Chapter01_Images = ({ images, onChange, onSave, saving }: Props) => {
  return (
    <div className="space-y-6">
      <SectionHeader number="01" title="Zdjęcia produktu" />
      <ProductImageManager
        currentImages={images}
        onImagesChange={onChange}
        maxImages={10}
        useSupabaseStorage
      />
      <div className="sticky bottom-0 bg-editorial-bg pt-4 pb-2 border-t border-editorial-line flex justify-end">
        <EditorialButton onClick={onSave} disabled={saving}>
          {saving ? 'Zapisuję…' : 'Zapisz zmiany'}
        </EditorialButton>
      </div>
    </div>
  );
};

export default Chapter01_Images;
