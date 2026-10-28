<?php
declare(strict_types=1);
/**
 * Amorçage commun : constantes, configuration, bibliothèques.
 * Ce fichier n'est jamais appelé directement (garde AJMI).
 */

if (!defined('AJMI')) {
    http_response_code(403);
    exit('Accès interdit.');
}

define('AJMI_ROOT', dirname(__DIR__));                 // dossier du projet
define('AJMI_APP', __DIR__);                           // dossier app/

$configFile = AJMI_APP . '/config.php';
$installe = is_file($configFile);

if (!$installe) {
    // Pas encore de config : seul install.php peut continuer.
    if (!defined('AJMI_INSTALL')) {
        ajmi_json([
            'error' => 'Le site n\'est pas encore installé. Ouvrez /install.php dans le navigateur.',
        ], 503);
    }
    return;
}

/** @var array $AJMI_CONFIG */
$AJMI_CONFIG = require $configFile;

if (!is_array($AJMI_CONFIG)) {
    if (defined('AJMI_INSTALL')) {
        throw new RuntimeException('config.php est invalide.');
    }
    ajmi_json(['error' => 'Configuration illisible (config.php).'], 500);
}

// Valeurs par défaut, au cas où un fichier de configuration ancien
// ne contient pas encore toutes les clés.
$AJMI_CONFIG += [
    'driver'      => 'sqlite',
    'sqlite_path' => AJMI_ROOT . '/ajmi-data/ajmi.sqlite',
    'upload_dir'  => AJMI_ROOT . '/uploads',
    'data_dir'    => AJMI_ROOT . '/ajmi-data',
    'jwt_secret'  => '',
    'jwt_days'    => 7,
    'max_upload'  => 6291456,
    'mysql'       => ['host' => 'localhost', 'port' => 3306, 'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'],
];

define('AJMI_CONFIG', $AJMI_CONFIG);
define('AJMI_DATA', $AJMI_CONFIG['data_dir']);

// Dossiers indispensables (créés au besoin, ex. après restauration d'une sauvegarde).
foreach ([AJMI_DATA, AJMI_CONFIG['upload_dir']] as $dossier) {
    if (!is_dir($dossier)) {
        @mkdir($dossier, 0755, true);
    }
}

if (!defined('AJMI_INSTALL') && ($AJMI_CONFIG['jwt_secret'] === '' || strlen($AJMI_CONFIG['jwt_secret']) < 32)) {
    ajmi_json(['error' => 'Secret de signature absent : relancez install.php.'], 500);
}
