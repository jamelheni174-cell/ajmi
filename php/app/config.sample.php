<?php
/**
 * Configuration — Cabinet Ajmi (version PHP)
 *
 * Ce fichier est écrit automatiquement par install.php.
 * Pour une installation manuelle, copiez config.sample.php en config.php.
 *
 * ATTENTION : ne jamais versionner ce fichier (il contient le secret des
 * jetons et, le cas échéant, le mot de passe de la base MySQL).
 */

return [
    // 'sqlite' (aucune configuration) ou 'mysql'
    'driver' => 'sqlite',

    // Chemin du fichier SQLite — hors du dossier public si possible.
    'sqlite_path' => dirname(__DIR__) . '/ajmi-data/ajmi.sqlite',

    // MySQL / MariaDB (ignoré en SQLite)
    'mysql' => [
        'host'    => 'localhost',
        'port'    => 3306,
        'name'    => 'ajmi',
        'user'    => 'ajmi',
        'pass'    => '',
        'charset' => 'utf8mb4',
    ],

    // Dossier des images téléversées (doit être accessible depuis le web).
    'upload_dir' => __DIR__ . '/uploads',

    // Dossier de travail (compteurs anti-abus, verrou d'installation).
    'data_dir' => dirname(__DIR__) . '/ajmi-data',

    // Secret de signature des jetons d'administration (généré à l'installation).
    'jwt_secret' => '',

    // Durée de vie d'une session d'administration, en jours.
    'jwt_days' => 7,

    // Taille maximale d'une image téléversée, en octets (6 Mo).
    'max_upload' => 6291456,
];
