# Cabinet Ajmi — version PHP (hébergement mutualisé)

Même site, même administration, mais **sans Cloudflare et sans Node.js** :
tout tient dans un dossier que l'on dépose sur n'importe quel hébergement PHP
(cPanel, Plesk, Hostinger, OVH, InfinityFree…), y compris les offres les moins
chères.

| | Version Cloudflare | **Version PHP** |
|---|---|---|
| Hébergement | Cloudflare Workers (compte à créer) | n'importe quel hébergement PHP |
| Installation | `npm install`, `wrangler login`, `npm run cf:setup` | envoyer les fichiers par FTP, ouvrir `install.php` |
| Base de données | D1 (SQLite managé) | SQLite (fichier) ou MySQL |
| Images | R2 | dossier `uploads/` |
| Coût | 0 € | selon l'hébergeur (souvent 0 à 3 €/mois) |
| Hachage des mots de passe | PBKDF2 25 000 (limite CPU impose) | bcrypt / argon2id, pleine force |

Le site web lui-même est identique : c'est le même code React compilé
(`index.html` + `images/`), servi comme fichiers statiques. Seule la partie
serveur (API, administration, base, images) a été réécrite en PHP.

---

## 1. Ce qu'il faut

- Un hébergement avec **PHP 8.0 ou plus** (Apache de préférence, pour le
  `.htaccess`) ;
- l'extension **PDO SQLite** *ou* **PDO MySQL** (les deux sont presque toujours
  proposées) ;
- environ 25 Mo d'espace disque ;
- un accès FTP, ou le gestionnaire de fichiers du panneau d'administration.

L'idéal : un sous-domaine dédié (`cabinet-ajmi.tn` ou `ajmi.exemple.tn`) dont
le dossier racine pointe sur le dossier installé.

> **Sous-dossier.** Le site est prévu pour être à la racine d'un domaine ou
> d'un sous-domaine. Dans un sous-dossier (`exemple.tn/ajmi/`), les chemins
> absolus `/images/…` ne se résolvent pas : préférez un sous-domaine.

---

## 2. Installation (10 minutes)

### 2.1 Transférer les fichiers

Par FTP (FileZilla…), envoyez **le contenu** du dossier `php/` à la racine de
l'hébergement (`public_html/`, `www/`, `httpdocs/` selon l'hébergeur) :

```
index.html          ← le site
images/             ← les photos du site
api/index.php       ← l'API
app/                ← le code serveur (protégé)
uploads/            ← les images téléversées depuis l'administration
install.php         ← assistant d'installation (à supprimer ensuite)
check.php           ← diagnostic (à supprimer ensuite)
.htaccess           ← routage /api et sécurité
```

Activez l'affichage des fichiers cachés dans votre client FTP : `.htaccess`
est indispensable au fonctionnement de l'API.

### 2.2 Vérifier les droits

Les dossiers doivent être accessibles en écriture par PHP :

```
uploads/     → 755 (ou 775 chez certains hébergeurs)
app/         → 755, le temps de l'installation (config.php y sera créé)
```

En cas de doute, demandez 755 et, si l'installation signale un problème de
droits, passez à 775.

### 2.3 Ouvrir l'assistant

Dans le navigateur : `https://votre-domaine.tn/install.php`

1. Les vérifications du serveur s'affichent (vert = bon).
2. Choisissez la base :
   - **SQLite** — recommandé, rien à configurer, un simple fichier.
   - **MySQL** — si votre hébergeur ne propose pas SQLite, ou si vous préférez
     la base fournie avec votre offre. Les identifiants se trouvent dans
     cPanel → *Bases de données MySQL*.
3. Saisissez le nom, l'email et le mot de passe de l'administrateur
   (8 caractères minimum).
4. Cliquez sur **Installer le site**.

### 2.4 Supprimer les fichiers d'installation

Une fois le message vert affiché, supprimez `install.php` et `check.php`.
Ils ne sont plus utiles et leur présence serait une faille.

### 2.5 Se connecter

- Site : `https://votre-domaine.tn/`
- Administration : `https://votre-domaine.tn/#/admin`

Le bandeau de l'administration doit indiquer **Backend connecté**.

### 2.6 Activer HTTPS

La plupart des hébergeurs proposent un certificat gratuit (Let's Encrypt) en un
clic dans le panneau. Activez-le, puis forcez la redirection HTTPS depuis le
panneau de l'hébergeur (ou ajoutez ces lignes à la fin du `.htaccess` une fois
le certificat en place) :

```apache
<IfModule mod_rewrite.c>
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

---

## 3. Vérifier que tout va bien

`https://votre-domaine.tn/check.php` teste : version de PHP, extensions, dossiers
inscriptibles, tables, compte administrateur, signature des jetons, écriture en
base, écriture dans `uploads/`. Tout doit être vert. Supprimez ensuite le fichier.

Si l'API répond mais que la page reste vide : ouvrez
`https://votre-domaine.tn/api/health` — la réponse doit être `{"ok":true,"version":1}`.

---

## 4. Mettre à jour le site

Le contenu (textes, images de présentation, ouvrages) se modifie **depuis
l'administration**, sans toucher aux fichiers.

