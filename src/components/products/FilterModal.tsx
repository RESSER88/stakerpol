import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Search } from 'lucide-react';
import { Product } from '@/types';
import { useTranslation } from '@/utils/translations';
import { Language } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AVAILABILITY_BADGES, AvailabilityStatus } from '@/components/products/availabilityBadge';
import { hasOperatorPlatform } from '@/utils/productNormalization';

export type PlatformFilter = 'all' | 'with' | 'without';

export interface FilterCriteria {
  year: number[];
  hours: number[];
  height: number[];
  serial: string;
  availability: AvailabilityStatus[];
  platform: PlatformFilter;
}

export const DEFAULT_AVAILABILITY: AvailabilityStatus[] = ['available', 'reserved'];

export const matchesDefaultAvailability = (product: Product): boolean =>
  DEFAULT_AVAILABILITY.includes((product.availabilityStatus || 'available') as AvailabilityStatus);

export const matchesCriteria = (product: Product, criteria: FilterCriteria): boolean => {
  const serialQuery = criteria.serial.trim().toLowerCase();
  const productYear = Number(product.specs?.productionYear);
  const productHours = Number(product.specs?.workingHours);
  const productHeight = Number(product.specs?.liftHeight);
  const productSerial = (product.specs?.serialNumber || '').toString().toLowerCase();

  const yearMatch = !productYear ||
    (productYear >= criteria.year[0] && productYear <= criteria.year[1]);

  const hoursMatch = !productHours ||
    (productHours >= criteria.hours[0] && productHours <= criteria.hours[1]);

  const heightMatch = !productHeight ||
    (productHeight >= criteria.height[0] && productHeight <= criteria.height[1]);

  const serialMatch = !serialQuery || productSerial.includes(serialQuery);

  const status = (product.availabilityStatus || 'available') as AvailabilityStatus;
  const availabilityMatch = criteria.availability.includes(status);

  const hasPlatform = hasOperatorPlatform(product.specs?.operatorPlatform);
  const platformMatch = criteria.platform === 'all'
    ? true
    : criteria.platform === 'with' ? hasPlatform : !hasPlatform;

  return yearMatch && hoursMatch && heightMatch && serialMatch && availabilityMatch && platformMatch;
};


interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyFilters: (criteria: FilterCriteria | null) => void;
  language: Language;
}

