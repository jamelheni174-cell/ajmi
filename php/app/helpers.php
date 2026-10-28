<?php
declare(strict_types=1);
/**
 * Outils transverses : réponses JSON, lecture du corps de requête,
 * limitation de débit, noms de fichiers sûrs.
 */

/** Réponse JSON (UTF-8 non échappé : accents et arabe lisibles en clair). */
function ajmi_json(mixed $body, int $status = 200): void
{
    http_response_code($status);
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($status === 204) {
        exit; // une réponse 204 ne porte pas de corps
    }

    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Erreur au format attendu par le site : { "error": "…" } */
function ajmi_error(string $message, int $status = 400): void
{
    ajmi_json(['error' => $message], $status);
}

/**
 * Corps JSON de la requête (tableau vide si le corps est vide).
 *
 * La constante AJMI_INPUT n'existe que pour les tests automatisés, qui
 * exécutent le contrôleur hors d'un serveur web ; elle n'est jamais définie
 * en production.
 */
function ajmi_body(int $limit = 1048576): array
{
    $raw = defined('AJMI_INPUT') ? (string) AJMI_INPUT : file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    if (strlen($raw) > $limit) {
        ajmi_error('Fichier trop volumineux.', 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        ajmi_error('Requête invalide.', 400);
    }
    return $data;
}

/** Adresse IP du visiteur. */
function ajmi_ip(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $first = explode(',', (string) $_SERVER[$key])[0];
            return substr(trim($first), 0, 60);
        }
    }
    return '?';
}

/**
 * Limitation de débit simple, sans APCu ni Redis : un fichier JSON verrouillé
 * dans le dossier de travail. Suffisant pour freiner robots et force brute.
 *
 * @param string $cle     identifiant du compteur (ex. "login:41.0.0.1")
 * @param int    $max     nombre d'opérations autorisées par fenêtre
 * @param int    $fenetre durée de la fenêtre, en secondes
 * @param bool   $compter false pour seulement consulter le quota
 */
function ajmi_rate(string $cle, int $max = 30, int $fenetre = 60, bool $compter = true): bool
{
    $fichier = AJMI_DATA . '/rate.json';
    $maintenant = time();

    $fh = @fopen($fichier, 'c+');
    if ($fh === false) {
        return true; // dossier non inscriptible : on ne bloque pas le site
    }
    @flock($fh, LOCK_EX);

    $contenu = stream_get_contents($fh);
    $etat = is_string($contenu) && $contenu !== '' ? json_decode($contenu, true) : [];
    if (!is_array($etat)) {
        $etat = [];
    }

    $entree = $etat[$cle] ?? ['n' => 0, 't' => $maintenant];
    if ($maintenant - (int) $entree['t'] > $fenetre) {
        $entree = ['n' => 0, 't' => $maintenant];
    }

    $autorise = (int) $entree['n'] < $max;

    if ($compter && $autorise) {
        $entree['n'] = (int) $entree['n'] + 1;
    }

    if ($compter) {
        $etat[$cle] = $entree;
    }

    // Nettoyage des compteurs anciens (une chance sur vingt).
    if ($compter && random_int(1, 20) === 1) {
        foreach ($etat as $k => $v) {
            if ($maintenant - (int) ($v['t'] ?? 0) > 3600) {
                unset($etat[$k]);
            }
        }
    }

    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($etat));
    fflush($fh);
    @flock($fh, LOCK_UN);
    fclose($fh);

    return $autorise;
}

/**
 * "RÉSER-#C68F9C" → "RESERC68F9C".
 *
 * Les accents sont translittérés (« É » → « E ») puis tout caractère non
 * alphanumérique est retiré : un client qui tape « RESER » retrouve bien
 * « RÉSER-#… ». C'est un peu plus tolérant que la version Cloudflare, qui
 * supprime l'accent ; ajmi_code_variantes() accepte les deux formes pour
 * rester compatible avec des références créées à l'époque de Cloudflare.
 */
function ajmi_code_normalise(string $code): string
{
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $code);
    $base = $ascii !== false ? $ascii : $code;
    return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $base) ?? '');
}

/**
 * Formes acceptées pour une référence saisie : avec translittération
 * (règle principale) et sans (règle de la version Cloudflare).
 *
 * @return string[]
 */
function ajmi_code_variantes(string $code): array
{
    $variantes = [
        ajmi_code_normalise($code),
        strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? ''),
    ];
    return array_values(array_unique(array_filter($variantes)));
}

/** Nom de fichier sûr pour une image téléversée. */
function ajmi_nom_fichier(string $nom, string $extension): string
{
    $base = preg_replace('/\.[^.]*$/', '', $nom) ?? 'image';
    $base = strtolower(preg_replace('/[^a-z0-9._-]+/i', '_', $base) ?? 'image');
    $base = trim($base, '._-') ?: 'image';
    // Suffixe aléatoire : deux envois dans la même seconde ne s'écrasent pas.
    return time() . '-' . bin2hex(random_bytes(2)) . '-' . substr($base, 0, 60) . $extension;
}

/** Date au format "Y-m-d H:i:s" (identique à SQLite et MySQL). */
function ajmi_now(): string
{
    return date('Y-m-d H:i:s');
}

/** Valeur entière bornée. */
function ajmi_int($valeur, int $min, int $max): int
{
    $n = (int) $valeur;
    return max($min, min($max, $n));
}

/** Longueur en caractères (mbstring si disponible, octets sinon). */
function ajmi_longueur(string $texte): int
{
    return function_exists('mb_strlen') ? mb_strlen($texte) : strlen($texte);
}

/** Texte tronqué et nettoyé. */
function ajmi_texte($valeur, int $max): string
{
    $texte = trim((string) $valeur);
    $texte = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $texte) ?? '';
    return function_exists('mb_substr') ? mb_substr($texte, 0, $max) : substr($texte, 0, $max);
}
