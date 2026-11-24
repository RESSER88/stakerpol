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

// --- karta produktu z Supabase ---
// ZMIEN W OBU MIEJSCACH: pola i reguly ponizej odpowiadaja src/types/supabase.ts
// (mapSupabaseProductToProduct), src/utils/seo/productMeta.ts, src/utils/productImageAlt.ts,
// src/utils/seo/generateProductSchema.ts i src/utils/productPricing.ts.
// Zgodnosc: bun scripts/check-ssr-parity.ts (uruchamiany recznie).
// Zwraca ['found' => bool, 'slug' => string, 'row' => array|null] albo null przy
// jakiejkolwiek watpliwosci (blad, timeout, brak cURL) - wtedy strona zostaje 200.
$seoSelect = 'id,slug,name,serial_number,production_year,lift_capacity_mast,lift_capacity_initial,'
    . 'working_hours,lift_height,min_height,mast,battery,condition,drive_type,free_lift,'
    . 'short_description,detailed_description,image_url,main_image_alt,slogan,availability_status,'
    . 'price_display_mode,net_price,price_currency,'
    . 'product_images(image_url,display_order),'
    . 'product_seo_settings(gtin,mpn,price_valid_until,enable_schema)';
$seoLookup = function ($field, $value) use ($seoSelect) {
    try {
        $dir = rtrim((string) @sys_get_temp_dir(), '/');
        $cacheFile = $dir . '/stakerpol-seo3-' . md5($field . ':' . $value) . '.json';
        $cached = @file_get_contents($cacheFile);
        if ($cached !== false) {
            $c = @json_decode($cached, true);
            if (is_array($c) && isset($c['t'], $c['found'])) {
                $ttl = $c['found'] ? 600 : 120;
                if (time() - (int) $c['t'] < $ttl) { return $c; }
            }
        }
        if (!function_exists('curl_init')) { return null; }
        $url = '__SUPABASE_URL__/rest/v1/products?select=' . rawurlencode($seoSelect)
            . '&' . $field . '=eq.' . rawurlencode($value) . '&limit=1';
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
            $r = ['found' => false, 'slug' => '', 'row' => null];
        } elseif (isset($rows[0]) && is_array($rows[0])) {
            $r = ['found' => true, 'slug' => isset($rows[0]['slug']) ? (string) $rows[0]['slug'] : '', 'row' => $rows[0]];
        } else {
            return null;
        }
        $r['t'] = time();
        $json = json_encode($r);
        $tmp = $json !== false ? @tempnam($dir, 'stkseo') : false;
        if ($tmp !== false) {
            if (@file_put_contents($tmp, $json) === false || !@rename($tmp, $cacheFile)) { @unlink($tmp); }
        }
        return $r;
    } catch (Throwable $ex) {
        return null;
    }
};

$seoNotFound = false;
$seoProd = null;
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
        if ($seoRow !== null && $seoRow['found'] && isset($seoRow['row']) && is_array($seoRow['row'])) { $seoProd = $seoRow['row']; }
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
$e = function ($v) { return htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); };

