import { useEffect, useState } from 'react';

interface Quote {
  title: string | null;
  quote: string;
  description: string | null;
}

const STORAGE_PREFIX = 'stakerpol-quote-pl-';
const LEGACY_PREFIX = 'stakerpol-quote-';
const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-quote`;

const todayKey = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const readCache = (key: string): Quote | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.quote === 'string') return parsed as Quote;
  } catch {
    /* uszkodzony wpis — traktujemy jak brak cache */
  }
  return null;
};

const writeCache = (key: string, quote: Quote) => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX) && k !== STORAGE_PREFIX + key) {
        localStorage.removeItem(k);
      }
    }
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(quote));
  } catch {
    /* brak miejsca lub tryb prywatny — cache jest opcjonalny */
  }
};

/**
 * Cytat dnia w panelu. Jedno żądanie na dobę do własnej Edge Function
 * (proxy do dailystoic.pl — źródło nie wysyła CORS). Zero zapisu w bazie.
 * Przy jakimkolwiek problemie komponent nie renderuje nic.
 */
const QuoteOfTheDay = () => {
  const key = todayKey();
  const [quote, setQuote] = useState<Quote | null>(() => readCache(key));
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (quote) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data?.ok || typeof data.quote !== 'string') throw new Error('Brak danych');
        if (!active) return;
        const next: Quote = {
          title: data.title ?? null,
          quote: data.quote,
          description: data.description ?? null,
        };
        setQuote(next);
        writeCache(key, next);
      } catch {
        if (active) setFailed(true);
      } finally {
        clearTimeout(timer);
      }
    };

    load();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, quote]);

  if (failed && !quote) return null;

  return (
    <div className="border-l-2 border-editorial-accent bg-editorial-line/20 pl-5 pr-4 py-4 min-h-[92px] flex flex-col justify-center">
      {quote ? (
        <>
          {quote.title && (
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-accent mb-2">
              {quote.title}
            </p>
          )}
          <p className="font-editorial italic text-base lg:text-lg text-editorial-ink leading-relaxed">
            {quote.quote}
          </p>
          {quote.description && (
            <>
              <p
                className={
                  expanded
                    ? 'text-sm text-editorial-muted leading-relaxed mt-3'
                    : 'text-sm text-editorial-muted leading-relaxed mt-3 line-clamp-2'
                }
              >
                {quote.description}
              </p>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="self-start mt-2 text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted hover:text-editorial-accent transition-colors"
              >
                {expanded ? 'Zwiń' : 'Czytaj dalej'}
              </button>
            </>
          )}
        </>
      ) : (
        <div className="space-y-2" aria-hidden="true">
          <div className="h-3 w-4/5 bg-editorial-line/60 rounded-sm" />
          <div className="h-3 w-2/3 bg-editorial-line/60 rounded-sm" />
        </div>
      )}
    </div>
  );
};

export default QuoteOfTheDay;
