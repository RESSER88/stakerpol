<?php
/**
 * Sitemap dynamiczny – generowany z Supabase REST API.
 * Anon key jest kluczem publicznym (taki sam jak w bundle JS frontendu).
 *
 * Produkty pobierane są przy każdym żądaniu, więc lista aktualizuje się sama
 * po dodaniu/usunięciu oferty w panelu admina.
 *
 * Ścieżki zgodne z src/config/routes.ts (adresy polskie).
 */

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');

$BASE_URL        = 'https://stakerpol.pl';
$SUPABASE_URL    = 'https://peztqgfmmnxaaoapzpbw.supabase.co';
$SUPABASE_ANON   = 'sb_publishable_sRP0GUZEwGV8RaAPgAwL_w_Ahi-mqFB';

// Statusy uznawane za "aktywne" – tylko te trafiają do sitemapy.
// Wartości enuma availability_status: available | reserved | sold.
$ACTIVE_STATUSES = ['available', 'reserved'];

// Awaryjna kopia listy produktów – używana, gdy Supabase nie odpowie.
$CACHE_FILE = sys_get_temp_dir() . '/stakerpol-sitemap-products.json';

// ?debug=1 dopisuje komentarz XML z informacją, skąd wzięły się dane.
$DEBUG = isset($_GET['debug']);

$now = date('Y-m-d');

/**
 * Pobiera URL – najpierw cURL, potem file_get_contents.
 * Hostingi współdzielone często mają allow_url_fopen=Off.
 */
function fetchUrl($url, array $headers, &$error)
{
    $error = '';

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_FOLLOWLOCATION => true,
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($body !== false && $code >= 200 && $code < 300) {
            return $body;
        }
        $error = 'curl: ' . ($err !== '' ? $err : 'HTTP ' . $code);
    } else {
        $error = 'curl: brak rozszerzenia';
    }

    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create([
            'http' => [
                'method'  => 'GET',
                'header'  => implode("\r\n", $headers),
                'timeout' => 10,
            ],
        ]);
        $body = @file_get_contents($url, false, $ctx);
        if ($body !== false) {
            return $body;
        }
        $error .= ' | fopen: zapytanie nieudane';
    } else {
        $error .= ' | fopen: allow_url_fopen=Off';
    }

    return false;
}

// Strony statyczne – ścieżki polskie. /admin i /oferta celowo pominięte.
$staticPages = [
    ['url' => '/',           'changefreq' => 'weekly',  'priority' => '1.0'],
    ['url' => '/produkty',   'changefreq' => 'daily',   'priority' => '0.9'],
    ['url' => '/kontakt',    'changefreq' => 'monthly', 'priority' => '0.8'],
    ['url' => '/opinie',     'changefreq' => 'monthly', 'priority' => '0.7'],
    ['url' => '/faq',        'changefreq' => 'monthly', 'priority' => '0.7'],
    ['url' => '/prywatnosc', 'changefreq' => 'yearly',  'priority' => '0.3'],
];

// Pobierz aktywne produkty z Supabase REST API
$products = [];
$source   = 'api';
$fetchErr = '';
$fetchOk  = false;

$apiUrl = $SUPABASE_URL . '/rest/v1/products'
    . '?select=slug,id,updated_at'
    . '&availability_status=in.(' . implode(',', $ACTIVE_STATUSES) . ')'
    . '&order=updated_at.desc'
    . '&limit=5000';

$response = fetchUrl($apiUrl, [
    'apikey: ' . $SUPABASE_ANON,
    'Authorization: Bearer ' . $SUPABASE_ANON,
    'Accept: application/json',
], $fetchErr);

if ($response !== false) {
    $decoded = json_decode($response, true);
    if (is_array($decoded)) {
        $products = $decoded;
        $fetchOk  = true;
    } else {
        $fetchErr = 'json: ' . json_last_error_msg();
    }
}

if ($fetchOk) {
    // Pusta lista też jest poprawnym wynikiem, więc nie sięgamy po cache.
    @file_put_contents($CACHE_FILE, json_encode($products));
} else {
    $cached = @file_get_contents($CACHE_FILE);
    if ($cached !== false) {
        $decoded = json_decode($cached, true);
        if (is_array($decoded) && $decoded) {
            $products = $decoded;
            $source   = 'cache';
        }
    }
    if (!$products) {
        $source = 'brak';
    }
}

// Najnowsza modyfikacja produktu – realistyczny lastmod dla / i /produkty
$latestProductMod = null;
foreach ($products as $product) {
    if (!empty($product['updated_at'])) {
        $day = substr($product['updated_at'], 0, 10);
        if ($latestProductMod === null || $day > $latestProductMod) {
            $latestProductMod = $day;
        }
    }
}
$listingMod = $latestProductMod ?: $now;

// Buduj XML
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

if ($DEBUG) {
    echo '  <!-- produkty: ' . count($products)
        . ' | zrodlo: ' . $source
        . ($fetchErr !== '' ? ' | blad: ' . htmlspecialchars($fetchErr) : '')
        . " -->\n";
}

foreach ($staticPages as $page) {
    $lastmod = ($page['url'] === '/' || $page['url'] === '/produkty') ? $listingMod : $now;

    echo "  <url>\n";
    echo '    <loc>' . htmlspecialchars($BASE_URL . $page['url']) . "</loc>\n";
    echo '    <lastmod>' . $lastmod . "</lastmod>\n";
    echo '    <changefreq>' . $page['changefreq'] . "</changefreq>\n";
    echo '    <priority>' . $page['priority'] . "</priority>\n";
    echo "  </url>\n";
}

foreach ($products as $product) {
    $identifier = !empty($product['slug']) ? $product['slug'] : ($product['id'] ?? null);
    if (!$identifier) continue;

    $lastmod = !empty($product['updated_at'])
        ? substr($product['updated_at'], 0, 10)
        : $now;

    echo "  <url>\n";
    echo '    <loc>' . htmlspecialchars($BASE_URL . '/produkty/' . rawurlencode($identifier)) . "</loc>\n";
    echo '    <lastmod>' . $lastmod . "</lastmod>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>0.8</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>';
