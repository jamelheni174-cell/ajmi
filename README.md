# Cabinet d'Avocat Me Mohamed Anouar Ajmi

Site du cabinet (React + Vite + Tailwind), espace d'administration, base de données,
messages du formulaire, réservations d'ouvrages et téléversement d'images.

**Hébergement recommandé : Cloudflare Workers** — le site, l'API, la base de données
et les images sur un seul tableau de bord, gratuitement, sans mise en veille et sans
carte bancaire. Le plan gratuit de Cloudflare autorise un usage commercial
(contrairement à celui de Vercel, réservé aux projets personnels).

---

## 1. Déploiement Cloudflare — pas à pas

**Avant de commencer :** Node.js **22 ou plus** (`node -v`) et un compte Cloudflare
gratuit (aucune carte bancaire demandée).

### 1.1 Récupérer le code

```bash
git clone https://github.com/jamelheni174-cell/ajmi.git
cd ajmi
git checkout main && git pull
```

### 1.2 Installer les dépendances

```bash
npm install
```

### 1.3 Se connecter à Cloudflare (une seule fois)

```bash
npx wrangler login
```

Le navigateur s'ouvre : autorisez Wrangler. Vérification possible avec
`npx wrangler whoami`.

### 1.4 Lancer l'installation

```bash
npm run cf:setup
```

La commande enchaîne, et s'arrête avec un message clair au premier problème :

| Étape | Ce qui se passe |
|---|---|
| Base D1 | crée `cabinet-ajmi` et écrit son identifiant dans `wrangler.jsonc` |
| Stockage R2 | crée `cabinet-ajmi-media` (sert les images du site) |
| Schéma SQL | crée les tables `users, content, history, messages, media, reservations` |
| Secret | génère `JWT_SECRET` (il part avec le premier déploiement) |
| Administrateur | demande **nom**, **email**, **mot de passe** (8 caractères min.) |
| Déploiement | construit `dist/` puis publie le Worker |

> **Premier déploiement :** Cloudflare demande de choisir le sous-domaine
> `*.workers.dev` du compte (une fois par compte) — répondez dans le terminal.

À la fin :

```
  ✓ Site en ligne : https://cabinet-ajmi.<compte>.workers.dev
  ✓ API en ligne (JWT_SECRET et base de données opérationnels)
  Administration : https://cabinet-ajmi.<compte>.workers.dev/#/admin
```

> Si `cabinet-ajmi` est déjà pris sur `workers.dev`, changez `name` dans
> `wrangler.jsonc`, puis relancez la commande.

### 1.5 Se connecter à l'administration

Ouvrez `https://…/#/admin` et utilisez l'email et le mot de passe saisis à
l'étape 1.4. Le bandeau doit indiquer « Backend connecté ».

### 1.6 Reprendre les données existantes (si besoin)

Voir la section 2 ci-dessous, puis `npm run cf:admin` pour le compte administrateur.

### 1.7 Brancher le nom de domaine

Cloudflare → **Workers & Pages** → `cabinet-ajmi` → **Settings** →
**Domains & Routes** → **Add custom domain** → `cabinet-ajmi.tn`.
HTTPS est automatique et gratuit, à condition que le domaine utilise les
nameservers Cloudflare (gratuit, quel que soit le registrar).

### 1.8 Mettre à jour le site plus tard

```bash
npm run cf:deploy           # reconstruction + déploiement
```

Les modifications faites depuis `/#/admin` (textes, images, messages) sont en
base : elles ne demandent **aucun** redéploiement.

---

## 2. Reprendre les données d'un site existant

```bash
# depuis l'ancien serveur : dossier contenant ajmi.db (et/ou *.json) + uploads/
npm run cf:import -- ./server/data

# réservations qui n'existaient que dans le navigateur du cabinet :
#   console du navigateur → copy(localStorage.getItem("ajmi-reservations-v1"))
#   collez la valeur dans reservations.json, puis :
npm run cf:import -- ./server/data --reservations reservations.json

# un export JSON téléchargé depuis l'ancienne administration fonctionne aussi :
npm run cf:import -- export-ajmi.json
```

