import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

/** Dotychczasowy format: 32 znaki base64url. */
const LEGACY_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;
/** Nowy format: podstawa-slug + 6-znakowy przyrostek, np. janpol-k7m2xr. */
const SLUG_TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{6}$/;

const isValidToken = (t: string): boolean =>
  t.length <= 40 && (LEGACY_TOKEN_PATTERN.test(t) || SLUG_TOKEN_PATTERN.test(t));

// Rate limiting: in-memory only, per function instance.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const NOT_FOUND = () => json({ error: 'not_found', message: 'Link jest nieaktywny.' }, 404);

const rateLimited = (ip: string): boolean => {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return json({ error: 'rate_limited', message: 'Zbyt wiele zapytań.' }, 429);
  }

  try {
    let token: unknown;
    try {
      const body = await req.json();
      token = body?.token;
    } catch {
      console.log('shared-list: denied (malformed body)');
      return NOT_FOUND();
    }

    if (typeof token !== 'string' || !isValidToken(token)) {
      console.log('shared-list: denied (invalid token format)');
      return NOT_FOUND();
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from('shared_lists')
      .select('id, filters, expires_at, revoked_at, view_count')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.log('shared-list: lookup failed');
      return json({ error: 'server_error', message: 'Wystąpił błąd.' }, 500);
    }

    if (!data) {
      console.log('shared-list: denied (no row)');
      return NOT_FOUND();
    }

    if (data.revoked_at !== null) {
      console.log('shared-list: denied (revoked)');
      return NOT_FOUND();
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      console.log('shared-list: denied (expired)');
      return NOT_FOUND();
    }

    // Counter update must never block the response.
    try {
      await supabase
        .from('shared_lists')
        .update({
          view_count: (data.view_count ?? 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', data.id);
    } catch {
      console.log('shared-list: view counter update failed');
    }

    return json({ filters: data.filters, expires_at: data.expires_at }, 200);
  } catch {
    console.log('shared-list: unexpected error');
    return json({ error: 'server_error', message: 'Wystąpił błąd.' }, 500);
  }
});
