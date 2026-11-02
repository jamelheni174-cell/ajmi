# InfinityFree — Mise à jour Réservations (fix du 02/11/2026)

Ce ZIP contient la version PHP corrigée (réservations qui ne passaient pas).

## Fichiers
- `ajmi-infinityfree-htdocs.zip` → **à dézipper directement dans `htdocs/`** (recommandé)
- `ajmi-infinityfree.zip` → même contenu avec dossier parent

Contenu : `index.html` (compilé), `images/`, `.htaccess`, `api/`, `app/`, `uploads/`, `check.php`, `install.php`, `README.md`
Empreinte : `aa2809ccc25d` — taille `434479`

---

## Installation sans FTP (File Manager InfinityFree)

1. Va sur https://app.infinityfree.net → ton site → **File Manager**
2. Ouvre `htdocs/` (ou `htdocs/ton-domaine` si domaine add-on)
3. **Upload** → choisis `ajmi-infinityfree-htdocs.zip`
4. Clic droit sur le ZIP → **Extract / Extraire** → destination `htdocs/` → **Replace / Remplacer tout**
5. Vérifie que `.htaccess` est visible (Settings → coche "Show hidden files" si besoin)

### Option FTP (FileZilla)
- Hôte : `ftpupload.net` (voir cPanel → FTP Details)
- User : `epiz_XXXXXX`
- Port : 21
- Glisse tout le contenu de `ajmi-infinityfree/` vers `htdocs/` et écrase.

---

## Vérification (2 minutes)

1. Ouvre `https://ton-domaine.rf.gd/install.php` → doit afficher **"Déjà installé"** (ne réinstalle pas, juste pour vérifier)
2. Ouvre `https://ton-domaine.rf.gd/check.php` → **tout doit être vert**, surtout "Écriture et lecture en base"
3. Ouvre `https://ton-domaine.rf.gd/api/health` → doit afficher `{"ok":true,"version":1}`
4. Teste une réservation **en navigation privée** → vérifie dans `/#/admin` → **Réservations** : elle doit apparaître
5. Supprime `install.php` et `check.php` après test (File Manager → Delete)

## Si ça ne passe toujours pas
La modale affiche maintenant le **vrai message d'erreur serveur** (au lieu de l'ancien faux succès local). Copie ce message.
Vérifie aussi : `uploads/` en 755, `.htaccess` bien présent, pas de `ad blocker`.

Le fix : le front détecte la page HTML `aes.js` d'InfinityFree et retente en `form-urlencoded` quand `application/json` est bloqué. Le back accepte les 2 formats.
