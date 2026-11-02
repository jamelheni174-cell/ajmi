<?php
// Diagnostic InfinityFree - à mettre dans htdocs/ et ouvrir dans le navigateur
// https://ton-domaine.rf.gd/debug-infinity.php
header('Content-Type: text/plain; charset=utf-8');
echo "=== DIAGNOSTIC INFINITYFREE ===\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? '?') . "\n";
echo "REDIRECT_URL: " . ($_SERVER['REDIRECT_URL'] ?? '?') . "\n";
echo "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? '?') . "\n";
echo "PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? '?') . "\n";
echo "QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? '?') . "\n";
echo "HTTP_HOST: " . ($_SERVER['HTTP_HOST'] ?? '?') . "\n";
echo "REQUEST_METHOD: " . ($_SERVER['REQUEST_METHOD'] ?? '?') . "\n";
echo "mod_rewrite: " . (function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? 'oui' : 'inconnu/absent') . "\n";
echo "\n--- Test .htaccess ---\n";
echo "Si tu vas sur /api/health et que tu vois ce fichier, c'est que .htaccess ne redirige pas.\n";
echo "Essaye aussi :\n";
echo " - /api/index.php/health\n";
echo " - /api/index.php?r=/health\n";
echo " - /debug-infinity.php/api/health (path info)\n";
