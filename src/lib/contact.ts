export const COMPANY_PHONE_TEL = '+48694133592';
export const COMPANY_PHONE_WA = '48694133592';
export const COMPANY_PHONE_DISPLAY = '694 133 592';

export const buildWhatsAppUrl = (text: string) =>
  `https://wa.me/${COMPANY_PHONE_WA}?text=${encodeURIComponent(text)}`;
