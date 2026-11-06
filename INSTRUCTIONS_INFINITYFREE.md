# InfinityFree — Mise à jour SEO complète (04/11/2026)

Ce ZIP contient la version PHP avec **SEO complet** + **routing propre (sans #)** + fix réservations.

## Fichiers
- `ajmi-infinityfree-htdocs.zip` → **à dézipper directement dans `htdocs/`** (recommandé)
- `ajmi-infinityfree.zip` → même contenu avec dossier parent

Contenu : `index.html` (compilé SEO), `images/`, `robots.txt`, `sitemap.xml`, `sitemap.php`, `.htaccess`, `api/`, `app/`, `uploads/`, `check.php`, `install.php`, `README.md`

Empreinte : `f122f5e8dea6` — taille `443948` — 05/11/2026

### Nouveautés SEO 04-05/11
- **URLs propres** sans `#` : `/services`, `/competences`, `/actualites`, `/publication/ouvrage-2026` (ancien `/#/services` redirigé auto)
- **robots.txt** + **sitemap.xml** (13 URLs) + **sitemap.php** dynamique
- **Meta SEO** par page : title, description, canonical, OG (Facebook/LinkedIn), Twitter Card
- **OG Image 1200×630** : `images/og-image.jpg` avec titre et contact pour la page d’accueil
- **JSON-LD** : LegalService (Monastir), Book (ouvrage 2026 avec ISBN), Breadcrumb
- **Performance** : cache 1 an sur images, `no-cache` sur `index.html`

> **Aperçu social :** les balises de la page d’accueil sont dans le HTML initial. Leur affichage dépend aussi de l’accès des robots à la page et à l’image. Le défi de sécurité InfinityFree peut les bloquer ; Cloudflare seul ne garantit pas de contourner ce problème. Les pages internes utilisent le même HTML initial : leurs balises spécifiques sont mises à jour en JavaScript et ne sont donc pas garanties pour les robots sociaux.

---

## Installation sans FTP (File Manager InfinityFree)

1. Va sur https://app.infinityfree.net → ton site → **File Manager**
2. Ouvre `htdocs/` (ou `htdocs/ton-domaine` si domaine add-on)
3. **Upload** → choisis `ajmi-infinityfree-htdocs.zip`
4. Sauvegarde d’abord les fichiers et données du site. Extrais le ZIP dans `htdocs/` et remplace les fichiers du site, sans effacer `app/config.php`, `ajmi-data/`, la base de données ni les fichiers existants dans `uploads/`.
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
5. Teste `https://cabinetmaitreajmi.tn/` avec Facebook Sharing Debugger ; vérifie que le robot reçoit le HTML et l’image, puis utilise « Scrape Again ». Les pages internes ne disposent pas encore de balises spécifiques dans le HTML initial.
6. Google Search Console → Soumettre `sitemap.xml` → Demander indexation

### Réservations
Teste une réservation **en navigation privée** → vérifie dans `/admin` → **Réservations** : elle doit apparaître.
La modale affiche le vrai message d'erreur serveur (pas de faux succès local).
Anciens liens `/#/services` restent valides (redirection auto vers `/services`).

Supprime `install.php` et `check.php` après test (File Manager → Delete).

## Si ça ne passe toujours pas
Copie le message d'erreur exact de la modale + vérifie : `uploads/` en 755, `.htaccess` présent, pas d'ad blocker.
Le fix réservations : détection `aes.js` + retry `form-urlencoded` côté back (accepte les 2 formats).
