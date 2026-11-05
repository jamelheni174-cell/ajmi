# Déploiement Cloudflare gratuit sans R2

Cette variante utilise Workers et D1 pour le site, les réservations et les images téléversées. Elle ne lance pas PHP et ne nécessite pas l'activation de R2. Elle est distincte de la configuration existante avec R2 : `wrangler.d1.jsonc` et la base `cabinet-ajmi-d1`.

## Limites

- Les nouvelles images téléversées via l'administration sont limitées à **1 Mo par image**. Les images fournies avec le site ne sont pas concernées.
- Le plan gratuit D1 limite notamment une base à 500 Mo et impose des quotas journaliers ; en cas de dépassement les opérations peuvent échouer. Voir https://developers.cloudflare.com/d1/platform/limits/ et https://developers.cloudflare.com/workers/platform/pricing/.
- L'activation, les quotas et les conditions de Cloudflare dépendent du compte. Le déploiement distant n'a pas encore été testé sur le compte client.
- L'installation crée une nouvelle base **vide** et un nouveau compte administrateur. Elle ne transfère pas les réservations, messages, contenu modifié ou images d'InfinityFree. Conserver l'ancien site et sauvegarder la base et `uploads/` avant toute migration. Ne pas utiliser le script d'import R2 avec cette configuration sans adaptation et tests préalables.

## Installation sur Windows

1. Installer Node.js 22 ou plus. Télécharger le ZIP source de la branche Arena et l'extraire.
2. Ouvrir le dossier extrait, saisir `cmd` dans la barre d'adresse de l'explorateur puis Entrée.
3. Exécuter successivement :

```bash
npm install
npx wrangler login
npm run cf:setup:d1
```

4. Autoriser Wrangler dans le navigateur. Pendant l'installation choisir un nom, un e-mail et un mot de passe pour l'administration ; ne pas partager ces informations. La saisie du mot de passe peut être visible. L'installation n'active pas R2 et crée la base D1 et le Worker temporaires. Si Cloudflare exige une vérification ou un abonnement, lire les conditions avant de confirmer.
5. Ouvrir l'adresse `workers.dev` affichée, `/api/health`, puis `/admin`. Tester une réservation et son suivi, la supprimer ensuite. Tester aussi l'ajout et la suppression d'une image de moins de 1 Mo.
6. Ne pas toucher aux DNS ni supprimer InfinityFree avant la sauvegarde, la migration et la vérification de toutes les données. Les balises canoniques et Open Graph ciblent le domaine final ; la prévisualisation de l'adresse temporaire peut être différente.

Pour les mises à jour ultérieures, depuis le même dossier et compte :

```bash
npm run cf:deploy:d1
```

Ne pas partager la configuration modifiée si elle contient des données sensibles, ni les fichiers `.dev.vars` ou `.secrets.env`. Ne jamais publier une sauvegarde contenant des données clients.
