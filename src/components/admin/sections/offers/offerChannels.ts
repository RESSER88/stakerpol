// Kanał oferty = źródło, skąd pochodzi klient.
// Stare wartości (email, whatsapp, sms, telefon) są dopuszczalne w bazie dla
// wstecznej zgodności — tu wyświetlamy tylko nowe źródła.

export const CHANNEL_OTHER = 'inne';

export const OFFER_CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'allegro', label: 'Allegro' },
  { value: 'olx', label: 'OLX' },
  { value: 'google', label: 'Google' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'powracajacy', label: 'Powracający' },
  { value: CHANNEL_OTHER, label: 'Inne' },
];

const LEGACY_LABELS: Record<string, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  telefon: 'Telefon',
};

export const offerChannelLabel = (value: string | null | undefined, detail?: string | null): string => {
  if (!value) return '—';
  const found = OFFER_CHANNEL_OPTIONS.find((o) => o.value === value);
  const base = found?.label ?? LEGACY_LABELS[value] ?? value;
  if (value === CHANNEL_OTHER && detail?.trim()) return `${base}: ${detail.trim()}`;
  return base;
};
