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
      <div className="sticky bottom-0 z-20 bg-editorial-bg pt-4 pb-4 border-t border-editorial-line flex justify-end -mx-4 md:mx-0 px-4 md:px-0">
        <EditorialButton onClick={onSave} disabled={saving}>
          {saving ? 'Zapisuję…' : 'Zapisz zmiany'}
        </EditorialButton>
      </div>
    </div>
  );
};

export default Chapter01_Images;
