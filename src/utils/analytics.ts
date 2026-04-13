// GA4 analytics utility – fires gtag events for CTA clicks and conversions

const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag(...args);
  }
};

export const trackPhoneClick = (location?: string) => {
  gtag('event', 'phone_click', {
    event_category: 'contact',
    event_label: location || 'unknown',
    link_url: 'tel:+48694133592',
  });
};

export const trackEmailClick = (location?: string) => {
  gtag('event', 'email_click', {
    event_category: 'contact',
    event_label: location || 'unknown',
    link_url: 'mailto:info@stakerpol.pl',
  });
};

export const trackWhatsAppClick = (location?: string) => {
  gtag('event', 'whatsapp_click', {
    event_category: 'contact',
    event_label: location || 'unknown',
    link_url: 'https://wa.me/+48694133592',
  });
};

export const trackCTAClick = (label: string) => {
  gtag('event', 'cta_click', {
    event_category: 'engagement',
    event_label: label,
  });
};

export const trackFormSubmit = (formName: string, productModel?: string) => {
  gtag('event', 'form_submit', {
    event_category: 'conversion',
    event_label: formName,
    product_model: productModel,
  });
};

export const trackSocialClick = (platform: string) => {
  gtag('event', 'social_click', {
    event_category: 'engagement',
    event_label: platform,
  });
};

export const trackPageView = (pagePath: string, pageTitle?: string) => {
  gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
};
