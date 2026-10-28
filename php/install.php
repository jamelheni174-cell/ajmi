<?php
declare(strict_types=1);
/**
 * Assistant d'installation — Cabinet Ajmi (version PHP)
 *
 * À ouvrir une seule fois dans le navigateur :  https://votre-site.tn/install.php
 * Il crée la configuration, la base de données et le compte administrateur.
 * SUPPRIMEZ CE FICHIER une fois l'installation terminée.
 */

define('AJMI', true);
define('AJMI_INSTALL', true);
define('AJMI_ROOT', __DIR__);

require __DIR__ . '/app/helpers.php';
require __DIR__ . '/app/auth.php';
require __DIR__ . '/app/db.php';

$configFile = __DIR__ . '/app/config.php';
$dejaInstalle = is_file($configFile);

/* --------------------------- Vérifications serveur ------------------------ */

$verifications = [
    [
        'label' => 'PHP 8.0 ou plus récent',
        'ok'    => version_compare(PHP_VERSION, '8.0.0', '>='),
        'detail' => 'Version détectée : ' . PHP_VERSION,
    ],
    [
        'label' => 'Extension PDO',
        'ok'    => extension_loaded('pdo'),
        'detail' => 'Nécessaire pour la base de données',
    ],
    [
        'label' => 'PDO SQLite ou PDO MySQL',
        'ok'    => extension_loaded('pdo_sqlite') || extension_loaded('pdo_mysql'),
        'detail' => 'SQLite : ' . (extension_loaded('pdo_sqlite') ? 'disponible' : 'absent')
            . ' · MySQL : ' . (extension_loaded('pdo_mysql') ? 'disponible' : 'absent'),
    ],
    [
        'label' => 'Extension JSON',
        'ok'    => extension_loaded('json'),
        'detail' => 'Indispensable au fonctionnement du site',
    ],
    [
        'label' => 'Extension mbstring (recommandée)',
        'ok'    => extension_loaded('mbstring'),
        'detail' => extension_loaded('mbstring') ? 'Présente' : 'Absente : le texte arabe sera tronqué en octets',
    ],
    [
        'label' => 'Dossier app/ accessible en écriture',
        'ok'    => is_writable(__DIR__ . '/app'),
        'detail' => __DIR__ . '/app',
    ],
    [
        'label' => 'Dossier uploads/ accessible en écriture',
        'ok'    => is_dir(__DIR__ . '/uploads') && is_writable(__DIR__ . '/uploads'),
        'detail' => __DIR__ . '/uploads',
    ],
    [
        'label' => 'Fichier du site présent (index.html)',
        'ok'    => is_file(__DIR__ . '/index.html'),
        'detail' => 'Le site React compilé',
    ],
];

$toutBon = !in_array(false, array_column($verifications, 'ok'), true);

/* -------------------------------- Traitement ------------------------------ */

$erreurs = [];
$succes = null;

