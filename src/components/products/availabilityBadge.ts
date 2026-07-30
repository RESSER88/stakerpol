export type AvailabilityStatus = 'available' | 'reserved' | 'sold';

export interface AvailabilityBadgeStyle {
  text: string;
  cls: string;
  dotCls: string;
}

export const AVAILABILITY_BADGES: Record<AvailabilityStatus, AvailabilityBadgeStyle> = {
  available: { text: 'Dostępny od ręki', cls: 'bg-green-50 text-green-700', dotCls: 'bg-green-500' },
  reserved: { text: 'Zarezerwowany', cls: 'bg-orange-50 text-orange-700', dotCls: 'bg-orange-500' },
  sold: { text: 'Sprzedany', cls: 'bg-gray-100 text-gray-700', dotCls: 'bg-gray-400' },
};

export const getAvailabilityBadge = (status?: string | null): AvailabilityBadgeStyle | null => {
  if (!status) return null;
  return AVAILABILITY_BADGES[status as AvailabilityStatus] ?? null;
};
