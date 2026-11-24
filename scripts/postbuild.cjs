/**
 * Krok po buildzie. Uruchamiany automatycznie przez `npm run build`.
 *
 * Narzedzia generujace kod (Lovable) kilkukrotnie kasowaly te poprawki z repo,
 * a kazda z nich jest wymagana, zeby serwis dzialal na produkcji. Skrypt
 * nanosi je deterministycznie przy kazdym buildzie i przerywa build, gdy
 * czegos nie rozpozna - lepiej zatrzymac wydanie niz wgrac polamany plik.
 *
 *   1. dist/index.html -> dist/index.php   (fallback SPA w nginx celuje w index.php)
 *   2. usuniecie skryptu cdn.gpteng.co     (edytor Lovable, nie ma go na produkcji)
 *   3. wstrzykniecie SEO po stronie serwera (canonical / title / robots per adres)
 *   4. kontrola obecnosci sitemap.php
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const zmiany = [];
const bledy = [];

// --- 1. rename -------------------------------------------------------------
const html = path.join(DIST, 'index.html');
const php = path.join(DIST, 'index.php');

if (fs.existsSync(html)) {
  fs.renameSync(html, php);
  zmiany.push('index.html -> index.php');
} else if (!fs.existsSync(php)) {
  bledy.push('brak dist/index.html oraz dist/index.php - czy build sie powiodl?');
}

if (bledy.length === 0) {
  let s = fs.readFileSync(php, 'utf8');

  // --- 2. skrypt edytora Lovable ------------------------------------------
  if (s.includes('cdn.gpteng.co')) {
    s = s
      .split('\n')
      .filter((l) => !l.includes('cdn.gpteng.co') &&
                     !l.includes('DO NOT REMOVE THIS SCRIPT TAG'))
      .join('\n');
    zmiany.push('usunieto skrypt cdn.gpteng.co');
  }

  // --- 3. SEO po stronie serwera ------------------------------------------
  // Adres i klucz publishable Supabase bierzemy z public/sitemap.php (jedno zrodlo).
  const sm = fs.existsSync(path.join(DIST, 'sitemap.php'))
    ? fs.readFileSync(path.join(DIST, 'sitemap.php'), 'utf8') : '';
  const smUrl = (sm.match(/\$SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
  const smKey = (sm.match(/\$SUPABASE_ANON\s*=\s*'(sb_publishable_[^']+)'/) || [])[1];
  if (!smUrl || !smKey) bledy.push('nie odczytano adresu/klucza publishable z sitemap.php');
  if (s.includes('$seoCanonical')) {
    zmiany.push('blok SEO juz obecny - pominieto');
  } else {
    const blok = `<?php
/**
 * SEO po stronie serwera - kanoniczny adres, tytul i meta robots.
 * SPA serwuje ten sam HTML pod kazdym adresem, wiec Googlebot przed
 * wykonaniem JS widzi identyczne strony bez canonicala i traktuje je
 * jako duplikaty. React-helmet nadpisuje te tagi po renderze (data-rh).
 * Generowane przez scripts/postbuild.cjs - nie edytowac w dist/.
 */
$seoUri   = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '/';
$seoRaw   = @parse_url($seoUri, PHP_URL_PATH);
if (!is_string($seoRaw) || $seoRaw === '') { $seoRaw = '/'; }
$seoQuery = @parse_url($seoUri, PHP_URL_QUERY);
$seoQs    = (is_string($seoQuery) && $seoQuery !== '') ? '?' . $seoQuery : '';
$seoPath  = '/' . trim($seoRaw, '/');

// Stare prefiksy jezykowe (/pl, /en, /cs, /sk, /de) -> wersja bez prefiksu.
$seoHadLang = (bool) preg_match('#^/(pl|en|cs|sk|de)(?=/|$)#', $seoPath);
$seoPath = preg_replace('#^/(pl|en|cs|sk|de)(?=/|$)#', '', $seoPath);
if ($seoPath === '' || !is_string($seoPath)) { $seoPath = '/'; }