if (!$dejaInstalle && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $driver   = ($_POST['driver'] ?? 'sqlite') === 'mysql' ? 'mysql' : 'sqlite';
    $nom      = trim((string) ($_POST['nom'] ?? ''));
    $email    = trim((string) ($_POST['email'] ?? ''));
    $motDePasse = (string) ($_POST['password'] ?? '');
    $confirme = (string) ($_POST['password2'] ?? '');

    if ($nom === '') {
        $nom = 'Administrateur';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erreurs[] = 'Adresse email invalide.';
    }
    if (strlen($motDePasse) < 8) {
        $erreurs[] = 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if ($motDePasse !== $confirme) {
        $erreurs[] = 'Les deux mots de passe ne correspondent pas.';
    }

    $mysql = [
        'host'    => trim((string) ($_POST['mysql_host'] ?? 'localhost')) ?: 'localhost',
        'port'    => (int) ($_POST['mysql_port'] ?? 3306) ?: 3306,
        'name'    => trim((string) ($_POST['mysql_name'] ?? '')),
        'user'    => trim((string) ($_POST['mysql_user'] ?? '')),
        'pass'    => (string) ($_POST['mysql_pass'] ?? ''),
        'charset' => 'utf8mb4',
    ];
    if ($driver === 'mysql' && ($mysql['name'] === '' || $mysql['user'] === '')) {
        $erreurs[] = 'Pour MySQL : nom de la base et utilisateur sont obligatoires.';
    }
    if (!$toutBon) {
        $erreurs[] = 'Corrigez d\'abord les points signalés en rouge ci-dessous.';
    }

    // Emplacement des données : hors du dossier public si possible.
    $dataDir = dirname(__DIR__) . '/ajmi-data';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0755, true);
    }
    if (!is_dir($dataDir) || !is_writable($dataDir)) {
        $dataDir = __DIR__ . '/ajmi-data';
        if (!is_dir($dataDir)) {
            @mkdir($dataDir, 0755, true);
        }
        @file_put_contents(
            $dataDir . '/.htaccess',
            "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n"
        );
    }

    $sqlitePath = $dataDir . '/ajmi.sqlite';
    $config = [
        'driver'      => $driver,
        'sqlite_path' => $sqlitePath,
        'mysql'       => $mysql,
        'upload_dir'  => __DIR__ . '/uploads',
        'data_dir'    => $dataDir,
        'jwt_secret'  => bin2hex(random_bytes(32)),
        'jwt_days'    => 7,
        'max_upload'  => 6291456,
    ];

    if (!$erreurs) {
        try {
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ];
            if ($driver === 'mysql') {
                $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $mysql['host'], $mysql['port'], $mysql['name']);
                $pdo = new PDO($dsn, $mysql['user'], $mysql['pass'], $options);
            } else {
                $pdo = new PDO('sqlite:' . $sqlitePath, null, null, $options);
                $pdo->exec('PRAGMA journal_mode = WAL');
            }

            ajmi_installer_schema($pdo, $driver);

            $empreinte = ajmi_hash_mot_de_passe($motDePasse);
            $existant = $pdo->prepare('SELECT id FROM users WHERE lower(email) = lower(?)');
            $existant->execute([$email]);
            $ligne = $existant->fetch();
            if ($ligne) {
                $pdo->prepare('UPDATE users SET nom = ?, password = ? WHERE id = ?')
                    ->execute([$nom, $empreinte, $ligne['id']]);
            } else {
                $pdo->prepare('INSERT INTO users (nom, email, password, created_at) VALUES (?,?,?,?)')
                    ->execute([$nom, strtolower($email), $empreinte, date('Y-m-d H:i:s')]);
            }

            // Écriture atomique de la configuration.
            $code = "<?php\n/**\n * Configuration générée par install.php le " . date('d/m/Y H:i') . ".\n * Ne pas versionner : ce fichier contient le secret des jetons.\n */\n\nreturn "
                . var_export($config, true) . ";\n";
            $temporaire = $configFile . '.tmp';
            if (file_put_contents($temporaire, $code) === false || !rename($temporaire, $configFile)) {
                throw new RuntimeException('Impossible d\'écrire app/config.php : vérifiez les droits du dossier app/.');
            }
            @chmod($configFile, 0640);

            $succes = [
                'driver'    => $driver,
                'dataDir'   => $dataDir,
                'horsPublic' => strpos($dataDir, __DIR__) !== 0,
                'email'     => strtolower($email),
            ];
        } catch (Throwable $e) {
            $erreurs[] = 'Installation impossible : ' . $e->getMessage();
        }
    }
}

