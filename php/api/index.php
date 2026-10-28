<?php
declare(strict_types=1);
/**
 * Cabinet Ajmi — API PHP (contrôleur unique).
 *
 * Toutes les routes /api/… du site passent ici. Le contrat est identique
 * à celui de la version Cloudflare (worker/index.js) : le site React
 * fonctionne sans modification, en même origine.
 */

define('AJMI', true);

require __DIR__ . '/../app/helpers.php';
require __DIR__ . '/../app/bootstrap.php';
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/db.php';
require __DIR__ . '/../app/routes.php';

$methode = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// Requête préliminaire CORS.
if ($methode === 'OPTIONS') {
    ajmi_json(null, 204);
}

// Chemin demandé. Deux sources, selon que la réécriture d'URL est active
// ou non (certains hébergements désactivent mod_rewrite) :
//   1. /api/health              (réécriture .htaccess)
//   2. /api/index.php?r=/health (repli sans réécriture)
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$position = strpos($uri, '/api/');

if ($position !== false) {
    // /api/health  ou  /sous-dossier/api/health
    $chemin = substr($uri, $position + 4); // conserve le « / » initial
    // Appel direct du contrôleur : /api/index.php/health
    $chemin = preg_replace('#^/index\.php#', '', $chemin) ?? $chemin;
} elseif (isset($_GET['r'])) {
    // Repli prévu par .htaccess pour les hébergements sans réécriture :
    // /api/index.php?r=/health
    $chemin = '/' . ltrim((string) $_GET['r'], '/');
} else {
    $chemin = $_SERVER['PATH_INFO'] ?? '/';
}

$chemin = '/' . trim($chemin, '/');

try {
    ajmi_router($methode, $chemin);
} catch (PDOException $e) {
    error_log('[ajmi] base de données : ' . $e->getMessage());
    ajmi_json(['error' => 'Base de données indisponible. Vérifiez config.php ou lancez install.php.'], 500);
} catch (Throwable $e) {
    error_log('[ajmi] ' . $e->getMessage());
    ajmi_json(['error' => 'Erreur interne du serveur.'], 500);
}