const FilterModal = ({ isOpen, onClose, products, onApplyFilters, language }: FilterModalProps) => {
  const t = useTranslation(language);
  const isMobile = useIsMobile();

  // Calculate ranges from products data
  const ranges = useMemo(() => {
    const years = products
      .map(p => Number(p.specs?.productionYear))
      .filter(year => year && year > 0)
      .sort((a, b) => a - b);

    const hours = products
      .map(p => Number(p.specs?.workingHours))
      .filter(hour => hour && hour > 0)
      .sort((a, b) => a - b);

    const heights = products
      .map(p => Number(p.specs?.liftHeight))
      .filter(height => height && height > 0)
      .sort((a, b) => a - b);

    return {
      year: { min: years[0] || 2012, max: years[years.length - 1] || 2019 },
      hours: { min: hours[0] || 992, max: hours[hours.length - 1] || 6668 },
      height: { min: heights[0] || 1700, max: heights[heights.length - 1] || 6000 }
    };
  }, [products]);

  const [filters, setFilters] = useState<FilterCriteria>({
    year: [ranges.year.min, ranges.year.max],
    hours: [ranges.hours.min, ranges.hours.max],
    height: [ranges.height.min, ranges.height.max],
    serial: '',
    availability: [...DEFAULT_AVAILABILITY],
    platform: 'all'
  });

  const filteredProducts = useMemo(
    () => products.filter(product => matchesCriteria(product, filters)),
    [products, filters]
  );

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      year: [ranges.year.min, ranges.year.max],
      hours: [ranges.hours.min, ranges.hours.max],
      height: [ranges.height.min, ranges.height.max],
      serial: '',
      availability: [...DEFAULT_AVAILABILITY],
      platform: 'all'
    });
    onApplyFilters(null);
  };

  const toggleAvailability = (status: AvailabilityStatus) => {
    setFilters(prev => ({
      ...prev,
      availability: prev.availability.includes(status)
        ? prev.availability.filter(s => s !== status)
        : [...prev.availability, status]
    }));
  };

  const AVAILABILITY_ORDER: AvailabilityStatus[] = ['available', 'reserved', 'sold'];
  const PLATFORM_OPTIONS: { value: PlatformFilter; label: string }[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'with', label: 'Z podestem' },
    { value: 'without', label: 'Bez podestu' }
  ];


  const FilterFields = (
    <div className="space-y-6 py-4">
      {/* Availability Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Dostępność</Label>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_ORDER.map(status => {
            const active = filters.availability.includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleAvailability(status)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {AVAILABILITY_BADGES[status].text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Operator Platform Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Podest dla operatora</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map(option => {
            const active = filters.platform === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, platform: option.value }))}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Production Year Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t('productionYear')}: {filters.year[0]} - {filters.year[1]}
        </Label>
        <Slider
          value={filters.year}
          onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
          min={ranges.year.min}
          max={ranges.year.max}
          step={1}
          className="w-full slider-with-handles"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{ranges.year.min}</span>
          <span>{ranges.year.max}</span>
        </div>
      </div>

      {/* Working Hours Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t('workingHours')}: {filters.hours[0]} - {filters.hours[1]} mh
        </Label>
        <Slider
          value={filters.hours}
          onValueChange={(value) => setFilters(prev => ({ ...prev, hours: value }))}
          min={ranges.hours.min}
          max={ranges.hours.max}
          step={100}
          className="w-full slider-with-handles"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{ranges.hours.min} mh</span>
          <span>{ranges.hours.max} mh</span>
        </div>
      </div>

      {/* Lift Height Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t('liftHeight')}: {filters.height[0]} - {filters.height[1]} mm
        </Label>
        <Slider
          value={filters.height}
          onValueChange={(value) => setFilters(prev => ({ ...prev, height: value }))}
          min={ranges.height.min}
          max={ranges.height.max}
          step={100}
          className="w-full slider-with-handles"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{ranges.height.min} mm</span>
          <span>{ranges.height.max} mm</span>
        </div>
      </div>

      {/* Serial Number Search */}
      <div className="space-y-3 pt-2 border-t">
        <Label htmlFor="serial-search" className="text-sm font-medium">
          Numer seryjny
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="serial-search"
            type="text"
            inputMode="search"
            autoComplete="off"
            maxLength={64}
            placeholder="np. 6865256"
            value={filters.serial}
            onChange={(e) => setFilters(prev => ({ ...prev, serial: e.target.value }))}
            className="pl-10"
          />
        </div>
        {filters.serial.trim().length > 0 && (
          <p className="text-xs text-muted-foreground">
            Wyszukiwanie częściowe — wystarczy fragment numeru
          </p>
        )}
      </div>

      {/* Results Preview */}
      <div className="p-3 bg-muted rounded-md">
        <p className="text-sm font-medium">
          {t('foundProducts')}: <span className="text-primary">{filteredProducts.length}</span>
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-t-2xl p-0 flex flex-col gap-0 border-t"
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mt-2 mb-1 shrink-0" />

          <SheetHeader className="px-4 pt-2 pb-1 shrink-0">
            <SheetTitle className="text-left">{t('filterProducts')}</SheetTitle>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {FilterFields}
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-background border-t p-4 flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 min-h-[48px] active:scale-[0.98] transition-transform"
            >
              {t('reset')}
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 min-h-[48px] active:scale-[0.98] transition-transform"
            >
              {t('applyFilters')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('filterProducts')}</DialogTitle>
        </DialogHeader>

        {FilterFields}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            {t('reset')}
          </Button>
          <Button onClick={handleApplyFilters}>
            {t('applyFilters')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;