// --- head i tresc karty z serwera ---
// ZMIEN W OBU MIEJSCACH (patrz komentarz przy $seoLookup). Przy jakimkolwiek bledzie
// zostaje dzisiejszy szablon: domyslne meta i pusty #root.
$seoM = [];
$seoHead = '';
$seoBody = '';
if ($seoProd !== null && !$seoNotFound) {
    set_error_handler(function () { return true; });
    try {
        $p = $seoProd;
        $s = function ($k) use ($p) {
            if (!isset($p[$k]) || $p[$k] === null || is_bool($p[$k]) || is_array($p[$k])) { return ''; }
            return (string) $p[$k];
        };
        $model  = $s('name');
        $year   = $s('production_year');
        $height = $s('lift_height');
        $capM   = $s('lift_capacity_mast');
        $capI   = $s('lift_capacity_initial');
        $hours  = $s('working_hours');
        $cond   = $s('condition');
        $drive  = $s('drive_type');
        $serial = $s('serial_number');
        $status = $s('availability_status') !== '' ? $s('availability_status') : 'available';
        $slugV  = $s('slug') !== '' ? $s('slug') : $s('id');

        // zdjecia: product_images wg display_order (stabilnie), glowne = image_url || pierwsze
        $imgRows = (isset($p['product_images']) && is_array($p['product_images'])) ? $p['product_images'] : [];
        usort($imgRows, function ($a, $b) {
            $x = (is_array($a) && isset($a['display_order'])) ? (float) $a['display_order'] : 0;
            $y = (is_array($b) && isset($b['display_order'])) ? (float) $b['display_order'] : 0;
            return $x <=> $y;
        });
        $images = [];
        foreach ($imgRows as $ir) {
            if (is_array($ir) && isset($ir['image_url']) && is_string($ir['image_url']) && $ir['image_url'] !== '') { $images[] = $ir['image_url']; }
        }
        $image = $s('image_url') !== '' ? $s('image_url') : (count($images) > 0 ? $images[0] : '');

        // productMeta.ts: getProductMetaTitle / getProductMetaDescription / getProductOgImage
        $parts = [];
        if ($height !== '') { $parts[] = $height . ' mm'; }
        if ($capM !== '') { $parts[] = $capM . ' kg'; }
        $title = $model . ($year !== '' ? ' ' . $year : '') . (count($parts) ? ' — ' . implode(', ', $parts) : '') . ' | Stakerpol';
        $specs = [];
        if ($year !== '') { $specs[] = 'rok ' . $year; }
        if ($height !== '') { $specs[] = 'podnoszenie ' . $height . ' mm'; }
        if ($capM !== '') { $specs[] = 'udźwig ' . $capM . ' kg'; }
        if ($hours !== '') { $specs[] = $hours . ' mth'; }
        $avail = $status === 'available' ? ' Dostępny od razu.'
            : ($status === 'reserved' ? ' Egzemplarz zarezerwowany.'
            : ($status === 'sold' ? ' Egzemplarz sprzedany.' : ''));
        $desc = 'Używany ' . $model . (count($specs) ? ', ' . implode(', ', $specs) : '') . '.' . $avail
            . ' Stakerpol — sprzedaż używanych wózków paletowych Toyota BT.';
        $ogImage = count($images) > 0 ? $images[0] : $image;

        // productImageAlt.ts: getMainImageAlt
        $alt = trim($s('main_image_alt'));
        if ($alt === '') { $alt = trim($s('slogan')); }
        if ($alt === '') { $alt = $year !== '' ? trim(trim($model) . ' ' . trim($year)) : trim($model); }

        // productPricing.ts: resolvePriceView
        $mode = $s('price_display_mode') !== '' ? $s('price_display_mode') : 'inquiry_with_pricelist';
        $netRaw = (isset($p['net_price']) && is_numeric($p['net_price'])) ? (float) $p['net_price'] : null;
        $currency = $s('price_currency') !== '' ? $s('price_currency') : 'PLN';
        $hasPrice = $mode === 'show_price' && $netRaw !== null && is_finite($netRaw) && $netRaw > 0;
        $priceTxt = null;
        if ($hasPrice) {
            $n = round($netRaw);
            $sep = abs($n) >= 10000 ? chr(0xC2) . chr(0xA0) : '';
            $priceTxt = number_format($n, 0, '', $sep) . ' ' . $currency;
        }

        // generateProductSchema.ts
        $seo = null;
        if (isset($p['product_seo_settings']) && is_array($p['product_seo_settings'])) {
            $seo = $p['product_seo_settings'];
            if (isset($seo[0]) && is_array($seo[0])) { $seo = $seo[0]; }
            elseif (count($seo) === 0) { $seo = null; }
        }
        $sv = function ($k) use ($seo) {
            return (is_array($seo) && isset($seo[$k]) && !is_array($seo[$k]) && !is_bool($seo[$k])) ? (string) $seo[$k] : '';
        };
        $modelName = $model;
        if (preg_match('/SWE[0-9]+[A-Za-z0-9_]*/i', $model, $mm)) { $modelName = $mm[0]; }
        elseif (preg_match('/BT[A-Za-z0-9_]*[0-9]+/i', $model, $mm)) { $modelName = $mm[0]; }
        $allImages = [];
        if ($image !== '') { $allImages[] = $image; }
        foreach ($images as $im) { $allImages[] = $im; }
        $allImages = array_values(array_unique($allImages));
        $props = [];
        $prop = function ($name, $value, $unit = null) use (&$props) {
            $x = ['@type' => 'PropertyValue', 'name' => $name, 'value' => $value];
            if ($unit !== null) { $x['unitCode'] = $unit; }
            $props[] = $x;
        };
        if ($height !== '') { $prop('Wysokość podnoszenia', $height . ' mm', 'MMT'); }
        if ($capM !== '') { $prop('Udźwig na maszcie', $capM . ' kg', 'KGM'); }
        if ($capI !== '') { $prop('Udźwig przy podnoszeniu wstępnym', $capI . ' kg', 'KGM'); }
        if ($hours !== '') { $prop('Motogodziny', $hours . ' mth', 'HUR'); }
        if ($year !== '') { $prop('Rok produkcji', $year); }
        if ($cond !== '') { $prop('Stan', $cond); }
        if ($drive !== '') { $prop('Typ napędu', $drive); }
        $prop('Zastosowanie', 'Magazyny i centra dystrybucyjne');
        $prop('Zastosowanie', 'Zakłady produkcyjne');
        $schemaDesc = $s('short_description') !== '' ? $s('short_description')
            : ($s('detailed_description') !== '' ? $s('detailed_description') : 'Wózek widłowy ' . $model);
        $schema = [
            '@context' => 'https://schema.org/',
            '@type' => 'Product',
            'name' => $model,
            'brand' => ['@type' => 'Brand', 'name' => 'Toyota'],
            'model' => $modelName,
            'sku' => $serial !== '' ? $serial : $s('id'),
            'description' => $schemaDesc,
            'url' => 'https://stakerpol.pl/produkty/' . $slugV,
            'image' => $allImages,
            'manufacturer' => ['@type' => 'Organization', 'name' => 'Toyota'],
            'category' => 'Wózki paletowe BT Toyota',
            'additionalProperty' => $props,
        ];
        $gtin = trim($sv('gtin'));
        $gtinOk = false;
        if (preg_match('/^([0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$/', $gtin)) {
            $d = array_map('intval', str_split($gtin));
            $check = array_pop($d);
            $d = array_reverse($d);
            $sum = 0;
            foreach ($d as $i => $v) { $sum += $v * ($i % 2 === 0 ? 3 : 1); }
            $gtinOk = ((10 - ($sum % 10)) % 10) === $check;
        }
        if ($gtinOk) { $schema['gtin'] = $gtin; }
        if ($sv('mpn') !== '') { $schema['mpn'] = $sv('mpn'); }
        $schemaOn = $seo === null || !empty($seo['enable_schema']);
        if ($schemaOn && $hasPrice) {
            $av = $status === 'reserved' ? 'PreOrder' : ($status === 'sold' ? 'OutOfStock' : 'InStock');
            $lc = function_exists('mb_strtolower') ? mb_strtolower($cond, 'UTF-8') : strtolower($cond);
            $refurb = false;
            foreach (['odnowion', 'odnowien', 'refurb', 'po renowacji', 'renowacj', 'regenerowan'] as $h) {
                if (strpos($lc, $h) !== false) { $refurb = true; }
            }
            $offers = [
                '@type' => 'Offer',
                'availability' => 'https://schema.org/' . $av,
                'itemCondition' => $refurb ? 'https://schema.org/RefurbishedCondition' : 'https://schema.org/UsedCondition',
                'businessFunction' => 'https://schema.org/Sell',
                'seller' => ['@type' => 'Organization', 'name' => 'Stakerpol', 'url' => 'https://stakerpol.pl', 'telephone' => '+48694133592'],
                'hasMerchantReturnPolicy' => ['@type' => 'MerchantReturnPolicy', 'applicableCountry' => 'PL', 'returnPolicyCategory' => 'https://schema.org/MerchantReturnNotPermitted'],
                'shippingDetails' => [
                    '@type' => 'OfferShippingDetails',
                    'shippingRate' => ['@type' => 'MonetaryAmount', 'currency' => 'PLN'],
                    'shippingDestination' => ['@type' => 'DefinedRegion', 'addressCountry' => 'PL'],
                    'deliveryTime' => [
                        '@type' => 'ShippingDeliveryTime',
                        'businessDays' => ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => [
                            'https://schema.org/Monday', 'https://schema.org/Tuesday', 'https://schema.org/Wednesday',
                            'https://schema.org/Thursday', 'https://schema.org/Friday']],
                        'cutoffTime' => '16:00:00+01:00',
                        'handlingTime' => ['@type' => 'QuantitativeValue', 'minValue' => 1, 'maxValue' => 3, 'unitCode' => 'DAY'],
                        'transitTime' => ['@type' => 'QuantitativeValue', 'minValue' => 1, 'maxValue' => 5, 'unitCode' => 'DAY'],
                    ],
                ],
                'price' => number_format($netRaw, 2, '.', ''),
                'priceCurrency' => $currency,
            ];
            if ($sv('price_valid_until') !== '') { $offers['priceValidUntil'] = $sv('price_valid_until'); }
            $schema['offers'] = $offers;
        }
        if ($year !== '') { $schema['productionDate'] = $year; }
        $ld = json_encode($schema, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
            | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);

        $https = function ($u) { return (is_string($u) && strpos($u, 'https://') === 0) ? $u : ''; };
        $og = $https($ogImage);

        // --- tresc #root: zwykla, widoczna wersja karty (React zastapi ja po starcie) ---
        $statusTxt = $status === 'sold' ? 'Sprzedany' : ($status === 'reserved' ? 'Zarezerwowany' : 'Dostępny');
        $li = [];
        $add = function ($label, $v, $unit = '') use (&$li, $e) {
            if ($v !== '') { $li[] = '<li>' . $e($label) . ': ' . $e($v . $unit) . '</li>'; }
        };
        $add('Rok produkcji', $year);
        $add('Motogodziny', $hours, ' mth');
        $add('Udźwig na maszcie', $capM, ' kg');
        $add('Udźwig przy podnoszeniu wstępnym', $capI, ' kg');
        $add('Wysokość podnoszenia', $height, ' mm');
        $add('Wysokość minimalna', $s('min_height'), ' mm');
        $add('Maszt', $s('mast'));
        $add('Wolny skok', $s('free_lift'), ' mm');
        $add('Bateria', $s('battery'));
        $add('Stan', $cond);
        $add('Typ napędu', $drive);
        $add('Numer seryjny', $serial);
        $txt = function ($v) use ($e) {
            $v = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\\n", $v)));
            if ($v === '') { return ''; }
            $out = '';
            foreach (preg_split('/[\\r\\n]+/', $v) as $para) {
                $para = trim($para);
                if ($para !== '') { $out .= '<p>' . $e($para) . '</p>'; }
            }
            return $out;
        };
        $mainImg = $https($image);
        $b  = '<main style="min-height:100vh;max-width:1200px;margin:0 auto;padding:24px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b;line-height:1.5">';
        $b .= '<p><a href="/produkty">Wszystkie wózki</a></p>';
        $b .= '<h1 style="font-size:28px;margin:8px 0">' . $e($model) . '</h1>';
        $b .= '<p><strong>Status:</strong> ' . $e($statusTxt) . '</p>';
        if ($mainImg !== '') {
            $b .= '<img src="' . $e($mainImg) . '" alt="' . $e($alt) . '" width="800" height="600" style="display:block;max-width:100%;height:auto">';
        }
        $b .= $hasPrice
            ? '<p><strong>Cena netto:</strong> ' . $e($priceTxt) . '</p>'
            : '<p><strong>Cena:</strong> Na zapytanie</p>';
        if (count($li)) { $b .= '<h2 style="font-size:20px">Parametry</h2><ul>' . implode('', $li) . '</ul>'; }
        $opis = $txt($s('short_description')) . $txt($s('detailed_description'));
        if ($opis !== '') { $b .= '<h2 style="font-size:20px">Opis</h2>' . $opis; }
        $b .= '<p><a href="/kontakt">Kontakt — zapytaj o ten wózek</a> · <a href="/produkty">Zobacz wszystkie wózki</a></p>';
        $b .= '</main>';

        $h = '';
        if ($og !== '') { $h .= '<meta property="og:image:alt" data-rh="true" content="' . $e($alt) . '" />' . "\\n"; }
        if ($ld !== false) { $h .= '<script type="application/ld+json" data-rh="true">' . $ld . '</script>' . "\\n"; }

        $seoM = [
            'description' => $desc, 'og:title' => $title, 'og:description' => $desc,
            'twitter:title' => $title, 'twitter:description' => $desc,
        ];
        if ($og !== '') { $seoM['og:image'] = $og; $seoM['twitter:image'] = $og; }
        $seoTitle = $title;
        $seoHead = $h;
        $seoBody = $b;
    } catch (Throwable $ex) {
        $seoM = []; $seoHead = ''; $seoBody = '';
    }
    restore_error_handler();
}

