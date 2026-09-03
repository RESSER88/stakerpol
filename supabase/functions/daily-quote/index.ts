const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const SOURCE = 'https://dailystoic.pl/quote/text_pl.json';
const MAX_DESC = 1200;

const clean = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}…` : trimmed;
};

const json = (body: unknown, cache: boolean) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': cache
        ? 'public, max-age=3600, s-maxage=86400'
        : 'no-store',
    },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(SOURCE, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const quote = clean(data?.quote, 600);
    if (!quote) throw new Error('Brak pola quote');

    return json(
      {
        ok: true,
        title: clean(data?.title, 160),
        quote,
        description: clean(data?.description, MAX_DESC),
      },
      true,
    );
  } catch (error) {
    console.error('daily-quote:', error instanceof Error ? error.message : error);
    return json({ ok: false }, false);
  } finally {
    clearTimeout(timer);
  }
});
