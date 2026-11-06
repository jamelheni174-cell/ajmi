<?php
declare(strict_types=1);
/**
 * Sitemap dynamique — lit les publications depuis ajmi-data/content.json (si présent)
 * sinon depuis app/data.json (fallback). Sert le sitemap XML avec les bonnes URLs.
 */
header('Content-Type: application/xml; charset=utf-8');

$base = 'https://cabinetmaitreajmi.tn';
$now = date('Y-m-d');

$statics = [
  ['loc' => "$base/", 'priority' => '1.0', 'changefreq' => 'weekly'],
  ['loc' => "$base/services", 'priority' => '0.9', 'changefreq' => 'monthly'],
  ['loc' => "$base/competences", 'priority' => '0.8', 'changefreq' => 'monthly'],
  ['loc' => "$base/experiences", 'priority' => '0.7', 'changefreq' => 'monthly'],
  ['loc' => "$base/actualites", 'priority' => '0.8', 'changefreq' => 'weekly'],
  ['loc' => "$base/contact", 'priority' => '0.7', 'changefreq' => 'yearly'],
  ['loc' => "$base/suivi", 'priority' => '0.5', 'changefreq' => 'yearly'],
];

// Tentative lecture des publications pour ajouter les /publication/{id}
$pubs = [];
$candidates = [
  __DIR__ . '/../ajmi-data/content.json',
  __DIR__ . '/ajmi-data/content.json',
  __DIR__ . '/../app/data.json',
  __DIR__ . '/../src/data.ts', // not JSON, skip
];
foreach ($candidates as $p) {
  if (is_file($p)) {
    $raw = file_get_contents($p);
    if ($raw === false) continue;
    $json = json_decode($raw, true);
    if (is_array($json) && isset($json['publications']) && is_array($json['publications'])) {
      $pubs = $json['publications'];
      break;
    }
  }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($statics as $u) {
  echo "  <url><loc>" . htmlspecialchars($u['loc']) . "</loc><lastmod>$now</lastmod><changefreq>{$u['changefreq']}</changefreq><priority>{$u['priority']}</priority></url>\n";
}
foreach ($pubs as $pub) {
  $id = $pub['id'] ?? '';
  if ($id === '') continue;
  $loc = "$base/publication/" . rawurlencode($id);
  echo "  <url><loc>" . htmlspecialchars($loc) . "</loc><lastmod>$now</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n";
}
echo "</urlset>\n";
