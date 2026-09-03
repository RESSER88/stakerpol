import { useEffect, useState } from 'react';

interface Quote {
  quote: string;
  author: string;
}

const TOTAL_QUOTES = 1454;
const STORAGE_PREFIX = 'stakerpol-quote-';

const todayKey = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Deterministyczny indeks z dnia roku — ten sam cytat przez całą dobę. */
const dayOfYearIndex = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86_400_000);
  return (dayOfYear * 7 + d.getFullYear()) % TOTAL_QUOTES;
};

const readCache = (key: string): Quote | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.quote === 'string' && typeof parsed.author === 'string') {
      return parsed as Quote;
    }
  } catch {
    /* uszkodzony wpis — traktujemy jak brak cache */
  }
  return null;
};

const writeCache = (key: string, quote: Quote) => {
  try {
    // Sprzątanie starych dni, żeby localStorage nie rósł.
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
 * Ciekawostka dnia w panelu. Jedno żądanie na dobę, wprost z przeglądarki
 * do DummyJSON (bez Supabase, bez zapisu w bazie). Przy jakimkolwiek
 * problemie komponent nie renderuje nic — panel wygląda jak wcześniej.
 */
const QuoteOfTheDay = () => {
  const key = todayKey();
  const [quote, setQuote] = useState<Quote | null>(() => readCache(key));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (quote) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(
          `https://dummyjson.com/quotes?limit=1&skip=${dayOfYearIndex()}&select=quote,author`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const first = data?.quotes?.[0];
        if (!first?.quote || !first?.author) throw new Error('Brak danych cytatu');
        if (!active) return;
        const next: Quote = { quote: first.quote, author: first.author };
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
          <p className="font-editorial italic text-base lg:text-lg text-editorial-ink leading-relaxed">
            {quote.quote}
          </p>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted mt-3">
            {quote.author}
          </p>
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