function h($valeur): string
{
    return htmlspecialchars((string) $valeur, ENT_QUOTES, 'UTF-8');
}
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Installation — Cabinet Ajmi</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         background: #f5f3ee; color: #1c1c1a; line-height: 1.5; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 32px 20px 64px; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size: 26px; margin: 0 0 4px; }
  .sub { color: #6b6b63; font-size: 14px; margin-bottom: 28px; }
  .card { background: #fff; border: 1px solid #e2ded4; border-radius: 14px; padding: 22px; margin-bottom: 18px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .08em; color: #4a4a44; margin: 0 0 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 7px 0; border-bottom: 1px solid #f0ede6; vertical-align: top; }
  tr:last-child td { border-bottom: 0; }
  .ok { color: #1a7f37; font-weight: 600; white-space: nowrap; }
  .ko { color: #b42318; font-weight: 600; white-space: nowrap; }
  .detail { color: #7a7a72; font-size: 12px; }
  label { display: block; font-size: 13px; font-weight: 600; margin: 14px 0 5px; }
  input[type=text], input[type=email], input[type=password], input[type=number] {
    width: 100%; padding: 10px 12px; border: 1px solid #d6d2c8; border-radius: 8px;
    font-size: 15px; font-family: inherit; background: #fdfcfa; }
  input:focus { outline: 2px solid #1f3a5f; outline-offset: 1px; }
  .row { display: flex; gap: 12px; } .row > div { flex: 1; }
  .radio { display: flex; gap: 18px; margin-top: 6px; }
  .radio label { display: flex; align-items: center; gap: 7px; font-weight: 500; margin: 0; }
  button { margin-top: 20px; width: 100%; padding: 13px; border: 0; border-radius: 9px;
           background: #1f3a5f; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
  button:disabled { background: #9aa6b5; cursor: not-allowed; }
  .alert { border-radius: 10px; padding: 14px 16px; font-size: 14px; margin-bottom: 18px; }
  .alert.err { background: #fdecea; border: 1px solid #f3c2bd; color: #8c1d13; }
  .alert.ok  { background: #e9f7ec; border: 1px solid #b7e0c1; color: #14532d; }
  .alert.warn{ background: #fff8e6; border: 1px solid #f0dca8; color: #6b4e00; }
  ul { margin: 8px 0 0 18px; padding: 0; } li { margin: 4px 0; font-size: 14px; }
  code { background: #f1eee7; padding: 2px 6px; border-radius: 5px; font-size: 13px; }
  .muted { color: #7a7a72; font-size: 13px; }
  .hide { display: none; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Cabinet Ajmi — installation</h1>
  <p class="sub">Version PHP · hébergement mutualisé</p>

  <?php if ($dejaInstalle): ?>
    <div class="alert ok">
      <strong>Le site est déjà installé.</strong><br>
      La configuration <code>app/config.php</code> existe.
    </div>
    <div class="card">
      <h2>À faire maintenant</h2>
      <ul>
        <li>Supprimez <code>install.php</code> et <code>check.php</code> de votre hébergement.</li>
        <li>Ouvrez le site, puis l'administration : <a href="index.html#/admin">index.html#/admin</a></li>
      </ul>
      <p class="muted">Mot de passe oublié : voir la section « Dépannage » du fichier README.md.</p>
    </div>
  <?php elseif ($succes): ?>
    <div class="alert ok">
      <strong>Installation terminée.</strong> Le site est prêt à fonctionner.
    </div>
    <div class="card">
      <h2>Récapitulatif</h2>
      <table>
        <tr><td>Base de données</td><td><?= $succes['driver'] === 'mysql' ? 'MySQL / MariaDB' : 'SQLite (' . h(basename($succes['dataDir'])) . '/ajmi.sqlite)' ?></td></tr>
        <tr><td>Données hors du dossier public</td><td><?= $succes['horsPublic'] ? '<span class="ok">oui</span>' : '<span class="ko">non</span> — protégées par .htaccess' ?></td></tr>
        <tr><td>Compte administrateur</td><td><?= h($succes['email']) ?></td></tr>
      </table>
    </div>
    <div class="card">
      <h2>Dernière étape — importante</h2>
      <ul>
        <li>Supprimez <code>install.php</code> et <code>check.php</code> (FTP ou gestionnaire de fichiers).</li>
        <li>Ouvrez l'administration : <a href="index.html#/admin">index.html#/admin</a> et connectez-vous.</li>
        <li>Vérifiez que le bandeau indique « Backend connecté ».</li>
      </ul>
    </div>
  <?php else: ?>

    <div class="card">
      <h2>1. Vérifications du serveur</h2>
      <table>
        <?php foreach ($verifications as $v): ?>
          <tr>
            <td>
              <?= h($v['label']) ?><br>
              <span class="detail"><?= h($v['detail']) ?></span>
            </td>
            <td class="<?= $v['ok'] ? 'ok' : 'ko' ?>"><?= $v['ok'] ? 'OK' : 'À corriger' ?></td>
          </tr>
        <?php endforeach; ?>
      </table>
      <?php if (!$toutBon): ?>
        <div class="alert warn" style="margin-top:16px;margin-bottom:0">
          Corrigez les lignes rouges avant de continuer (droits des dossiers : 755, ou 775 chez certains hébergeurs).
        </div>
      <?php endif; ?>
    </div>

    <?php if ($erreurs): ?>
      <div class="alert err">
        <strong>L'installation n'a pas abouti :</strong>
        <ul><?php foreach ($erreurs as $e): ?><li><?= h($e) ?></li><?php endforeach; ?></ul>
      </div>
    <?php endif; ?>

    <form method="post" class="card">
      <h2>2. Base de données</h2>
      <div class="radio">
        <label><input type="radio" name="driver" value="sqlite" <?= ($_POST['driver'] ?? 'sqlite') === 'sqlite' ? 'checked' : '' ?> onchange="majDriver()"> SQLite (recommandé, aucune configuration)</label>
        <label><input type="radio" name="driver" value="mysql" <?= ($_POST['driver'] ?? '') === 'mysql' ? 'checked' : '' ?> onchange="majDriver()"> MySQL / MariaDB</label>
      </div>

      <div id="mysqlZone" class="<?= ($_POST['driver'] ?? '') === 'mysql' ? '' : 'hide' ?>">
        <p class="muted">Ces informations sont fournies par votre hébergeur (cPanel → Bases de données MySQL).</p>
        <div class="row">
          <div>
            <label for="mysql_host">Serveur</label>
            <input id="mysql_host" type="text" name="mysql_host" value="<?= h($_POST['mysql_host'] ?? 'localhost') ?>">
          </div>
          <div>
            <label for="mysql_port">Port</label>
            <input id="mysql_port" type="number" name="mysql_port" value="<?= h($_POST['mysql_port'] ?? '3306') ?>">
          </div>
        </div>
        <label for="mysql_name">Nom de la base</label>
        <input id="mysql_name" type="text" name="mysql_name" value="<?= h($_POST['mysql_name'] ?? '') ?>" placeholder="utilisateur_ajmi">
        <div class="row">
          <div>
            <label for="mysql_user">Utilisateur</label>
            <input id="mysql_user" type="text" name="mysql_user" value="<?= h($_POST['mysql_user'] ?? '') ?>">
          </div>
          <div>
            <label for="mysql_pass">Mot de passe</label>
            <input id="mysql_pass" type="password" name="mysql_pass" value="">
          </div>
        </div>
      </div>

      <h2 style="margin-top:26px">3. Compte administrateur</h2>
      <label for="nom">Nom affiché</label>
      <input id="nom" type="text" name="nom" value="<?= h($_POST['nom'] ?? 'Me Mohamed Anouar Ajmi') ?>">
      <label for="email">Adresse email</label>
      <input id="email" type="email" name="email" value="<?= h($_POST['email'] ?? '') ?>" required autocomplete="username">
      <div class="row">
        <div>
          <label for="password">Mot de passe (8 caractères min.)</label>
          <input id="password" type="password" name="password" required autocomplete="new-password">
        </div>
        <div>
          <label for="password2">Confirmation</label>
          <input id="password2" type="password" name="password2" required autocomplete="new-password">
        </div>
      </div>

      <button type="submit" <?= $toutBon ? '' : 'disabled' ?>>Installer le site</button>
      <?php if (!$toutBon): ?>
        <p class="muted" style="text-align:center;margin-top:10px">Le bouton s'activera quand les vérifications seront au vert.</p>
      <?php endif; ?>
    </form>

    <script>
      function majDriver() {
        const mysql = document.querySelector('input[name=driver]:checked').value === 'mysql';
        document.getElementById('mysqlZone').classList.toggle('hide', !mysql);
      }
    </script>
  <?php endif; ?>
</div>
</body>
</html>
