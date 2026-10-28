<?php
declare(strict_types=1);
/**
 * Diagnostic — Cabinet Ajmi (version PHP)
 *
 * À ouvrir après l'installation :  https://votre-site.tn/check.php
 * Il vérifie le serveur, la base, les dossiers et la signature des jetons,
 * puis affiche un compte rendu. Ne révèle aucun mot de passe.
 * SUPPRIMEZ CE FICHIER une fois le contrôle terminé.
 */

define('AJMI', true);
define('AJMI_ROOT', __DIR__);

require __DIR__ . '/app/helpers.php';

$lignes = [];
/**
 * @param string $etat 'ok' | 'attention' (non bloquant) | 'ko' (à corriger)
 */
$ajout = function (string $label, string $etat, string $detail = '') use (&$lignes) {
    $lignes[] = ['label' => $label, 'etat' => $etat, 'detail' => $detail];
};
$ajoutOK = function (string $label, bool $ok, string $detail = '') use ($ajout) {
    $ajout($label, $ok ? 'ok' : 'ko', $detail);
};
$ajoutAvert = function (string $label, string $ok, string $pasOK, string $detail = '', bool $bon = false) use ($ajout) {
    $ajout($label, $bon ? 'ok' : $pasOK, $detail);
};

/* ------------------------------ Environnement ----------------------------- */

$ajoutOK('PHP 8.0+', version_compare(PHP_VERSION, '8.0.0', '>='), PHP_VERSION);
$ajoutOK('PDO', extension_loaded('pdo'), '');
$ajoutOK('PDO SQLite ou MySQL', extension_loaded('pdo_sqlite') || extension_loaded('pdo_mysql'),
    'sqlite : ' . (extension_loaded('pdo_sqlite') ? 'oui' : 'non') . ' · mysql : ' . (extension_loaded('pdo_mysql') ? 'oui' : 'non'));
$ajout('mbstring', extension_loaded('mbstring') ? 'ok' : 'attention',
    extension_loaded('mbstring') ? '' : 'facultatif : le texte arabe sera tronqué à l\'octet près');
$ajoutOK('Fichier index.html', is_file(__DIR__ . '/index.html'), 'site compilé');

$nbImages = is_dir(__DIR__ . '/images') ? count(scandir(__DIR__ . '/images')) - 2 : 0;
$ajout('Dossier images/', $nbImages > 0 ? 'ok' : 'attention', $nbImages > 0 ? $nbImages . ' fichiers' : 'dossier absent ou vide');

$ajoutOK('uploads/ accessible en écriture', is_dir(__DIR__ . '/uploads') && is_writable(__DIR__ . '/uploads'), __DIR__ . '/uploads');

$ajout('install.php supprimé', is_file(__DIR__ . '/install.php') ? 'attention' : 'ok',
    is_file(__DIR__ . '/install.php') ? 'à supprimer maintenant que l\'installation est faite' : '');

/* ------------------------------- Configuration ---------------------------- */

$configFile = __DIR__ . '/app/config.php';
$installe = is_file($configFile);
$ajoutOK('Configuration app/config.php', $installe, $installe ? '' : 'lancez install.php');

if ($installe) {
    $config = require $configFile;
    $ajoutOK('Secret des jetons', is_array($config) && strlen((string) ($config['jwt_secret'] ?? '')) >= 32, '');
    $ajout('Dossier app/ protégé', is_file(__DIR__ . '/app/.htaccess') ? 'ok' : 'attention',
        is_file(__DIR__ . '/app/.htaccess') ? 'interdit d\'accès par .htaccess' : 'fichier app/.htaccess manquant');

    $dataDir = $config['data_dir'] ?? '';
    $horsPublic = $dataDir !== '' && strpos($dataDir, __DIR__) !== 0;
    $ajout('Données hors du dossier public', $horsPublic ? 'ok' : 'attention',
        $horsPublic ? $dataDir : $dataDir . ' (protégé par .htaccess, mais un dossier hors du site serait préférable)');
    $ajoutOK('Dossier de travail inscriptible', $dataDir !== '' && is_dir($dataDir) && is_writable($dataDir), $dataDir);

    // Base de données
    try {
        require __DIR__ . '/app/auth.php';
        require __DIR__ . '/app/db.php';

        define('AJMI_CONFIG', $config + [
            'driver'      => 'sqlite',
            'sqlite_path' => __DIR__ . '/ajmi-data/ajmi.sqlite',
            'upload_dir'  => __DIR__ . '/uploads',
            'data_dir'    => __DIR__ . '/ajmi-data',
            'jwt_secret'  => '',
            'jwt_days'    => 7,
            'max_upload'  => 6291456,
            'mysql'       => ['host' => 'localhost', 'port' => 3306, 'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'],
        ]);

        if (($config['driver'] ?? 'sqlite') === 'mysql') {
            $tables = ajmi_toutes('SHOW TABLES');
        } else {
            $tables = ajmi_toutes("SELECT name FROM sqlite_master WHERE type = 'table'");
        }
        $noms = array_map(static fn ($t) => (string) reset($t), $tables);
        $attendues = ['users', 'content', 'history', 'messages', 'media', 'reservations'];
        $manquantes = array_diff($attendues, $noms);
        $ajoutOK('Tables de la base', !$manquantes, $manquantes ? 'manquantes : ' . implode(', ', $manquantes) : implode(', ', $attendues));

        $admins = (int) ajmi_valeur('SELECT count(*) FROM users');
        $ajoutOK('Compte administrateur', $admins > 0, $admins . ' compte(s)');

        // Aller-retour d'un jeton : signature et expiration.
        $jeton = ajmi_token_creer(['sub' => 'test@local', 'nom' => 'Test'], (string) $config['jwt_secret']);
        $verifie = ajmi_token_verifier($jeton, (string) $config['jwt_secret']);
        $falsifie = ajmi_token_verifier($jeton . 'x', (string) $config['jwt_secret']);
        $ajoutOK('Signature des jetons', is_array($verifie) && $falsifie === null, $verifie ? 'valide, falsification refusée' : 'échec');

        // Aller-retour d'un mot de passe.
        $h = ajmi_hash_mot_de_passe('motdepasse-de-test');
        $ajoutOK('Hachage des mots de passe', ajmi_verifie_mot_de_passe('motdepasse-de-test', $h) && !ajmi_verifie_mot_de_passe('autre', $h), 'algorithme : ' . (defined('PASSWORD_ARGON2ID') && password_get_info($h)['algoName'] === 'argon2id' ? 'argon2id' : 'bcrypt'));

        // Enregistrement d'une réservation de test, puis suppression.
        $code = 'TEST-#' . strtoupper(bin2hex(random_bytes(3)));
        ajmi_reservation_ajouter([
            'id' => $code, 'code_norm' => ajmi_code_normalise($code), 'created_at' => date('c'),
            'publication_id' => 'test', 'publication_title' => 'Test', 'nom' => 'Test', 'telephone' => '',
            'email' => '', 'adresse' => '', 'quantite' => 1, 'remarques' => '', 'statut' => 'en_attente', 'ip' => '127.0.0.1',
        ]);
        $retrouvee = ajmi_reservation_par_code(ajmi_code_normalise($code));
        ajmi_reservation_supprimer($code);
        $ajoutOK('Écriture et lecture en base', $retrouvee !== null, 'réservation de test créée puis supprimée');

        // Écriture d'une image de test.
        $nom = 'test-' . time() . '.png';
        $pixel = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        $ecrit = @file_put_contents(__DIR__ . '/uploads/' . $nom, $pixel) !== false;
        if ($ecrit) {
            @unlink(__DIR__ . '/uploads/' . $nom);
        }
        $ajoutOK('Écriture d\'une image dans uploads/', $ecrit, $ecrit ? 'fichier de test supprimé' : 'droits insuffisants');
    } catch (Throwable $e) {
        $ajout('Connexion à la base de données', 'ko', $e->getMessage());
    }
}