Pour livrer une nouvelle version du site :

```bash
npm run build                    # à la racine du projet (machine de développement)
node php/tools/sync.mjs          # recopie le site compilé dans php/
```

Envoyez ensuite `index.html` et le dossier `images/` par FTP. La base de
données et les images téléversées ne sont pas concernées.

---

## 5. Sauvegardes

**SQLite** : téléchargez le fichier `ajmi.sqlite` situé dans le dossier
`ajmi-data/` (créé au-dessus du dossier public) ou, s'il n'a pas pu y être créé,
dans `ajmi-data/` à l'intérieur du site. Copiez également le dossier
`uploads/`. Ces deux éléments constituent la sauvegarde complète.

**MySQL** : exportez la base depuis phpMyAdmin (cPanel → phpMyAdmin →
*Exporter*), et copiez `uploads/`.

Une sauvegarde hebdomadaire suffit pour un site de ce volume.

---

## 6. Dépannage

**« Le site n'est pas encore installé »** — `app/config.php` est absent :
ouvrez `/install.php`.

**L'API renvoie 404** — le `.htaccess` n'est pas pris en compte : vérifiez que
le fichier a bien été transféré (fichiers cachés), et que l'hébergeur autorise
`mod_rewrite`. Certains panneaux demandent de l'activer.

**Les images téléversées ne s'affichent pas** — droits du dossier `uploads/` :
755 ou 775. Vérifiez aussi que le dossier contient bien son `.htaccess`.

**« Fichier trop volumineux »** — la limite de PHP (`post_max_size`) est plus
basse que la taille de l'image. Créez un fichier `.user.ini` à la racine avec :

```
post_max_size = 16M
upload_max_filesize = 16M
memory_limit = 128M
```

**Mot de passe administrateur oublié** — créez temporairement un fichier
`reset.php` à la racine, ouvrez-le, puis supprimez-le immédiatement :

```php
<?php
define('AJMI', true);
require __DIR__ . '/app/helpers.php';
$config = require __DIR__ . '/app/config.php';
define('AJMI_CONFIG', $config);
require __DIR__ . '/app/auth.php';
require __DIR__ . '/app/db.php';
$nouveau = 'MotDePasseProvisoire2026';      // à changer après connexion
ajmi_user_creer('Administrateur', 'VOTRE-EMAIL@exemple.tn', ajmi_hash_mot_de_passe($nouveau));
echo 'Mot de passe réinitialisé.';
```

**Erreur 500 sans message** — consultez les journaux d'erreurs de l'hébergeur
(cPanel → *Journaux*). L'API écrit ses erreurs dans le journal PHP.

---

## 7. Vérifier le code soi-même (facultatif)

Deux suites de tests exécutent réellement le code avec PHP 8.3 :

```bash
npm i --no-save @php-wasm/node @php-wasm/universal
node php/tools/test-api.mjs
```

```
  ✓ API : 59/59
  ✓ Installation : 14/14
  73/73 vérifications réussies
```

Elles couvrent les 20 routes (codes de retour, jetons falsifiés, droits,
accents, images, réservations), ainsi que `install.php` de bout en bout.
Rien n'est ajouté au `package.json` : l'installation est ponctuelle, et
`--no-save` évite de modifier le projet.

Sur une machine disposant de PHP en ligne de commande, le plus simple reste :

```bash
php -S localhost:8080 -t php/
```

puis ouvrez `http://localhost:8080/install.php`.

---

## 8. Ce que contient le code

```
php/
├── index.html            site React compilé (généré par « npm run build »)
├── images/               photos du site
├── uploads/              images téléversées (vide au départ)
├── install.php           assistant d'installation
├── check.php             diagnostic
├── .htaccess             routage /api, repli SPA, sécurité, cache
├── api/index.php         contrôleur unique de l'API
├── app/
│   ├── bootstrap.php     amorçage, configuration, dossiers
│   ├── helpers.php       réponses JSON, corps de requête, anti-abus, nettoyage
│   ├── auth.php          mots de passe (password_hash), jetons JWT HS256
│   ├── db.php            accès PDO (SQLite/MySQL), toutes les requêtes
│   ├── routes.php        les 20 routes de l'API
│   ├── config.sample.php exemple de configuration
│   └── schema/           sqlite.sql · mysql.sql
└── tools/
    ├── sync.mjs          recopie dist/ → php/
    └── test-api.mjs      73 vérifications avec un vrai PHP
```

L'API expose exactement les mêmes routes que la version Cloudflare
(`README.md` à la racine, section 7) : le site React n'a pas été modifié pour
fonctionner ici.

### Différences assumées avec la version Cloudflare

- **Mots de passe plus robustes** : `password_hash()` (argon2id ou bcrypt)
  au lieu de PBKDF2 tronqué pour tenir dans les 10 ms de CPU du plan gratuit.
- **Limitation de débit par fichier** au lieu de la mémoire de l'instance :
  persiste d'une requête à l'autre, y compris sur un hébergement mutualisé.
- **Images servies par le serveur web** (Apache) plutôt que depuis R2.
- Pas de prévisualisation de branches, pas de CDN mondial : c'est le prix
  d'un hébergement mutualisé.