// --- lista /produkty z serwera ---
// ZMIEN W OBU MIEJSCACH: src/pages/Products.tsx + usePublicSupabaseProducts.ts
// (created_at malejaco, domyslnie tylko available/reserved - matchesDefaultAvailability),
// zdjecie jak ProductCard: product_images[0] wg display_order, inaczej image_url.
if ($seoPath === '/produkty' && !$seoNotFound) {
    set_error_handler(function () { return true; });
    try {
        $rows = null;
        $dir = rtrim((string) @sys_get_temp_dir(), '/');
        $cacheFile = $dir . '/stakerpol-seo3-lista.json';
        $cached = @file_get_contents($cacheFile);
        if ($cached !== false) {
            $c = @json_decode($cached, true);
            if (is_array($c) && isset($c['t'], $c['rows']) && is_array($c['rows']) && time() - (int) $c['t'] < 600) { $rows = $c['rows']; }
        }
        if ($rows === null && function_exists('curl_init')) {
            $url = '__SUPABASE_URL__/rest/v1/products?select='
                . rawurlencode('slug,id,name,production_year,image_url,main_image_alt,slogan,availability_status,created_at,product_images(image_url,display_order)')
                . '&order=created_at.desc';
            $ch = @curl_init($url);
            if ($ch) {
                @curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CONNECTTIMEOUT => 2,
                    CURLOPT_TIMEOUT        => 3,
                    CURLOPT_HTTPHEADER     => ['apikey: __SUPABASE_KEY__', 'Accept: application/json'],
                ]);
                $body = @curl_exec($ch);
                $code = (int) @curl_getinfo($ch, CURLINFO_HTTP_CODE);
                @curl_close($ch);
                if ($body !== false && $code === 200) {
                    $d = @json_decode($body, true);
                    if (is_array($d)) {
                        $rows = $d;
                        $json = json_encode(['t' => time(), 'rows' => $rows]);
                        $tmp = $json !== false ? @tempnam($dir, 'stkseo') : false;
                        if ($tmp !== false) {
                            if (@file_put_contents($tmp, $json) === false || !@rename($tmp, $cacheFile)) { @unlink($tmp); }
                        }
                    }
                }
            }
        }
        if (is_array($rows) && count($rows) > 0) {
            $li = [];
            foreach ($rows as $r) {
                if (!is_array($r)) { continue; }
                $g = function ($k) use ($r) {
                    return (isset($r[$k]) && !is_array($r[$k]) && !is_bool($r[$k]) && $r[$k] !== null) ? (string) $r[$k] : '';
                };
                $st = $g('availability_status') !== '' ? $g('availability_status') : 'available';
                if ($st !== 'available' && $st !== 'reserved') { continue; }
                $slug = $g('slug') !== '' ? $g('slug') : $g('id');
                if ($slug === '') { continue; }
                $name = $g('name'); $year = $g('production_year');
                $label = trim($name . ($year !== '' ? ' ' . $year : ''));
                $imgs = (isset($r['product_images']) && is_array($r['product_images'])) ? $r['product_images'] : [];
                usort($imgs, function ($a, $b) {
                    $x = (is_array($a) && isset($a['display_order'])) ? (float) $a['display_order'] : 0;
                    $y = (is_array($b) && isset($b['display_order'])) ? (float) $b['display_order'] : 0;
                    return $x <=> $y;
                });
                $img = '';
                foreach ($imgs as $ir) {
                    if (is_array($ir) && isset($ir['image_url']) && is_string($ir['image_url']) && $ir['image_url'] !== '') { $img = $ir['image_url']; break; }
                }
                if ($img === '') { $img = $g('image_url'); }
                if (strpos($img, 'https://') !== 0) { $img = ''; }
                $alt = trim($g('main_image_alt'));
                if ($alt === '') { $alt = trim($g('slogan')); }
                if ($alt === '') { $alt = $label; }
                $item = '<li style="margin:8px 0"><a href="/produkty/' . $e(rawurlencode($slug)) . '">';
                if ($img !== '') {
                    $item .= '<img src="' . $e($img) . '" alt="' . $e($alt) . '" width="120" height="90" loading="lazy" style="vertical-align:middle;margin-right:12px;object-fit:cover">';
                }
                $item .= $e($label) . '</a></li>';
                $li[] = $item;
            }
            if (count($li) > 0) {
                $b  = '<main style="min-height:100vh;max-width:1200px;margin:0 auto;padding:24px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b;line-height:1.5">';
                $b .= '<h1 style="font-size:28px;margin:8px 0">Paleciaki elektryczne BT Toyota – oferta</h1>';
                $b .= '<ul style="list-style:none;padding:0">' . implode('', $li) . '</ul>';
                $b .= '<p><a href="/kontakt">Kontakt — zapytaj o wózek</a></p>';
                $b .= '</main>';
                $seoBody = $b;
            }
        }
    } catch (Throwable $ex) {
        $seoBody = '';
    }
    restore_error_handler();
}
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

    for (const k of ['description', 'og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image']) {
      const re = new RegExp('(<meta\\s+(?:name|property)="' + k.replace(':', '\\:') + '"[^>]*?content=")([^"]*)(")');
      podmien(re, (_, a, orig, z) =>
        a + "<?php if (isset($seoM['" + k + "'])) { echo $e($seoM['" + k + "']); } else { ?>" + orig + '<?php } ?>' + z,
        'meta ' + k);
    }

    podmien(/<\/head>/, '<?php echo $seoHead; ?>\n  </head>', '</head>');

    podmien(/<div id="root"><\/div>/, '<div id="root"><?php echo $seoBody; ?></div>', '#root');

    podmien(/<meta\s+property="og:url"[^>]*>/,
      '<meta property="og:url" data-rh="true" content="<?php echo $e($seoCanonical); ?>" />',
      'meta og:url');

    if (bledy.length === 0) {
      s = blok.split('__SUPABASE_URL__').join(smUrl).split('__SUPABASE_KEY__').join(smKey) + s.replace(/^\s*\n/, '');
      zmiany.push('wstrzyknieto SEO (canonical / title / robots / karta produktu)');
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