$echecs = count(array_filter($lignes, static fn ($l) => $l['etat'] === 'ko'));
$avertissements = count(array_filter($lignes, static fn ($l) => $l['etat'] === 'attention'));
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagnostic — Cabinet Ajmi</title>
<style>
  body { margin:0; font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; background:#f5f3ee; color:#1c1c1a; }
  .wrap { max-width:760px; margin:0 auto; padding:32px 20px 64px; }
  h1 { font-family:Georgia,serif; font-size:25px; margin:0 0 4px; }
  .sub { color:#6b6b63; font-size:14px; margin-bottom:22px; }
  .banner { border-radius:10px; padding:14px 16px; font-size:14px; margin-bottom:18px; font-weight:600; }
  .banner.ok { background:#e9f7ec; border:1px solid #b7e0c1; color:#14532d; }
  .banner.ko { background:#fdecea; border:1px solid #f3c2bd; color:#8c1d13; }
  .card { background:#fff; border:1px solid #e2ded4; border-radius:14px; padding:6px 22px; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  td { padding:10px 0; border-bottom:1px solid #f0ede6; vertical-align:top; }
  tr:last-child td { border-bottom:0; }
  .ok { color:#1a7f37; font-weight:600; white-space:nowrap; }
  .ko { color:#b42318; font-weight:600; white-space:nowrap; }
  .attention { color:#8a5a00; font-weight:600; white-space:nowrap; }
  .detail { color:#7a7a72; font-size:12px; display:block; margin-top:2px; word-break:break-all; }
  code { background:#f1eee7; padding:2px 6px; border-radius:5px; }
  a { color:#1f3a5f; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Diagnostic</h1>
  <p class="sub">Cabinet Ajmi — version PHP</p>

  <div class="banner <?= $echecs === 0 ? 'ok' : 'ko' ?>">
    <?php if ($echecs > 0): ?>
      <?= $echecs ?> point(s) à corriger ci-dessous.
    <?php elseif ($avertissements > 0): ?>
      Tout fonctionne. <?= $avertissements ?> remarque(s) sans gravité ci-dessous.
    <?php else: ?>
      Tout est en ordre : le site et l'administration peuvent fonctionner.
    <?php endif; ?>
  </div>

  <div class="card">
    <table>
      <?php foreach ($lignes as $ligne): ?>
        <tr>
          <td>
            <?= htmlspecialchars($ligne['label'], ENT_QUOTES, 'UTF-8') ?>
            <?php if ($ligne['detail'] !== ''): ?>
              <span class="detail"><?= htmlspecialchars($ligne['detail'], ENT_QUOTES, 'UTF-8') ?></span>
            <?php endif; ?>
          </td>
          <td class="<?= $ligne['etat'] === 'ok' ? 'ok' : ($ligne['etat'] === 'attention' ? 'attention' : 'ko') ?>">
            <?= $ligne['etat'] === 'ok' ? 'OK' : ($ligne['etat'] === 'attention' ? 'Remarque' : 'À corriger') ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </table>
  </div>

  <p class="sub" style="margin-top:20px">
    Rappel : supprimez <code>check.php</code> et <code>install.php</code> une fois les vérifications terminées.
    Administration : <a href="index.html#/admin">index.html#/admin</a>
  </p>
</div>
</body>
</html>
