# InfinityFree — Mise à jour SEO complète (04/11/2026)

Ce ZIP contient la version PHP avec **SEO complet** + **routing propre (sans #)** + fix réservations.

## Fichiers
- `ajmi-infinityfree-htdocs.zip` → **à dézipper directement dans `htdocs/`** (recommandé)
- `ajmi-infinityfree.zip` → même contenu avec dossier parent

Contenu : `index.html` (compilé SEO), `images/`, `robots.txt`, `sitemap.xml`, `sitemap.php`, `.htaccess`, `api/`, `app/`, `uploads/`, `check.php`, `install.php`, `README.md`

Empreinte : `98cd4b1419b0` — taille `443076` — 04/11/2026

### Nouveautés SEO 04/11
- **URLs propres** sans `#` : `/services`, `/competences`, `/actualites`, `/publication/ouvrage-2026` (ancien `/#/services` redirigé automatiquement)
- **robots.txt** + **sitemap.xml** (13 URLs) + **sitemap.php** dynamique
- **Meta SEO** par page : title, description, canonical, OG (Facebook/LinkedIn), Twitter Card
- **JSON-LD** : LegalService (Monastir), Book (ouvrage 2026 avec ISBN), Breadcrumb
- **Performance** : cache 1 an sur images, `no-cache` sur `index.html`

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

## Vérification SEO (3 minutes)

1. `https://ton-domaine.rf.gd/robots.txt` → doit afficher `Sitemap: https://cabinetmaitreajmi.tn/sitemap.xml`
2. `https://ton-domaine.rf.gd/sitemap.xml` → 13 URLs (dont `/publication/ouvrage-2026`)
3. `https://ton-domaine.rf.gd/api/health` → `{"ok":true,"version":1}`
4. Ouvre `https://ton-domaine.rf.gd/services` (sans #) → doit afficher Domaines
5. Partage `https://ton-domaine.rf.gd/publication/ouvrage-2026` sur WhatsApp → doit montrer couverture + titre (test OG)
6. Google Search Console → Soumettre `sitemap.xml` → Demander indexation

### Réservations
Teste une réservation **en navigation privée** → vérifie dans `/admin` → **Réservations** : elle doit apparaître.
La modale affiche le vrai message d'erreur serveur (pas de faux succès local).
Anciens liens `/#/services` restent valides (redirection auto vers `/services`).

Supprime `install.php` et `check.php` après test (File Manager → Delete).

## Si ça ne passe toujours pas
Copie le message d'erreur exact de la modale + vérifie : `uploads/` en 755, `.htaccess` présent, pas d'ad blocker.
Le fix réservations : détection `aes.js` + retry `form-urlencoded` côté back (accepte les 2 formats).
