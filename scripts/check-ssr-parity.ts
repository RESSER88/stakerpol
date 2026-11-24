/**
 * Test zgodnosci HTML z serwera (dist/index.php) z kartą po JS. Uruchamiany RĘCZNIE, nie w buildzie.
 *
 *   npm run build
 *   php -S 127.0.0.1:8099 -t dist dist/index.php      (w osobnym terminalu)
 *   bun scripts/check-ssr-parity.ts [slug ...]         (bez slugów: 3 przykładowe karty)
 *
 * Porównuje title, meta description, og:*, twitter:* i JSON-LD Product z wynikiem
 * funkcji TS (productMeta.ts, productImageAlt.ts, generateProductSchema.ts).
 * Zmienna SSR_BASE zmienia adres serwera PHP (domyślnie http://127.0.0.1:8099).
 */
import { readFileSync } from 'fs';
import { mapSupabaseProductToProduct } from '../src/types/supabase';
import { getProductMetaTitle, getProductMetaDescription, getProductOgImage } from '../src/utils/seo/productMeta';
import { getMainImageAlt } from '../src/utils/productImageAlt';
import { generateProductSchema } from '../src/utils/seo/generateProductSchema';

const BASE = process.env.SSR_BASE || 'http://127.0.0.1:8099';
const sm = readFileSync(new URL('../public/sitemap.php', import.meta.url), 'utf8');
const URL_ = sm.match(/\$SUPABASE_URL\s*=\s*'([^']+)'/)![1];
const KEY = sm.match(/\$SUPABASE_ANON\s*=\s*'(sb_publishable_[^']+)'/)![1];
const SELECT = '*,product_images(*),product_seo_settings(*)';

const rest = async (q: string) => {
  const r = await fetch(`${URL_}/rest/v1/products?${q}`, { headers: { apikey: KEY } });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
};

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const meta = (html: string, key: string) => {
  const m = html.match(new RegExp(`<meta\\s+(?:name|property)="${key}"[^>]*?content="([^"]*)"`));
  return m ? decode(m[1]) : null;
};

let slugs = process.argv.slice(2);
if (slugs.length === 0) {
  const a = await rest('select=slug&price_display_mode=eq.show_price&net_price=gt.0&limit=1');
  const b = await rest('select=slug&price_display_mode=neq.show_price&limit=1');
  const c = await rest('select=slug&availability_status=eq.sold&limit=1');
  slugs = [...a, ...b, ...c].map((r: any) => r.slug);
}

let fails = 0;
for (const slug of slugs) {
  const [row] = await rest(`select=${encodeURIComponent(SELECT)}&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  if (!row) { console.log(`✗ ${slug}: brak w bazie`); fails++; continue; }
  const { product_images, product_seo_settings, ...p } = row;
  const imgs = (product_images || []).slice().sort((x: any, y: any) => (x.display_order ?? 0) - (y.display_order ?? 0));
  const product: any = mapSupabaseProductToProduct(p, imgs);
  const seo = Array.isArray(product_seo_settings) ? product_seo_settings[0] ?? null : product_seo_settings ?? null;

  const html = await (await fetch(`${BASE}/produkty/${encodeURIComponent(slug)}`, { headers: { 'User-Agent': 'OAI-SearchBot/1.0' } })).text();
  const title = getProductMetaTitle(product);
  const desc = getProductMetaDescription(product);
  const og = getProductOgImage(product);
  const expected: Record<string, string | null> = {
    title, description: desc, 'og:title': title, 'og:description': desc,
    'twitter:title': title, 'twitter:description': desc,
    'og:image': og || null, 'twitter:image': og || null, 'og:image:alt': og ? getMainImageAlt(product) : null,
  };
  const got: Record<string, string | null> = {
    title: decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''),
  };
  for (const k of Object.keys(expected)) if (k !== 'title') got[k] = meta(html, k);
  if (!og) { got['og:image'] = null; got['twitter:image'] = null; }

  const lds = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1])).filter((j) => j['@type'] === 'Product');
  const errs: string[] = [];
  for (const k of Object.keys(expected)) if (expected[k] !== got[k]) errs.push(`${k}: oczekiwano ${JSON.stringify(expected[k])}, jest ${JSON.stringify(got[k])}`);
  if (lds.length !== 1) errs.push(`JSON-LD Product: ${lds.length} zamiast 1`);
  else {
    const exp = JSON.parse(JSON.stringify(generateProductSchema(product, seo)));
    if (exp.offers?.priceValidUntil === undefined) delete exp.offers?.priceValidUntil;
    const norm = (o: any): any => Array.isArray(o) ? o.map(norm) : o && typeof o === 'object'
      ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, norm(o[k])])) : o;
    if (JSON.stringify(norm(exp)) !== JSON.stringify(norm(lds[0]))) {
      errs.push(`JSON-LD różni się:\n  TS : ${JSON.stringify(norm(exp))}\n  PHP: ${JSON.stringify(norm(lds[0]))}`);
    }
  }
  if (errs.length) { fails++; console.log(`✗ ${slug}\n  ${errs.join('\n  ')}`); }
  else console.log(`✓ ${slug} (offers: ${lds[0].offers ? 'tak' : 'nie'})`);
}
if (fails) { console.log(`\n${fails} z ${slugs.length} kart niezgodnych`); process.exit(1); }
console.log(`\nWszystkie ${slugs.length} karty zgodne.`);
