import { Product } from '@/types';
import SectionHeader from '../../editorial/SectionHeader';
import EditorialButton from '../../editorial/EditorialButton';
import { EditorialInput, EditorialTextarea } from '../EditorialField';

interface Props {
  product: Product;
  onChange: (p: Product) => void;
  onSave: () => void;
  saving: boolean;
}

const Chapter03_Technical = ({ product, onChange, onSave, saving }: Props) => {
  const setSpec = (k: string, v: string) =>
    onChange({ ...product, specs: { ...product.specs, [k]: v } });

  return (
    <div className="space-y-6">
      <SectionHeader number="03" title="Dane techniczne" />

      <div className="grid gap-6 md:grid-cols-2">
        <EditorialInput
          label="Udźwig — maszt [kg]"
          type="number"
          value={product.specs?.mastLiftingCapacity || ''}
          onChange={(e) => setSpec('mastLiftingCapacity', e.target.value)}
        />
        <EditorialInput
          label="Udźwig — wstępne podnoszenie [kg]"
          type="number"
          value={product.specs?.preliminaryLiftingCapacity || ''}
          onChange={(e) => setSpec('preliminaryLiftingCapacity', e.target.value)}
        />
        <EditorialInput
          label="Wysokość podnoszenia [mm]"
          type="number"
          value={product.specs?.liftHeight || ''}
          onChange={(e) => setSpec('liftHeight', e.target.value)}
        />
        <EditorialInput
          label="Wysokość konstrukcyjna [mm]"
          type="number"
          value={product.specs?.minHeight || ''}
          onChange={(e) => setSpec('minHeight', e.target.value)}
        />
        <EditorialInput
          label="Godziny pracy [mh]"
          type="number"
          value={product.specs?.workingHours || ''}
          onChange={(e) => setSpec('workingHours', e.target.value)}
        />
        <EditorialInput
          label="Wolny skok [mm]"
          type="number"
          value={product.specs?.freeStroke || ''}
          onChange={(e) => setSpec('freeStroke', e.target.value)}
        />
        <EditorialInput
          label="Wstępne podnoszenie"
          value={product.specs?.preliminaryLifting || ''}
          onChange={(e) => setSpec('preliminaryLifting', e.target.value)}
        />
        <EditorialInput
          label="Rodzaj napędu"
          value={product.specs?.driveType || ''}
          onChange={(e) => setSpec('driveType', e.target.value)}
        />
        <EditorialInput
          label="Maszt"
          value={product.specs?.mast || ''}
          onChange={(e) => setSpec('mast', e.target.value)}
        />
        <EditorialInput
          label="Wymiary (dł./szer.) [mm]"
          value={product.specs?.dimensions || ''}
          onChange={(e) => setSpec('dimensions', e.target.value)}
        />
        <EditorialInput
          label="Koła"
          value={product.specs?.wheels || ''}
          onChange={(e) => setSpec('wheels', e.target.value)}
        />
        <EditorialInput
          label="Składany podest dla operatora"
          value={product.specs?.operatorPlatform || ''}
          onChange={(e) => setSpec('operatorPlatform', e.target.value)}
        />
        <EditorialTextarea
          label="Opcje dodatkowe"
          value={product.specs?.additionalOptions || ''}
          onChange={(e) => setSpec('additionalOptions', e.target.value)}
          wrapClassName="md:col-span-2"
          rows={2}
        />
        <EditorialTextarea
          label="Opis dodatkowy"
          value={product.specs?.additionalDescription || ''}
          onChange={(e) => setSpec('additionalDescription', e.target.value)}
          wrapClassName="md:col-span-2"
          rows={3}
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

export default Chapter03_Technical;
