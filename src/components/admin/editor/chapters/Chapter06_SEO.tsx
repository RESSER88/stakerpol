import { Product } from '@/types';
import { useProductSEO } from '@/hooks/useProductSEO';
import { EditorialInput, EditorialSelect, FieldWrap } from '../EditorialField';
import { useEffect, useState } from 'react';

interface Props {
  product: Product;
}

const Chapter06_SEO = ({ product }: Props) => {
  const { seoSettings, isLoading, updateSEOSettings, isUpdating } = useProductSEO(product.id || '');

  const [gtin, setGtin] = useState('');
  const [mpn, setMpn] = useState('');
  const [availability, setAvailability] = useState<'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued'>('InStock');
  const [itemCondition, setItemCondition] = useState<'NewCondition' | 'UsedCondition' | 'RefurbishedCondition' | 'DamagedCondition'>('UsedCondition');
  const [priceValidUntil, setPriceValidUntil] = useState('');
  const [enableSchema, setEnableSchema] = useState(true);

  useEffect(() => {
    if (seoSettings) {
      setGtin(seoSettings.gtin || '');
      setMpn(seoSettings.mpn || '');
      setAvailability(seoSettings.availability || 'InStock');
      setItemCondition(seoSettings.item_condition || 'UsedCondition');
      setPriceValidUntil(seoSettings.price_valid_until || '');
      setEnableSchema(seoSettings.enable_schema ?? true);
    }
  }, [seoSettings]);

  const handleSave = () => {
    updateSEOSettings({
      gtin: gtin || undefined,
      mpn: mpn || undefined,
      availability,
      item_condition: itemCondition,
      price_valid_until: priceValidUntil || undefined,
      enable_schema: enableSchema,
    });
  };

  if (!product.id) {
    return (
      <div className="text-center py-16 text-editorial-muted">
        <p className="font-editorial text-lg mb-2">Najpierw zapisz produkt</p>
        <p className="text-xs">Rozdział SEO dostępny po utworzeniu produktu (rozdział 02).</p>
      </div>
    );
  }

  const statusBadge = () => {
    const status = seoSettings?.validation_status || 'pending';
    const map = {
      valid: { label: 'POPRAWNE', cls: 'text-editorial-good' },
      invalid: { label: 'BŁĘDY', cls: 'text-editorial-bad' },
      pending: { label: 'OCZEKUJE', cls: 'text-editorial-muted' },
    };
    const s = map[status as keyof typeof map] || map.pending;
    return <span className={`text-[10px] font-bold tracking-[0.2em] ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-editorial-line pb-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-editorial-muted uppercase mb-1">
            Rozdział 06
          </div>
          <h2 className="font-editorial text-2xl text-editorial-ink">SEO &amp; Schema.org</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.2em] text-editorial-muted uppercase mb-0.5">Status</div>
          {statusBadge()}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-editorial-muted text-sm">Ładowanie...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <EditorialInput
              label="GTIN"
              value={gtin}
              onChange={(e) => setGtin(e.target.value)}
              hint="Global Trade Item Number (np. EAN)"
              placeholder="np. 5901234567890"
            />
            <EditorialInput
              label="MPN"
              value={mpn}
              onChange={(e) => setMpn(e.target.value)}
              hint="Manufacturer Part Number"
              placeholder="np. EJC-214-2024"
            />
            <EditorialSelect
              label="Dostępność"
              value={availability}
              onChange={(e) => setAvailability(e.target.value as any)}
              options={[
                { value: 'InStock', label: 'W magazynie' },
                { value: 'OutOfStock', label: 'Brak w magazynie' },
                { value: 'PreOrder', label: 'Przedsprzedaż' },
                { value: 'Discontinued', label: 'Wycofany' },
              ]}
            />
            <EditorialSelect
              label="Stan produktu"
              value={itemCondition}
              onChange={(e) => setItemCondition(e.target.value as any)}
              options={[
                { value: 'NewCondition', label: 'Nowy' },
                { value: 'UsedCondition', label: 'Używany' },
                { value: 'RefurbishedCondition', label: 'Po renowacji' },
                { value: 'DamagedCondition', label: 'Uszkodzony' },
              ]}
            />
            <EditorialInput
              label="Cena ważna do"
              type="date"
              value={priceValidUntil}
              onChange={(e) => setPriceValidUntil(e.target.value)}
              hint="Data ważności oferty"
            />
            <FieldWrap label="Schema JSON-LD">
              <button
                type="button"
                onClick={() => setEnableSchema(!enableSchema)}
                className={`w-full flex items-center justify-between border px-3 py-2.5 text-sm transition-colors ${
                  enableSchema
                    ? 'bg-editorial-ink text-editorial-bg border-editorial-ink'
                    : 'bg-editorial-line/20 text-editorial-ink border-editorial-line'
                }`}
              >
                <span>{enableSchema ? 'Włączone' : 'Wyłączone'}</span>
                <span className="text-[10px] tracking-[0.2em] uppercase">
                  {enableSchema ? 'ON' : 'OFF'}
                </span>
              </button>
            </FieldWrap>
          </div>

          <div className="sticky bottom-16 md:bottom-0 z-20 -mx-4 md:mx-0 px-4 md:px-0 py-3 bg-editorial-bg border-t border-editorial-line">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full md:w-auto px-6 py-3 bg-editorial-ink text-editorial-bg text-xs font-bold tracking-[0.2em] uppercase hover:bg-editorial-ink/90 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Zapisywanie...' : 'Zapisz zmiany SEO'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chapter06_SEO;
