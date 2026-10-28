<?php
declare(strict_types=1);
/**
 * Accès aux données — PDO (SQLite ou MySQL).
 * Mêmes opérations que worker/db.js, en PHP.
 */

function ajmi_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = AJMI_CONFIG;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    if (($cfg['driver'] ?? 'sqlite') === 'mysql') {
        $m = $cfg['mysql'];
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $m['host'], $m['port'], $m['name'], $m['charset']);
        $pdo = new PDO($dsn, $m['user'], $m['pass'], $options);
    } else {
        $dossier = dirname($cfg['sqlite_path']);
        if (!is_dir($dossier)) {
            @mkdir($dossier, 0755, true);
        }
        $pdo = new PDO('sqlite:' . $cfg['sqlite_path'], null, null, $options);
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
    }

    return $pdo;
}

/** Exécute une requête préparée et renvoie le statement. */
function ajmi_q(string $sql, array $params = []): PDOStatement
{
    $stmt = ajmi_db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function ajmi_toutes(string $sql, array $params = []): array
{
    return ajmi_q($sql, $params)->fetchAll();
}

function ajmi_une(string $sql, array $params = []): ?array
{
    $ligne = ajmi_q($sql, $params)->fetch();
    return $ligne === false ? null : $ligne;
}

function ajmi_valeur(string $sql, array $params = [])
{
    return ajmi_q($sql, $params)->fetchColumn();
}

/* ---------------------------------- Users --------------------------------- */

function ajmi_user_par_email(string $email): ?array
{
    return ajmi_une('SELECT * FROM users WHERE lower(email) = lower(?)', [$email]);
}

function ajmi_user_creer(string $nom, string $email, string $empreinte): void
{
    $email = strtolower(trim($email));
    $existant = ajmi_user_par_email($email);
    if ($existant) {
        ajmi_q('UPDATE users SET nom = ?, password = ? WHERE id = ?', [$nom, $empreinte, $existant['id']]);
        return;
    }
    ajmi_q(
        'INSERT INTO users (nom, email, password, created_at) VALUES (?, ?, ?, ?)',
        [$nom, $email, $empreinte, ajmi_now()]
    );
}

function ajmi_user_mot_de_passe(int $id, string $empreinte): void
{
    ajmi_q('UPDATE users SET password = ? WHERE id = ?', [$empreinte, $id]);
}

/* --------------------------------- Contenu -------------------------------- */

function ajmi_contenu(): ?array
{
    $ligne = ajmi_une('SELECT data FROM content WHERE id = 1');
    if (!$ligne) {
        return null;
    }
    $decode = json_decode($ligne['data'], true);
    return is_array($decode) ? $decode : null;
}

function ajmi_contenu_enregistrer(array $contenu, ?string $auteur): void
{
    $json = json_encode($contenu, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $maintenant = ajmi_now();
    $existe = ajmi_une('SELECT id FROM content WHERE id = 1');
    if ($existe) {
        ajmi_q('UPDATE content SET data = ?, updated_at = ? WHERE id = 1', [$json, $maintenant]);
    } else {
        ajmi_q('INSERT INTO content (id, data, updated_at) VALUES (1, ?, ?)', [$json, $maintenant]);
    }
    ajmi_q('INSERT INTO history (data, author, created_at) VALUES (?, ?, ?)', [$json, $auteur, $maintenant]);
    // Ne conserve que les 20 dernières versions (syntaxe valable en SQLite et MySQL).
    ajmi_q(
        'DELETE FROM history WHERE id NOT IN (SELECT id FROM (SELECT id FROM history ORDER BY id DESC LIMIT 20) AS recent)'
    );
}

function ajmi_historique(): array
{
    return ajmi_toutes('SELECT id, author, created_at FROM history ORDER BY id DESC');
}

function ajmi_version(int $id): ?array
{
    $ligne = ajmi_une('SELECT data FROM history WHERE id = ?', [$id]);
    if (!$ligne) {
        return null;
    }
    $decode = json_decode($ligne['data'], true);
    return is_array($decode) ? $decode : null;
}

/* -------------------------------- Messages -------------------------------- */

function ajmi_message_ajouter(array $m, string $ip): void
{
    ajmi_q(
        'INSERT INTO messages (nom, email, telephone, competence, message, lu, ip, created_at) VALUES (?,?,?,?,?,0,?,?)',
        [$m['nom'], $m['email'], $m['telephone'], $m['competence'], $m['message'], $ip, ajmi_now()]
    );
}

function ajmi_messages(): array
{
    $lignes = ajmi_toutes('SELECT * FROM messages ORDER BY created_at DESC, id DESC');
    foreach ($lignes as &$ligne) {
        $ligne['lu'] = (bool) $ligne['lu'];
        $ligne['id'] = (int) $ligne['id'];
    }
    return $lignes;
}

function ajmi_message_lu(int $id, bool $lu): void
{
    ajmi_q('UPDATE messages SET lu = ? WHERE id = ?', [$lu ? 1 : 0, $id]);
}

function ajmi_message_supprimer(int $id): void
{
    ajmi_q('DELETE FROM messages WHERE id = ?', [$id]);
}

/* ---------------------------------- Médias -------------------------------- */

function ajmi_media_ajouter(string $nom, int $taille): void
{
    $existant = ajmi_une('SELECT id FROM media WHERE name = ?', [$nom]);
    if ($existant) {
        ajmi_q('UPDATE media SET taille = ? WHERE id = ?', [$taille, $existant['id']]);
        return;
    }
    ajmi_q('INSERT INTO media (name, taille, created_at) VALUES (?, ?, ?)', [$nom, $taille, ajmi_now()]);
}

function ajmi_media_tous(): array
{
    return ajmi_toutes('SELECT * FROM media ORDER BY created_at DESC, id DESC');
}

function ajmi_media_supprimer(string $nom): void
{
    ajmi_q('DELETE FROM media WHERE name = ?', [$nom]);
}

/* ------------------------------ Réservations ------------------------------ */

function ajmi_reservation_ajouter(array $r): void
{
    ajmi_q(
        'INSERT INTO reservations
           (id, code_norm, created_at, publication_id, publication_title, nom, telephone, email, adresse, quantite, remarques, statut, ip)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
            $r['id'], $r['code_norm'], $r['created_at'], $r['publication_id'], $r['publication_title'],
            $r['nom'], $r['telephone'], $r['email'], $r['adresse'], $r['quantite'],
            $r['remarques'], $r['statut'], $r['ip'],
        ]
    );
}

function ajmi_reservations(): array
{
    return ajmi_toutes(
        'SELECT id, code_norm, created_at, publication_id, publication_title, nom, telephone,
                email, adresse, quantite, remarques, statut
           FROM reservations ORDER BY created_at DESC'
    );
}

function ajmi_reservation_par_code(string $codeNormalise): ?array
{
    return ajmi_une('SELECT * FROM reservations WHERE code_norm = ? LIMIT 1', [$codeNormalise]);
}

function ajmi_reservation_par_code_partiel(string $codeNormalise): ?array
{
    return ajmi_une(
        'SELECT * FROM reservations WHERE code_norm LIKE ? ORDER BY created_at DESC LIMIT 1',
        ['%' . $codeNormalise . '%']
    );
}

function ajmi_reservation_statut(string $id, string $statut): void
{
    ajmi_q('UPDATE reservations SET statut = ? WHERE id = ?', [$statut, $id]);
}

function ajmi_reservation_supprimer(string $id): void
{
    ajmi_q('DELETE FROM reservations WHERE id = ?', [$id]);
}

/* ------------------------------ Statistiques ------------------------------ */

function ajmi_stats(): array
{
    $contenu = ajmi_une('SELECT updated_at FROM content WHERE id = 1');
    return [
        'messages'              => (int) ajmi_valeur('SELECT count(*) FROM messages'),
        'nonLus'                => (int) ajmi_valeur('SELECT count(*) FROM messages WHERE lu = 0'),
        'medias'                => (int) ajmi_valeur('SELECT count(*) FROM media'),
        'versions'              => (int) ajmi_valeur('SELECT count(*) FROM history'),
        'reservations'          => (int) ajmi_valeur('SELECT count(*) FROM reservations'),
        'reservationsEnAttente' => (int) ajmi_valeur("SELECT count(*) FROM reservations WHERE statut = 'en_attente'"),
        'derniereMaj'           => $contenu['updated_at'] ?? null,
    ];
}

/* -------------------------------- Installation ---------------------------- */

/** Crée les tables à partir du schéma du dossier schema/. */
function ajmi_installer_schema(PDO $pdo, string $driver): void
{
    $fichier = __DIR__ . '/schema/' . ($driver === 'mysql' ? 'mysql.sql' : 'sqlite.sql');
    $sql = file_get_contents($fichier);
    if ($sql === false) {
        throw new RuntimeException('Schéma introuvable : ' . $fichier);
    }
    // Découpage sur les points-virgules en fin de ligne, commentaires retirés.
    $lignes = preg_split('/\R/', $sql) ?: [];
    $instruction = '';
    foreach ($lignes as $ligne) {
        $propre = trim($ligne);
        if ($propre === '' || str_starts_with($propre, '--')) {
            continue;
        }
        $instruction .= $ligne . "\n";
        if (str_ends_with($propre, ';')) {
            $pdo->exec($instruction);
            $instruction = '';
        }
    }
}
