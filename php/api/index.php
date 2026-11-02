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

// Requête préliminaire CORS — indispensable pour les POST JSON.
// InfinityFree : le pare-feu peut bloquer les OPTIONS s'ils n'ont pas de réponse 204 avec les bons en-têtes.
if ($methode === 'OPTIONS') {
    // InfinityFree ajoute parfois ?i=1 à la première visite (challenge JS) : on l'ignore
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    ajmi_json(null, 204);
}

// InfinityFree : nettoie les requêtes d'images fantômes (aes.js challenge)
// Si le corps contient du HTML de challenge, on le signale en log
if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
    // rien de spécial, mais on évite de logger du bruit
}

// Chemin demandé. Plusieurs sources selon hébergement (InfinityFree, Hostinger, etc.) :
//   1. /api/health                     (réécriture .htaccess)
//   2. /api/index.php/health           (appel direct)
//   3. /api/index.php?r=/health         (repli sans mod_rewrite)
//   4. REDIRECT_URL / PATH_INFO (certains CGI)
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
// InfinityFree peut remplir REDIRECT_URL même quand REQUEST_URI est réécrit
if (empty($uri) || $uri === '/') {
    $uri = $_SERVER['REDIRECT_URL'] ?? $_SERVER['REQUEST_URI'] ?? '/';
    $uri = parse_url($uri, PHP_URL_PATH) ?: '/';
}
$position = strpos($uri, '/api/');

if ($position !== false) {
    // /api/health  ou  /sous-dossier/api/health
    $chemin = substr($uri, $position + 4); // conserve le « / » initial
    // Appel direct du contrôleur : /api/index.php/health
    $chemin = preg_replace('#^/index\.php#', '', $chemin) ?? $chemin;
} elseif (isset($_GET['r'])) {
    // Repli prévu pour hébergements sans réécriture :
    // /api/index.php?r=/health
    $chemin = '/' . ltrim((string) $_GET['r'], '/');
} elseif (!empty($_SERVER['PATH_INFO'])) {
    $chemin = $_SERVER['PATH_INFO'];
} elseif (!empty($_SERVER['ORIG_PATH_INFO'])) {
    $chemin = $_SERVER['ORIG_PATH_INFO'];
} else {
    $chemin = '/';
}

$chemin = '/' . trim($chemin, '/');
// InfinityFree ajoute ?i=1 au premier passage (challenge JS) — déjà retiré par parse_url,
// mais on nettoie au cas où un proxy l'aurait laissé dans PATH_INFO
$chemin = strtok($chemin, '?') ?: $chemin;

try {
    ajmi_router($methode, $chemin);
} catch (PDOException $e) {
    error_log('[ajmi] base de données : ' . $e->getMessage());
    ajmi_json(['error' => 'Base de données indisponible. Vérifiez config.php ou lancez install.php.'], 500);
} catch (Throwable $e) {
    error_log('[ajmi] ' . $e->getMessage());
    ajmi_json(['error' => 'Erreur interne du serveur.'], 500);
}
