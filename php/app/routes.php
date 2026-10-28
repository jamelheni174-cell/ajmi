<?php
declare(strict_types=1);
/**
 * Routes de l'API — équivalent de worker/index.js.
 */

function ajmi_router(string $methode, string $chemin): void
{
    $ip = ajmi_ip();

    // Garde-fou général : 120 requêtes par minute et par adresse.
    if (!ajmi_rate("ip:$ip", 120)) {
        ajmi_json(['error' => 'Trop de requêtes, réessayez dans une minute.'], 429);
    }

    /* --------------------------------- Santé -------------------------------- */
    if ($chemin === '/health') {
        ajmi_json(['ok' => true, 'version' => 1]);
    }

    /* -------------------------------- Connexion ----------------------------- */
    if ($chemin === '/login' && $methode === 'POST') {
        $cle = "login:$ip";
        if (!ajmi_rate($cle, 8, 300, false)) {
            ajmi_json(['error' => 'Trop de tentatives. Réessayez dans 5 minutes.'], 429);
        }

        $corps = ajmi_body(4096);
        $email = (string) ($corps['email'] ?? '');
        $motdepasse = (string) ($corps['password'] ?? '');
        $user = $email !== '' ? ajmi_user_par_email($email) : null;

        if (!$user || !ajmi_verifie_mot_de_passe($motdepasse, $user['password'])) {
            ajmi_rate($cle, 8, 300); // seuls les échecs consomment le quota
            ajmi_json(['error' => 'Identifiants incorrects.'], 401);
        }

        if (ajmi_mot_de_passe_a_racheter($user['password'])) {
            ajmi_user_mot_de_passe((int) $user['id'], ajmi_hash_mot_de_passe($motdepasse));
        }

        $token = ajmi_token_creer(
            ['sub' => $user['email'], 'nom' => $user['nom']],
            AJMI_CONFIG['jwt_secret'],
            (int) AJMI_CONFIG['jwt_days']
        );
        ajmi_json(['token' => $token, 'user' => ['email' => $user['email'], 'nom' => $user['nom']]]);
    }

    /* --------------------------------- Profil -------------------------------- */
    if ($chemin === '/me') {
        $moi = ajmi_utilisateur_courant();
        if (!$moi) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }
        ajmi_json(['user' => ['email' => $moi['sub'], 'nom' => $moi['nom']]]);
    }

    if ($chemin === '/password' && $methode === 'POST') {
        $moi = ajmi_utilisateur_courant();
        if (!$moi) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }

        $corps = ajmi_body(4096);
        $ancien = (string) ($corps['ancien'] ?? '');
        $nouveau = (string) ($corps['nouveau'] ?? '');

        if (ajmi_longueur($nouveau) < 8) {
            ajmi_json(['error' => '8 caractères minimum.'], 400);
        }

        $user = ajmi_user_par_email((string) $moi['sub']);
        if (!$user || !ajmi_verifie_mot_de_passe($ancien, $user['password'])) {
            ajmi_json(['error' => 'Ancien mot de passe incorrect.'], 400);
        }

        ajmi_user_mot_de_passe((int) $user['id'], ajmi_hash_mot_de_passe($nouveau));
        ajmi_json(['ok' => true]);
    }

    /* --------------------------------- Contenu ------------------------------- */
    if ($chemin === '/content') {
        if ($methode === 'GET') {
            ajmi_json(ajmi_contenu());
        }
        if ($methode === 'PUT') {
            $moi = ajmi_utilisateur_courant();
            if (!$moi) {
                ajmi_json(['error' => 'Non authentifié'], 401);
            }
            ajmi_contenu_enregistrer(ajmi_body(4194304), (string) $moi['sub']);
            ajmi_json(['ok' => true]);
        }
    }

    if ($chemin === '/history' && $methode === 'GET') {
        if (!ajmi_utilisateur_courant()) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }
        $sortie = [];
        foreach (ajmi_historique() as $ligne) {
            $sortie[] = ['i' => (int) $ligne['id'], 'at' => $ligne['created_at'], 'par' => $ligne['author']];
        }
        ajmi_json($sortie);
    }

    if (preg_match('#^/history/(\d+)$#', $chemin, $m) && $methode === 'GET') {
        if (!ajmi_utilisateur_courant()) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }
        $version = ajmi_version((int) $m[1]);
        if (!$version) {
            ajmi_json(['error' => 'Version introuvable'], 404);
        }
        ajmi_json($version);
    }

    /* ------------------------------ Tableau de bord -------------------------- */
    if ($chemin === '/stats' && $methode === 'GET') {
        if (!ajmi_utilisateur_courant()) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }
        ajmi_json(ajmi_stats());
    }

    if ($chemin === '/export' && $methode === 'GET') {
        if (!ajmi_utilisateur_courant()) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }
        ajmi_json([
            'content'      => ajmi_contenu(),
            'messages'     => ajmi_messages(),
            'reservations' => ajmi_reservations(),
            'stats'        => ajmi_stats(),
        ]);
    }

    /* -------------------------------- Messages ------------------------------- */
    if ($chemin === '/messages') {
        if ($methode === 'POST') {
            if (!ajmi_rate("msg:$ip", 5, 600)) {
                ajmi_json(['error' => "Trop d'envois. Réessayez plus tard."], 429);
            }
            $m = ajmi_body(65536);
            if (empty($m['nom']) || empty($m['email']) || empty($m['message'])) {
                ajmi_json(['error' => 'Champs obligatoires manquants.'], 400);
            }
            if (!empty($m['piege'])) {
                ajmi_json(['ok' => true]); // pot de miel anti-robot
            }
            ajmi_message_ajouter([
                'nom'        => ajmi_texte($m['nom'], 120),
                'email'      => ajmi_texte($m['email'], 160),
                'telephone'  => ajmi_texte($m['telephone'] ?? '', 60),
                'competence' => ajmi_texte($m['competence'] ?? '', 120),
                'message'    => ajmi_texte($m['message'], 5000),
            ], $ip);
            ajmi_json(['ok' => true], 201);
        }
        if ($methode === 'GET') {
            if (!ajmi_utilisateur_courant()) {
                ajmi_json(['error' => 'Non authentifié'], 401);
            }
            ajmi_json(ajmi_messages());
        }
    }

    if (preg_match('#^/messages/(\d+)$#', $chemin, $m)) {
        if (!ajmi_utilisateur_courant()) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }
        $id = (int) $m[1];
        if ($methode === 'PUT') {
            $corps = ajmi_body(4096);
            ajmi_message_lu($id, !empty($corps['lu']));
            ajmi_json(['ok' => true]);
        }
        if ($methode === 'DELETE') {
            ajmi_message_supprimer($id);
            ajmi_json(['ok' => true]);
        }
    }

    /* --------------------------------- Médias -------------------------------- */
    if ($chemin === '/media') {
        if ($methode === 'GET') {
            $sortie = [];
            foreach (ajmi_media_tous() as $ligne) {
                $sortie[] = [
                    'name'   => $ligne['name'],
                    'url'    => '/uploads/' . $ligne['name'],
                    'taille' => (int) $ligne['taille'],
                ];
            }
            ajmi_json($sortie);
        }
        if ($methode === 'POST') {
            if (!ajmi_utilisateur_courant()) {
                ajmi_json(['error' => 'Non authentifié'], 401);
            }
            $corps = ajmi_body((int) AJMI_CONFIG['max_upload'] * 2 + 65536);
            $donnees = (string) ($corps['dataUrl'] ?? '');

            if (!preg_match('#^data:(image/(?:jpeg|png|webp));base64,(.+)$#s', $donnees, $m)) {
                ajmi_json(['error' => "Format d'image non supporté."], 400);
            }
            $binaire = base64_decode($m[2], true);
            if ($binaire === false) {
                ajmi_json(['error' => "Image illisible."], 400);
            }
            if (strlen($binaire) > (int) AJMI_CONFIG['max_upload']) {
                ajmi_json(['error' => 'Fichier trop volumineux (6 Mo max).'], 413);
            }

            $extensions = ['image/jpeg' => '.jpg', 'image/png' => '.png', 'image/webp' => '.webp'];
            $extension = $extensions[$m[1]];
            $nom = ajmi_nom_fichier((string) ($corps['name'] ?? 'image'), $extension);
            $destination = rtrim(AJMI_CONFIG['upload_dir'], '/') . '/' . $nom;

            if (@file_put_contents($destination, $binaire) === false) {
                ajmi_json(['error' => 'Écriture impossible : vérifiez les droits du dossier uploads/.'], 500);
            }
            @chmod($destination, 0644);

            ajmi_media_ajouter($nom, strlen($binaire));
            ajmi_json(['name' => $nom, 'url' => '/uploads/' . $nom], 201);
        }
    }

    if (preg_match('#^/media/(.+)$#', $chemin, $m) && $methode === 'DELETE') {
        if (!ajmi_utilisateur_courant()) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }
        $nom = basename(urldecode($m[1]));
        $fichier = rtrim(AJMI_CONFIG['upload_dir'], '/') . '/' . $nom;
        if (is_file($fichier)) {
            @unlink($fichier);
        }
        ajmi_media_supprimer($nom);
        ajmi_json(['ok' => true]);
    }

    /* ------------------------------ Réservations ----------------------------- */
    if ($chemin === '/reservations') {
        if ($methode === 'GET') {
            if (!ajmi_utilisateur_courant()) {
                ajmi_json(['error' => 'Non authentifié'], 401);
            }
            ajmi_json(ajmi_reservations());
        }
        if ($methode === 'POST') {
            if (!ajmi_rate("res:$ip", 8, 600)) {
                ajmi_json(['error' => 'Trop de demandes. Réessayez plus tard.'], 429);
            }
            $r = ajmi_body(32768);
            if (empty($r['nom']) || empty($r['publication_title'])) {
                ajmi_json(['error' => 'Champs obligatoires manquants.'], 400);
            }

            $id = ajmi_nouveau_code();
            $reservation = [
                'id'                => $id,
                'code_norm'         => ajmi_code_normalise($id),
                'created_at'        => date('c'),
                'publication_id'    => ajmi_texte($r['publication_id'] ?? '', 120),
                'publication_title' => ajmi_texte($r['publication_title'], 240),
                'nom'               => ajmi_texte($r['nom'], 120),
                'telephone'         => ajmi_texte($r['telephone'] ?? '', 60),
                'email'             => ajmi_texte($r['email'] ?? '', 160),
                'adresse'           => ajmi_texte($r['adresse'] ?? '', 300),
                'quantite'          => ajmi_int($r['quantite'] ?? 1, 1, 99),
                'remarques'         => ajmi_texte($r['remarques'] ?? '', 1000),
                'statut'            => 'en_attente',
                'ip'                => $ip,
            ];
            ajmi_reservation_ajouter($reservation);

            unset($reservation['code_norm'], $reservation['ip']);
            ajmi_json($reservation, 201);
        }
    }

    // Suivi public : une seule fiche, celle du code saisi.
    if (preg_match('#^/reservations/track/(.+)$#', $chemin, $m) && $methode === 'GET') {
        if (!ajmi_rate("track:$ip", 30, 60)) {
            ajmi_json(['error' => 'Trop de recherches, patientez une minute.'], 429);
        }
        $saisie = urldecode($m[1]);
        $variantes = ajmi_code_variantes($saisie);
        if (!$variantes) {
            ajmi_json(['error' => 'Code manquant.'], 400);
        }

        $trouvee = null;
        foreach ($variantes as $code) {
            $trouvee = ajmi_reservation_par_code($code);
            if ($trouvee) {
                break;
            }
        }
        if (!$trouvee) {
            foreach ($variantes as $code) {
                $trouvee = ajmi_reservation_par_code_partiel($code);
                if ($trouvee) {
                    break;
                }
            }
        }
        if (!$trouvee) {
            ajmi_json(['error' => 'Réservation introuvable.'], 404);
        }
        ajmi_json([
            'id'                => $trouvee['id'],
            'created_at'        => $trouvee['created_at'],
            'publication_id'    => $trouvee['publication_id'],
            'publication_title' => $trouvee['publication_title'],
            'nom'               => $trouvee['nom'],
            'telephone'         => $trouvee['telephone'],
            'adresse'           => $trouvee['adresse'],
            'quantite'          => (int) $trouvee['quantite'],
            'remarques'         => $trouvee['remarques'],
            'statut'            => $trouvee['statut'],
        ]);
    }

    if (preg_match('#^/reservations/(.+)$#', $chemin, $m)) {
        if (!ajmi_utilisateur_courant()) {
            ajmi_json(['error' => 'Non authentifié'], 401);
        }
        $id = urldecode($m[1]);

        if ($methode === 'PUT') {
            $corps = ajmi_body(4096);
            $statut = (string) ($corps['statut'] ?? '');
            if (!in_array($statut, ['en_attente', 'confirmee', 'livree', 'annulee'], true)) {
                ajmi_json(['error' => 'Statut inconnu.'], 400);
            }
            ajmi_reservation_statut($id, $statut);
            ajmi_json(['ok' => true]);
        }
        if ($methode === 'DELETE') {
            ajmi_reservation_supprimer($id);
            ajmi_json(['ok' => true]);
        }
    }

    ajmi_json(['error' => 'Route inconnue'], 404);
}

/** Référence de réservation : RÉSER-#A1B2C3 */
function ajmi_nouveau_code(): string
{
    return 'RÉSER-#' . strtoupper(bin2hex(random_bytes(3)));
}
