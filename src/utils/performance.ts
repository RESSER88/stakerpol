
// Performance monitoring utilities
export const measurePerformance = {
  // Measure page load times
  pageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
        domComplete: navigation.loadEventStart - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.fetchStart
      };
    }
    return null;
  },

  // Measure component render times
  markStart: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`);
    }
  },

  markEnd: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = window.performance.getEntriesByName(name)[0];
      if (measure && import.meta.env.DEV) {
        console.log(`Performance [${name}]: ${measure.duration.toFixed(2)}ms`);
      }
    }
  },

  // Lazy load heavy libraries
  loadHtml2Canvas: async () => {
    if (!window.html2canvas) {
      const module = await import('html2canvas');
      return module.default;
    }
    return window.html2canvas;
  }
};

// Web Vitals monitoring
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;

  try {
    const sendToGA = (name: string, value: number, id?: string) => {
      try {
        if (window.gtag) {
          window.gtag('event', name, {
            value,
            event_category: 'Web Vitals',
            event_label: id || document.location.pathname,
            non_interaction: true,
          });
        }
      } catch (e) {
        // Silent fail for GA errors
      }
    };

    // Check if PerformanceObserver is supported
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }

    // Track Largest Contentful Paint (LCP)
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          sendToGA('LCP', entry.startTime, (entry as any).id);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP tracking failed
    }

    // Track Interaction to Next Paint (INP) with fallback
    import('web-vitals').then(({ onINP }) => {
      try {
        onINP(({ value, id }) => {
          sendToGA('INP', value, id);
        });
      } catch (e) {
        // INP tracking failed
      }
    }).catch(() => {
      // web-vitals library failed to load
    });

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any;
          if (!clsEntry.hadRecentInput && clsEntry.value) {
            clsValue += clsEntry.value;
          }
        }
        sendToGA('CLS', Number(clsValue.toFixed(4)));
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS tracking failed
    }
  } catch (error) {
    // Complete fallback for any tracking errors
  }
};

declare global {
  interface Window {
    html2canvas?: any;
    gtag?: (...args: any[]) => void;
  }
}
