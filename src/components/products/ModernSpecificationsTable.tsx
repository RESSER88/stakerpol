import { useState } from 'react';
import { ChevronDown, ChevronUp, MoveVertical, Ruler, BatteryCharging, Clock, Plus } from 'lucide-react';
import { Product } from '@/types';
import { Language } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';

interface ModernSpecificationsTableProps {
  product: Product;
  language: Language;
}

interface SpecRow {
  label: string;
  value: string | undefined;
  unit?: string;
  raw?: boolean;
}

interface SpecGroupData {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: SpecRow[];
}

const formatPL = (raw: string | undefined): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  // Try to parse as number
  const cleaned = trimmed.replace(/\s/g, '').replace(',', '.');
  const num = Number(cleaned);
  if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(cleaned)) {
    return new Intl.NumberFormat('pl-PL').format(num);
  }
  return trimmed;
};

const formatValue = (value: string | undefined, unit?: string, raw?: boolean): string => {
  const base = raw ? (value || '').trim() : formatPL(value);
  if (!base) return '';
  return unit ? `${base} ${unit}` : base;
};

const SpecGroup = ({ title, icon: Icon, rows }: SpecGroupData) => {
  const visibleRows = rows.filter(r => r.value && r.value.trim() !== '');
  if (visibleRows.length === 0) return null;

  return (
    <div className="rounded-[5px] overflow-hidden mb-3 border border-[#E5E1D8]">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#FAF8F3] border-b border-[#E5E1D8]">
        <Icon className="w-4 h-4 text-[#C8102E]" />
        <h3 className="font-bold text-xs uppercase tracking-[0.06em] text-[#0E0E0E]" style={{ fontFamily: 'Archivo, sans-serif' }}>
          {title}
        </h3>
      </div>
      <div className="bg-white">
        {visibleRows.map((row, idx) => (
          <div
            key={idx}
            className={`flex justify-between items-center px-3 py-2.5 ${idx < visibleRows.length - 1 ? 'border-b border-dashed border-[#E5E1D8]' : ''}`}
          >
            <span className="text-[12.5px] text-[#5B5B5B] font-medium" style={{ fontFamily: 'Archivo, sans-serif' }}>
              {row.label}
            </span>
            <span className="text-[12.5px] font-bold text-[#0E0E0E] text-right ml-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {formatValue(row.value, row.unit, row.raw)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModernSpecificationsTable = ({ product, language }: ModernSpecificationsTableProps) => {
  const t = useTranslation(language);
  const [showAll, setShowAll] = useState(false);

  const groups: SpecGroupData[] = [
    {
      title: t('specGroupLiftCapacity' as any),
      icon: MoveVertical,
      rows: [
        { label: t('liftHeight'), value: product.specs.liftHeight, unit: 'mm' },
        { label: t('minHeight'), value: product.specs.minHeight, unit: 'mm' },
        { label: t('freeStroke'), value: product.specs.freeStroke, unit: 'mm' },
        { label: t('mast'), value: product.specs.mast },
        { label: t('mastLiftingCapacity'), value: product.specs.mastLiftingCapacity, unit: 'kg' },
        { label: t('preliminaryLiftingCapacity'), value: product.specs.preliminaryLiftingCapacity, unit: 'kg' },
      ],
    },
    {
      title: t('specGroupDimensions' as any),
      icon: Ruler,
      rows: [
        { label: t('dimensions'), value: product.specs.dimensions, unit: 'mm' },
        { label: t('wheels'), value: product.specs.wheels },
        { label: t('operatorPlatform'), value: product.specs.operatorPlatform },
      ],
    },
    {
      title: t('specGroupDrive' as any),
      icon: BatteryCharging,
      rows: [
        { label: t('driveType'), value: product.specs.driveType },
        { label: t('battery'), value: product.specs.battery },
        { label: t('preliminaryLifting'), value: product.specs.preliminaryLifting },
      ],
    },
    {
      title: t('specGroupHistory' as any),
      icon: Clock,
      rows: [
        { label: t('productionYear'), value: product.specs.productionYear },
        { label: t('workingHours'), value: product.specs.workingHours, unit: 'mth' },
        { label: t('serialNumber'), value: product.specs.serialNumber, raw: true },
        { label: t('condition'), value: product.specs.condition },
      ],
    },
    {
      title: t('specGroupExtras' as any),
      icon: Plus,
      rows: [
        { label: t('additionalOptions'), value: product.specs.additionalOptions },
      ],
    },
  ];

  // Filter to non-empty groups
  const nonEmptyGroups = groups
    .map(g => ({ ...g, _visibleCount: g.rows.filter(r => r.value && r.value.trim() !== '').length }))
    .filter(g => g._visibleCount > 0);

  const defaultGroups = nonEmptyGroups.slice(0, 3);
  const hiddenGroups = nonEmptyGroups.slice(3);
  const hiddenParamsCount = hiddenGroups.reduce((sum, g) => sum + g._visibleCount, 0);

  return (
    <div>
      {defaultGroups.map((g, i) => (
        <SpecGroup key={`default-${i}`} title={g.title} icon={g.icon} rows={g.rows} />
      ))}

      {showAll && hiddenGroups.map((g, i) => (
        <SpecGroup key={`hidden-${i}`} title={g.title} icon={g.icon} rows={g.rows} />
      ))}

      {hiddenGroups.length > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 px-4 py-2.5 bg-white border border-[#E5E1D8] rounded-[5px] text-[12.5px] font-bold text-[#0E0E0E] hover:bg-[#FAF8F3] transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          {showAll ? (
            <>
              {t('specHideFull' as any)}
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              {t('specShowFull' as any)} (+{hiddenParamsCount} {t('specParamsCount' as any)})
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ModernSpecificationsTable;
