import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_CHARS = 1200;
const DEFAULT_MODEL = 'gpt-4o-mini';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const SYSTEM_PROMPT = `Jesteś redaktorem technicznym sklepu z używanymi wózkami magazynowymi.
Napisz opis konkretnego egzemplarza wózka na podstawie WYŁĄCZNIE przekazanych danych.
Zasady:
- 80–150 słów, maksymalnie 1200 znaków, jeden lub dwa akapity, zwykły tekst bez nagłówków, list i formatowania.
- Opisz ten egzemplarz: maszt, udźwig, wysokość podnoszenia i minimalną, motogodziny, rok produkcji oraz zastosowanie wynikające z parametrów (np. niski maszt → niskie pomieszczenia, kontenery).
- Naturalnie użyj frazy z nazwą modelu i określeniem typu wózka (np. „paleciak elektryczny Toyota BT SWE 200D”).
- Tylko fakty z danych. Nie wymyślaj gwarancji, ceny, przeglądów, transportu, stanu baterii ani innych informacji, których nie ma w danych. Pomiń pola puste.
- Bez superlatywów, bez danych kontaktowych, bez ceny.
Zwróć wyłącznie treść opisu.`;

type ProductFacts = Record<string, unknown>;

/** Jedyne miejsce wywołania dostawcy AI — w przyszłości można tu dodać innych dostawców. */
async function generateWithProvider(facts: ProductFacts): Promise<{ content: string; model: string; provider: string }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new ProviderError(500, 'Brak skonfigurowanego klucza OPENAI_API_KEY.');
  const model = Deno.env.get('OPENAI_MODEL')?.trim() || DEFAULT_MODEL;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Dane egzemplarza (JSON):\n${JSON.stringify(facts, null, 2)}` },
      ],
    }),
  });

  if (!res.ok) {
    const status = res.status;
    let detail = '';
    try { detail = (await res.json())?.error?.message ?? ''; } catch { /* brak treści */ }
    const msg =
      status === 401 ? 'OpenAI odrzucił klucz API (401).' :
      status === 429 ? 'Limit lub brak środków na koncie OpenAI (429).' :
      status === 404 ? `Model „${model}” jest niedostępny (404).` :
      `Błąd OpenAI (${status}).`;
    console.error('OpenAI error', status, detail.slice(0, 300));
    throw new ProviderError(502, msg);
  }

  const data = await res.json();
  const content = String(data?.choices?.[0]?.message?.content ?? '').trim();
  return { content, model: String(data?.model ?? model), provider: 'openai' };
}

class ProviderError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Dozwolona tylko metoda POST.' });

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json(401, { error: 'Brak autoryzacji.' });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return json(401, { error: 'Nieprawidłowa lub wygasła sesja.' });

  const { data: isAdmin, error: roleErr } = await supabase.rpc('has_role', {
    _user_id: userData.user.id,
    _role: 'admin',
  });
  if (roleErr) return json(500, { error: 'Nie udało się sprawdzić uprawnień.' });
  if (!isAdmin) return json(403, { error: 'Brak uprawnień administratora.' });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: 'Nieprawidłowe dane wejściowe (JSON).' }); }
  const productId = body?.product_id;
  if (typeof productId !== 'string' || !UUID_RE.test(productId)) {
    return json(400, { error: 'Pole product_id musi być poprawnym UUID.' });
  }

  const { data: p, error: pErr } = await supabase
    .from('products')
    .select('name, production_year, working_hours, lift_capacity_mast, lift_capacity_initial, lift_height, min_height, mast, free_lift, battery, condition, foldable_platform, additional_options, short_description, detailed_description')
    .eq('id', productId)
    .maybeSingle();
  if (pErr) return json(500, { error: 'Błąd odczytu produktu.' });
  if (!p) return json(404, { error: 'Nie znaleziono produktu.' });

  const facts: ProductFacts = {
    model: p.name,
    rok_produkcji: p.production_year,
    motogodziny: p.working_hours,
    udzwig_maszt_kg: p.lift_capacity_mast,
    udzwig_podnoszenie_wstepne_kg: p.lift_capacity_initial,
    wysokosc_podnoszenia_mm: p.lift_height,
    wysokosc_minimalna_mm: p.min_height,
    typ_masztu: p.mast,
    wolny_skok_mm: p.free_lift,
    bateria: p.battery,
    stan: p.condition,
    platforma_operatora: p.foldable_platform,
    opcje_dodatkowe: p.additional_options,
    krotki_opis: p.short_description,
    opis_szczegolowy: p.detailed_description,
  };
  for (const k of Object.keys(facts)) {
    const v = facts[k];
    if (v === null || v === undefined || (typeof v === 'string' && !v.trim())) delete facts[k];
  }

  let result;
  try {
    result = await generateWithProvider(facts);
  } catch (e) {
    if (e instanceof ProviderError) return json(e.status, { error: e.message });
    return json(502, { error: 'Nie udało się połączyć z dostawcą AI.' });
  }

  if (!result.content) return json(422, { error: 'Model zwrócił pusty tekst — szkic nie został zapisany.' });
  if (result.content.length > MAX_CHARS) {
    return json(422, { error: `Opis ma ${result.content.length} znaków (limit ${MAX_CHARS}) — szkic nie został zapisany.` });
  }

  const { data: draft, error: insErr } = await supabase
    .from('product_ai_drafts')
    .insert({ product_id: productId, content: result.content, status: 'pending', provider: result.provider, model: result.model })
    .select('id')
    .single();
  if (insErr || !draft) {
    console.error('Insert error', insErr?.message);
    return json(500, { error: 'Nie udało się zapisać szkicu.' });
  }

  return json(200, { draft_id: draft.id, content: result.content, model: result.model });
});
