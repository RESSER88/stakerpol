// GA4 analytics utility – fires gtag events + dataLayer pushes for CTA clicks, conversions, and e-commerce

const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag(...args);
  }
};

const pushDataLayer = (event: string, params: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event, ...params });
};

export const trackPhoneClick = (location?: string) => {
  gtag('event', 'phone_click', {
    event_category: 'contact',
    event_label: location || 'unknown',
    link_url: 'tel:+48694133592',
  });
  pushDataLayer('phone_click', { event_category: 'contact', event_label: location || 'unknown' });
};

export const trackEmailClick = (location?: string) => {
  gtag('event', 'email_click', {
    event_category: 'contact',
    event_label: location || 'unknown',
    link_url: 'mailto:info@stakerpol.pl',
  });
  pushDataLayer('email_click', { event_category: 'contact', event_label: location || 'unknown' });
};

export const trackWhatsAppClick = (location?: string) => {
  gtag('event', 'whatsapp_click', {
    event_category: 'contact',
    event_label: location || 'unknown',
    link_url: 'https://wa.me/+48694133592',
  });
  pushDataLayer('whatsapp_click', { event_category: 'contact', event_label: location || 'unknown' });
};

export const trackCTAClick = (label: string) => {
  gtag('event', 'cta_click', {
    event_category: 'engagement',
    event_label: label,
  });
  pushDataLayer('cta_click', { event_category: 'engagement', event_label: label });
};

export const trackFormSubmit = (formName: string, productModel?: string) => {
  gtag('event', 'form_submit', {
    event_category: 'conversion',
    event_label: formName,
    product_model: productModel,
  });
  pushDataLayer('form_submit', { event_category: 'conversion', event_label: formName, product_model: productModel });
};

export const trackSocialClick = (platform: string) => {
  gtag('event', 'social_click', {
    event_category: 'engagement',
    event_label: platform,
  });
  pushDataLayer('social_click', { event_category: 'engagement', event_label: platform });
};

export const trackPageView = (pagePath: string, pageTitle?: string) => {
  gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
  pushDataLayer('page_view', { page_path: pagePath, page_title: pageTitle || (typeof document !== 'undefined' ? document.title : '') });
};

// ============================================================
// E-commerce events (mapped to B2B lead model)
// ============================================================

interface ProductLite {
  id: string;
  model: string;
  brand?: string;
  year?: number | string;
  category?: string;
}

const buildItem = (product: ProductLite) => ({
  item_id: product.id,
  item_name: product.model,
  item_brand: product.brand || 'Toyota',
  item_category: product.category || 'Wózki paletowe elektryczne',
  item_variant: product.year ? String(product.year) : undefined,
});

/** view_item — fired on product detail page mount */
export const trackViewItem = (product: ProductLite) => {
  const payload = {
    currency: 'PLN',
    items: [buildItem(product)],
  };
  gtag('event', 'view_item', payload);
  pushDataLayer('view_item', { ecommerce: payload });
};

/** begin_checkout — fired when user opens inquiry modal (lead funnel start) */
export const trackBeginInquiry = (
  product: ProductLite | undefined,
  source: 'product_page' | 'sticky_bar' | 'inline_cta' | 'product_list' = 'product_page'
) => {
  const items = product ? [buildItem(product)] : [];
  const payload = {
    currency: 'PLN',
    items,
    inquiry_source: source,
  };
  gtag('event', 'begin_checkout', payload);
  pushDataLayer('begin_checkout', { ecommerce: { currency: 'PLN', items }, inquiry_source: source });
};

/** generate_lead + purchase proxy — fired on successful form submission */
export const trackGenerateLead = (
  leadId: string,
  source: string,
  product?: ProductLite,
  value: number = 1000
) => {
  const items = product ? [buildItem(product)] : [];

  // generate_lead (primary conversion)
  gtag('event', 'generate_lead', {
    currency: 'PLN',
    value,
    lead_source: source,
    product_model: product?.model,
  });
  pushDataLayer('generate_lead', {
    currency: 'PLN',
    value,
    lead_source: source,
    product_model: product?.model,
  });

  // purchase proxy (for funnel completion in GA4 standard reports)
  const purchasePayload = {
    transaction_id: leadId,
    value,
    currency: 'PLN',
    items,
  };
  gtag('event', 'purchase', purchasePayload);
  pushDataLayer('purchase', { ecommerce: purchasePayload });
};

/** view_search_results — fired when product filters change */
export const trackSearch = (filterDescription: string, resultsCount: number) => {
  gtag('event', 'view_search_results', {
    search_term: filterDescription,
    results_count: resultsCount,
  });
  pushDataLayer('view_search_results', {
    search_term: filterDescription,
    results_count: resultsCount,
  });
};