$seoTitles = [
    '/'           => 'Stakerpol - Paleciaki elektryczne Toyota BT',
    '/produkty'   => 'Paleciaki elektryczne BT Toyota – oferta | Stakerpol',
    '/kontakt'    => 'Kontakt – Stakerpol | Paleciaki elektryczne BT Toyota',
    '/opinie'     => 'Opinie klientów – Stakerpol',
    '/faq'        => 'Najczęstsze pytania – Stakerpol',
    '/prywatnosc' => 'Polityka prywatności – Stakerpol',
];

// Trasy aplikacji (src/config/routes.ts + App.tsx) poza powyzszymi:
// 200 z noindex jak dotad (panel, oferty, stare angielskie adresy).
$seoOtherRoutes = ['/admin', '/products', '/contact', '/testimonials', '/privacy'];
$seoIsOther = in_array($seoPath, $seoOtherRoutes, true)
    || (bool) preg_match('#^/admin(/|$)#', $seoPath)
    || (bool) preg_match('#^/oferta/[^/]+$#', $seoPath)
    || (bool) preg_match('#^/products/[^/]+$#', $seoPath);

// --- przekierowania 301 ---
$seoTarget = $seoPath;
$seoMapped = false;
$seoOld = [
    '/toyota-bt-swe-200d'                       => '/produkty',
    '/uzywany-paleciak-elektryczny-podnoszacy'  => '/produkty',
    '/polityka-prywatnosci'                     => '/prywatnosc',
    '/sitemap.xml'                              => '/sitemap.php',
];
if (isset($seoOld[$seoPath])) { $seoTarget = $seoOld[$seoPath]; $seoMapped = true; }
elseif (strpos($seoPath, '/bt-toyota-staxio-') === 0) { $seoTarget = '/produkty'; $seoMapped = true; }

$seoIsProduct = (bool) preg_match('#^/produkty/[^/]+$#', $seoPath);
$seoTrailing  = $seoRaw !== '/' && substr($seoRaw, -1) === '/'
    && (isset($seoTitles[$seoPath]) || $seoIsProduct || $seoIsOther);

$seoRedirect = function ($to) use ($seoQs) {
    if (headers_sent()) { return; }
    header('Location: https://stakerpol.pl' . $to . $seoQs, true, 301);
    exit;
};
if ($seoMapped || $seoHadLang || $seoTrailing) { $seoRedirect($seoTarget); }

// --- sprawdzenie karty produktu w Supabase ---
// Zwraca ['found' => bool, 'slug' => string] albo null przy jakiejkolwiek
// watpliwosci (blad, timeout, brak cURL) - wtedy strona zostaje 200.
$seoLookup = function ($field, $value) {
    try {
        $cacheFile = rtrim((string) @sys_get_temp_dir(), '/') . '/stakerpol-seo-' . md5($field . ':' . $value) . '.json';
        $cached = @file_get_contents($cacheFile);
        if ($cached !== false) {
            $c = @json_decode($cached, true);
            if (is_array($c) && isset($c['t'], $c['found'])) {
                $ttl = $c['found'] ? 600 : 120;
                if (time() - (int) $c['t'] < $ttl) { return $c; }
            }
        }
        if (!function_exists('curl_init')) { return null; }
        $url = '__SUPABASE_URL__/rest/v1/products?select=slug&' . $field . '=eq.' . rawurlencode($value) . '&limit=1';
        $ch = @curl_init($url);
        if (!$ch) { return null; }
        @curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT        => 3,
            CURLOPT_HTTPHEADER     => ['apikey: __SUPABASE_KEY__', 'Accept: application/json'],
        ]);
        $body = @curl_exec($ch);
        $code = (int) @curl_getinfo($ch, CURLINFO_HTTP_CODE);
        @curl_close($ch);
        if ($body === false || $code !== 200) { return null; }
        $rows = @json_decode($body, true);
        if (!is_array($rows)) { return null; }
        if (count($rows) === 0) {
            $r = ['found' => false, 'slug' => ''];
        } elseif (isset($rows[0]) && is_array($rows[0])) {
            $r = ['found' => true, 'slug' => isset($rows[0]['slug']) ? (string) $rows[0]['slug'] : ''];
        } else {
            return null;
        }
        $r['t'] = time();
        @file_put_contents($cacheFile, json_encode($r));
        return $r;
    } catch (\Throwable $ex) {
        return null;
    }
};