Sont repris : contenu du site (+ version d'historique), messages reçus, réservations,
références d'images — et les fichiers de `uploads/` sont recopiés dans R2.

**Compte administrateur :** les anciens mots de passe étaient hachés avec `scrypt`,
que le runtime Cloudflare ne sait pas exécuter. Le compte est donc recréé :

```bash
npm run cf:admin                                  # questions posées
ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run cf:admin    # sans interaction
```

---

## 3. Développement local

**Option A — environnement Cloudflare complet (recommandé) :**

```bash
npm run cf:dev          # http://localhost:8787 — D1 et R2 simulés dans .wrangler/
npm run cf:setup -- --local   # première fois : schéma + compte admin local
```

**Option B — serveur Node historique (`server/`) :**

```bash
npm run dev             # Vite sur :5173, /api redirigé vers :4000
cd server && npm install && npm start
```

---

## 4. Ce que fait le plan gratuit

| Ressource | Plan gratuit Cloudflare | Besoin du site |
|---|---|---|
| Requêtes au site statique | illimitées, gratuites | ~3,8 Mo d'images |
| Requêtes au Worker (`/api`, `/uploads`) | 100 000 / jour | quelques dizaines / jour |
| D1 — stockage | 500 Mo par base | < 1 Mo |
| D1 — lignes lues / écrites | 5 M lues, 100 000 écrites / jour | négligeable |
| R2 — stockage et trafic sortant | 10 Go, sortant gratuit | quelques Mo |
| Fichiers par version | 20 000 fichiers, 25 Mo chacun | ~80 fichiers |
| Domaines personnalisés | gratuits, HTTPS inclus | 1 |

Aucune carte bancaire n'est demandée et le dépassement ne facture pas : les
requêtes sont simplement refusées jusqu'à la remise à zéro (minuit UTC).

**Hachage des mots de passe.** Cloudflare facture le temps CPU (10 ms par requête
sur le plan gratuit) et `crypto.subtle` y compte. PBKDF2-SHA256 à 25 000 itérations
tient dans ce budget (~3 ms) ; au-delà, la connexion peut renvoyer l'erreur 1102.
La valeur se règle dans `wrangler.jsonc` (`PBKDF2_ITERATIONS`) ; en cas de passage
au plan payant, augmentez-la (100 000 maximum côté Workers), puis recréez le compte
avec `npm run cf:admin`.

---

## 5. Auto-hébergement (alternative)

Le serveur Node + SQLite d'origine est conservé tel quel dans `server/`
(`http.createServer`, `better-sqlite3`, fichiers dans `server/data/`). Il reste
utile pour un VPS ou une machine dédiée : voir `server/README.md` (systemd + Nginx).
Le site est alors servi par le même processus que l'API.

---

## 6. Structure du projet

```
├── src/                 interface React (pages, administration, contenu par défaut)
├── public/images/       images du site
├── dist/                site construit (généré par npm run build)
├── worker/              API Cloudflare Workers
│   ├── index.js         routes /api/* et /uploads/*
│   ├── db.js            accès D1 (users, content, history, messages, media, reservations)
│   └── lib.js           JWT (HMAC), mots de passe (PBKDF2), limitation de débit
├── migrations/          schéma SQL appliqué à D1
├── scripts/             cf:setup · cf:admin · cf:import
├── wrangler.jsonc       configuration Cloudflare (Worker, D1, R2, fichiers statiques)
└── server/              serveur Node + SQLite pour auto-hébergement
```

## 7. API

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/login` | public (8 essais / 5 min) |
| GET | `/api/me` | admin |
| POST | `/api/password` | admin |
| GET / PUT | `/api/content` | lecture publique / écriture admin |
| GET | `/api/history`, `/api/history/:i` | admin |
| GET | `/api/stats` | admin |
| POST | `/api/messages` | public (5 / 10 min, pot de miel anti-robot) |
| GET / PUT / DELETE | `/api/messages[/:id]` | admin |
| POST | `/api/reservations` | public (8 / 10 min) |
| GET | `/api/reservations/track/:code` | public (30 / min, une seule fiche) |
| GET | `/api/reservations` | admin |
| PUT / DELETE | `/api/reservations/:id` | admin |
| GET | `/api/media` | public |
| POST | `/api/media` · DELETE `/api/media/:name` | admin |
| GET | `/api/export` | admin |

Le suivi de commande (`/#/suivi`) n'expose **que** la réservation dont le code est
saisi : la liste complète reste réservée à l'administration.

---

## 8. Dépannage

**`git clone` échoue sous Windows — `error: invalid path 'images/…'`**
Un ancien dossier `images/` à la racine contenait des noms de fichiers terminés par
des espaces, que Windows refuse. Il a été supprimé (le site publie `public/images/`).
Mettez à jour une copie existante :

```powershell
git fetch origin
git reset --hard origin/main
```

Sinon, supprimez le dossier et relancez `git clone`.

**`npm run cf:setup` → `Missing script: "cf:setup"`**
La copie de travail est incomplète (clone interrompu) : npm lit alors un
`package.json` situé plus haut dans l'arborescence. Après la mise à jour ci-dessus,
`npm install` doit installer ~250 paquets (dont `wrangler`).

**Vérifier soi-même les chemins**

```bash
npm run check:paths     # intégré à l'intégration continue (.github/workflows/ci.yml)
```

**`npm audit` signale des vulnérabilités**
Elles concernent `wrangler` (outil de déploiement, `devDependencies`), jamais le site
publié : `dist/` contient seulement React et le CSS. Mettez à jour avec
`npm install wrangler@latest` lorsque c'est pratique.
