import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const TOKEN_LENGTH = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

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

    if (
      typeof token !== 'string' ||
      token.length !== TOKEN_LENGTH ||
      !TOKEN_PATTERN.test(token)
    ) {
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
