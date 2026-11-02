// Odczyt kluczy Supabase dla Edge Functions.
// Najpierw nowe klucze (SUPABASE_SECRET_KEYS / SUPABASE_PUBLISHABLE_KEYS, wpis "default"),
// a gdy ich brak — klucze legacy (SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY).
// Do logów trafia wyłącznie źródło klucza, nigdy jego wartość.

const KEY_NAME = 'default';

function readNamedKey(envName: string): string | null {
  const raw = Deno.env.get(envName);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const value = parsed?.[KEY_NAME];
    return typeof value === 'string' && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function resolve(kind: 'secret' | 'publishable', newEnv: string, legacyEnv: string): string {
  const key = readNamedKey(newEnv);
  if (key) {
    console.log(`keys: new (${kind})`);
    return key;
  }
  console.log(`keys: legacy-fallback (${kind})`);
  return Deno.env.get(legacyEnv) ?? '';
}

/** Klucz z uprawnieniami serwera (omija RLS). Tylko po stronie Edge Functions. */
export function getSecretKey(): string {
  return resolve('secret', 'SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
}

/** Klucz publiczny (odpowiednik anon). */
export function getPublishableKey(): string {
  return resolve('publishable', 'SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
}
