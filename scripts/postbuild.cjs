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
$seoPath = parse_url(isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/', PHP_URL_PATH);
$seoPath = '/' . trim((string) $seoPath, '/');

// Stare prefiksy jezykowe (/pl, /en, /cs, /sk, /de) -> wersja bez prefiksu.
$seoPath = preg_replace('#^/(pl|en|cs|sk|de)(?=/|$)#', '', $seoPath);
if ($seoPath === '' || $seoPath === false) { $seoPath = '/'; }

$seoTitles = [
    '/'           => 'Stakerpol - Paleciaki elektryczne Toyota BT',
    '/produkty'   => 'Paleciaki elektryczne BT Toyota – oferta | Stakerpol',
    '/kontakt'    => 'Kontakt – Stakerpol | Paleciaki elektryczne BT Toyota',
    '/opinie'     => 'Opinie klientów – Stakerpol',
    '/faq'        => 'Najczęstsze pytania – Stakerpol',
    '/prywatnosc' => 'Polityka prywatności – Stakerpol',
];

$seoIsProduct = (bool) preg_match('#^/produkty/[^/]+$#', $seoPath);
$seoKnown     = isset($seoTitles[$seoPath]) || $seoIsProduct;
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
      s = blok + s.replace(/^\s*\n/, '');
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
