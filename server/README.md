# Backend — Cabinet d'Avocat Ajmi

Serveur Node.js **autonome** avec base **SQLite** (une seule dépendance : `better-sqlite3`).
Aucun service tiers : les données restent sur votre hébergement.

## Démarrage

```bash
npm install && npm run build   # à la racine : construit le site (dist/)
cd server
npm run admin                  # crée le compte administrateur
npm start                      # démarre l'API + le site sur :4000
```

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | 4000 | Port d'écoute |
| `DATA_DIR` | `./data` | Données JSON + images |
| `PUBLIC_DIR` | `../dist` | Site construit |
| `JWT_SECRET` | auto | Clé de signature des jetons |
| `CORS_ORIGIN` | `*` | Origine autorisée |

## API

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/login` | public (8 essais / 5 min) |
| GET | `/api/me` | admin |
| POST | `/api/password` | admin |
| GET / PUT | `/api/content` | lecture publique / écriture admin |
| GET | `/api/history`, `/api/history/:i` | admin |
| POST | `/api/messages` | public (5 / 10 min, anti-robot) |
| GET / PUT / DELETE | `/api/messages[/:id]` | admin |
| GET | `/api/media` | public |
| POST / DELETE | `/api/media[/:name]` | admin |
| GET | `/api/export` | admin |

## Base de données (SQLite)

Fichier unique : `data/ajmi.db` — tables `users`, `content`, `history`,
`messages`, `media`. Migration automatique depuis l'ancien stockage JSON.

Inspection : `sqlite3 data/ajmi.db ".tables"`

## Sauvegarde

```bash
tar czf sauvegarde-$(date +%F).tar.gz data/     # base + images
# ou à chaud :
sqlite3 data/ajmi.db ".backup data/backup.db"
```

## Compte administrateur non interactif

```bash
ADMIN_NOM="Me Ajmi" ADMIN_EMAIL="contact.anouarajmi@gmail.com" \
ADMIN_PASSWORD="motdepasse" npm run admin
```

## Production (systemd + Nginx)

Voir la notice complète dans l'espace d'administration : `/#/admin/setup`.