$seoNotFound = false;
if ($seoIsProduct) {
    $seoSeg = rawurldecode(substr($seoPath, strlen('/produkty/')));
    if (preg_match('#^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$#i', $seoSeg)) {
        $seoRow = $seoLookup('id', strtolower($seoSeg));
        if ($seoRow !== null) {
            if (!$seoRow['found']) { $seoNotFound = true; }
            elseif ($seoRow['slug'] !== '') { $seoRedirect('/produkty/' . rawurlencode($seoRow['slug'])); }
        }
    } else {
        $seoRow = $seoLookup('slug', $seoSeg);
        if ($seoRow !== null && !$seoRow['found']) { $seoNotFound = true; }
    }
} elseif (!isset($seoTitles[$seoPath]) && !$seoIsOther) {
    $seoNotFound = true;
}
if ($seoNotFound && !headers_sent()) { http_response_code(404); }

$seoKnown     = !$seoNotFound && (isset($seoTitles[$seoPath]) || $seoIsProduct);
$seoCanonical = 'https://stakerpol.pl' . $seoPath;
$seoTitle     = isset($seoTitles[$seoPath]) ? $seoTitles[$seoPath] : $seoTitles['/'];
$seoRobots    = $seoKnown
    ? 'index, follow, max-image-preview:large, max-snippet:-1'
    : 'noindex, follow';
$e = function ($v) { return htmlspecialchars($v, ENT_QUOTES, 'UTF-8'); };
?>
`.replace(/\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

    const podmien = (re, repl, nazwa) => {
      if (!re.test(s)) { bledy.push(`nie rozpoznano: ${nazwa}`); return; }
      s = s.replace(re, repl);
    };

    podmien(/<title>[\s\S]*?<\/title>/,
      '<title><?php echo $e($seoTitle); ?></title>\n    ' +
      '<link rel="canonical" data-rh="true" href="<?php echo $e($seoCanonical); ?>" />',
      '<title>');

    podmien(/<meta\s+name="robots"[^>]*>/,
      '<meta name="robots" content="<?php echo $e($seoRobots); ?>" />',
      'meta robots');

    podmien(/<meta\s+property="og:url"[^>]*>/,
      '<meta property="og:url" data-rh="true" content="<?php echo $e($seoCanonical); ?>" />',
      'meta og:url');

    if (bledy.length === 0) {
      s = blok.split('__SUPABASE_URL__').join(smUrl).split('__SUPABASE_KEY__').join(smKey) + s.replace(/^\s*\n/, '');
      zmiany.push('wstrzyknieto SEO (canonical / title / robots)');
    }
  }

  if (bledy.length === 0) fs.writeFileSync(php, s, 'utf8');
}

// --- 4. sitemap ------------------------------------------------------------
if (!fs.existsSync(path.join(DIST, 'sitemap.php'))) {
  bledy.push('brak dist/sitemap.php - sprawdz czy plik jest w public/');
}

// --- podsumowanie ----------------------------------------------------------
for (const z of zmiany) console.log(`  [postbuild] ${z}`);
if (bledy.length) {
  console.error('\n  [postbuild] BUILD PRZERWANY:');
  for (const b of bledy) console.error(`    - ${b}`);
  console.error('\n  Szablon index.html zmienil sie na tyle, ze poprawki nie dadza sie nanies.');
  console.error('  Popraw scripts/postbuild.cjs zamiast wgrywac niepelny build.\n');
  process.exit(1);
}
console.log('  [postbuild] OK');
