<?php
declare(strict_types=1);
/**
 * Mots de passe et jetons d'administration.
 *
 * — Mots de passe : password_hash() (bcrypt ou argon2id selon le serveur),
 *   la fonction native de PHP, sans limite de temps CPU — contrairement à
 *   la version Cloudflare qui doit rester sous 10 ms.
 * — Jetons : JWT HS256 maison, même format que la version Cloudflare,
 *   afin que le site puisse basculer de l'un à l'autre sans changement.
 */

/* ------------------------------ Mots de passe ----------------------------- */

function ajmi_hash_mot_de_passe(string $motdepasse): string
{
    return password_hash($motdepasse, PASSWORD_DEFAULT);
}

/**
 * Vérifie un mot de passe. Accepte aussi les empreintes PBKDF2 de la
 * version Cloudflare (pbkdf2$itérations$sel$empreinte), pour permettre
 * un jour de rapatrier une base existante.
 */
function ajmi_verifie_mot_de_passe(string $motdepasse, string $empreinte): bool
{
    if (str_starts_with($empreinte, 'pbkdf2$')) {
        $parties = explode('$', $empreinte);
        if (count($parties) !== 4) {
            return false;
        }
        [, $iterations, $sel, $attendu] = $parties;
        $calcule = hash_pbkdf2('sha256', $motdepasse, ajmi_base64url_decode($sel), (int) $iterations, 64, true);
        return hash_equals($attendu, ajmi_base64url_encode($calcule));
    }

    return password_verify($motdepasse, $empreinte);
}

/** Rehachage automatique si l'algorithme par défaut du serveur a changé. */
function ajmi_mot_de_passe_a_racheter(string $empreinte): bool
{
    return !str_starts_with($empreinte, 'pbkdf2$') && password_needs_rehash($empreinte, PASSWORD_DEFAULT);
}

/* --------------------------------- Base64url ------------------------------ */

function ajmi_base64url_encode(string $binaire): string
{
    return rtrim(strtr(base64_encode($binaire), '+/', '-_'), '=');
}

function ajmi_base64url_decode(string $texte): string
{
    $padded = strtr($texte, '-_', '+/');
    $reste = strlen($padded) % 4;
    if ($reste) {
        $padded .= str_repeat('=', 4 - $reste);
    }
    $binaire = base64_decode($padded, true);
    return $binaire === false ? '' : $binaire;
}

/* ----------------------------------- JWT ---------------------------------- */

/** Crée un jeton signé HMAC-SHA256. */
function ajmi_token_creer(array $charge, string $secret, int $jours = 7): string
{
    $entete = ajmi_base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_UNESCAPED_UNICODE));
    $charge['exp'] = (int) round(microtime(true) * 1000) + $jours * 86400000;
    $corps = ajmi_base64url_encode(json_encode($charge, JSON_UNESCAPED_UNICODE));
    $signature = ajmi_base64url_encode(hash_hmac('sha256', "$entete.$corps", $secret, true));
    return "$entete.$corps.$signature";
}

/** Vérifie un jeton ; renvoie sa charge utile, ou null. */
function ajmi_token_verifier(?string $token, string $secret): ?array
{
    if (!$token) {
        return null;
    }
    $parties = explode('.', trim($token));
    if (count($parties) !== 3) {
        return null;
    }
    [$entete, $corps, $signature] = $parties;

    $attendu = ajmi_base64url_encode(hash_hmac('sha256', "$entete.$corps", $secret, true));
    if (!hash_equals($attendu, $signature)) {
        return null;
    }

    $charge = json_decode(ajmi_base64url_decode($corps), true);
    if (!is_array($charge) || empty($charge['exp']) || (int) $charge['exp'] < (int) round(microtime(true) * 1000)) {
        return null;
    }
    return $charge;
}

/** En-tête Authorization, quel que soit le mode d'exécution de PHP. */
function ajmi_entete_authorization(): string
{
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION', 'HTTP_X_AUTHORIZATION'] as $cle) {
        if (!empty($_SERVER[$cle])) {
            return (string) $_SERVER[$cle];
        }
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $nom => $valeur) {
            if (strtolower($nom) === 'authorization') {
                return (string) $valeur;
            }
        }
    }
    return '';
}

/** Charge utile du jeton de la requête courante (null si non connecté). */
function ajmi_utilisateur_courant(): ?array
{
    $entete = ajmi_entete_authorization();
    if ($entete === '' || !preg_match('/^Bearer\s+(.+)$/i', $entete, $m)) {
        return null;
    }
    return ajmi_token_verifier($m[1], AJMI_CONFIG['jwt_secret']);
}
