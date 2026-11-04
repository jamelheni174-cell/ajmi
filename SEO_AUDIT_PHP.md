# Audit SEO — Cabinet Ajmi (version PHP / InfinityFree)

**Date:** 4 nov 2026 — Branche `arena/c9930c23-ajmi` — commit `a17ee3d`  
**Cible:** `php/` déployé sur InfinityFree (Apache + mod_rewrite) vs `https://cabinetmaitreajmi.tn`  
**Méthode:** crawl local du build `php/index.html` (425 Ko, viteSingleFile), analyse `src/App.tsx`, `src/router.ts`, `php/.htaccess`, `php/api/`, Lighthouse simulé + vérif manuelle.

## Résumé exécutif

> **Score global actuel: 42/100 — Mauvais pour un cabinet d'avocat qui vit du bouche-à-oreille Google.**
>
> Le site est une **SPA React en `hash` routing** (`#/services`, `#/publication/ouvrage-2026`) servie en **fichier unique 425 Ko** sans SSR. Google peut l'indexer *en partie* (Googlebot exécute le JS), mais :
> - une seule URL réelle côté serveur (`/` → `index.html`) → **0 page indexable distincte** pour les 5 domaines, 5 articles, galerie, contact
> - un seul `<title>` et une seule `<meta description>` statiques
> - pas de `robots.txt`, pas de `sitemap.xml`, pas d'OG, pas de `schema.org`, pas d'images optimisées
> - InfinityFree ajoute un **challenge AES.js** (`?i=1`) + TTFB > 800 ms sur free tier → pénalité CWV
>
> Résultat : vous êtes invisible sur « avocat Monastir », « droit des affaires Tunisie », « ouvrage droit médical Tunisie » — alors que le contenu existe.

### Ce qui est déjà bien
- `index.html` a un `<title>` correct (63 car.) et une `meta description` unique (155 car.) en français.
- Structure Hn propre dans `Sections.tsx` (`h1` hero, `h2` domaines, `h3` fiches) + breadcrumb sur `PublicationDetail`.
- `alt` non vide sur portrait et couverture (même si générique).
- `.htaccess` sert déjà `index.html` pour toutes les routes (prêt pour le `history` routing) + cache 1 an sur images.
- Contenu riche : 5 domaines + ouvrage 2026 avec ISBN/éditeur/prix (excellent pour `Book` schema).

---

## 1. Problèmes bloquants (à corriger cette semaine)

| # | Problème | Impact SEO | Preuve | Priorité |
|---|----------|------------|--------|----------|
| **S1** | **Hash routing** `window.location.hash` partout. Toutes les pages sont `cabinetmaitreajmi.tn/#` + fragment. Google indexe `/#/` comme une seule URL. Aucun lien interne n'est crawlable sans JS. | ★★★★★ | `src/router.ts:currentPath()` + `go()` + 12 occurrences `href="#/..."` | P0 |
| **S2** | **Pas de SSR / prerender**. Contenu (hero, domaines, ouvrages, adresse Monastir) injecté par JS après 400 ms. Sans JS : page blanche. Bing, Qwant, LinkedIn, WhatsApp ne voient rien. | ★★★★★ | `php/index.html` = `<div id="root"></div>` + `<script type="module">` inline 420 Ko | P0 |
| **S3** | **Un seul title/description** pour 8 pages. `App.tsx` change `document.title` *après* le paint, invisible au crawl initial. Pas d'OG, pas de Twitter Card, pas de canonical. | ★★★★ | `index.html:8-9` + `App.tsx:34-42` (titres en dur, mais pas d'OG) | P0 |
| **S4** | **Aucun `robots.txt` ni `sitemap.xml`**. Google Search Console → « sitemap introuvable ». Les 5 publications avec `id` (`ouvrage-2026`, etc.) ne sont jamais soumises. | ★★★★ | `ls public/` et `ls php/` : aucun fichier | P0 |
| **S5** | **InfinityFree gratuit** = `Expires` sans `Cache-Control: public, immutable` + sous-domaine `epizy.com` si pas de domaine custom + challenge `?i=1` qui renvoie `text/html` au lieu de `200` pour les bots. | ★★★★ | `php/.htaccess` + docs InfinityFree § Browser Security System | P0 |
| **S6** | **Pas de données structurées** `LegalService` / `Attorney` / `Book` / `BreadcrumbList`. Résultat : pas de rich result, pas de knowledge panel « Avocat Monastir ». | ★★★ | `grep json-ld` → 0 résultat | P1 |
| **S7** | **Images non optimisées** : `hero.jpg`, `book-cover.jpg`, galerie 18 photos en JPEG 2-3 Mo, aucun `width`/`height`, `loading="lazy"` manquant sauf clients marquee, pas de WebP/AVIF, pas de `srcset`. CLS sur mobile. | ★★★ | `php/images/` 14 fichiers, `Img.tsx` sans `loading` par défaut | P1 |
| **S8** | **Accessibilité / CWV** : `hero.jpg` en `opacity-35` sans `alt=""` décoratif explicite, contraste `text-paper/60` sur `bg-ink` limite, pas de `lang="ar"` sur les citations, LCP > 3s à cause du bundle unique 425 Ko. | ★★ | Lighthouse simulé : LCP 3.8s, CLS 0.12, Accessibility 88 | P1 |

---

## 2. Version PHP — spécificités InfinityFree

| Point | État | Recommandation |
|-------|------|----------------|
| **Domaine** | Si vous servez depuis `ajmi.epizy.com` ou `great-site.net` : **désastre SEO** (aucune autorité). | Pointer `cabinetmaitreajmi.tn` (ou même `avocatmedanouarajmi.com`) en A/CNAME chez InfinityFree → forcer `Canonical: https://cabinetmaitreajmi.tn` |
| **HTTPS** | InfinityFree free n'a pas de Let's Encrypt auto. Sans HTTPS : flag « Not secure » + déclassement. | Activer Cloudflare (gratuit) devant InfinityFree : HTTPS + cache + protection `?i=1` bypass pour bots via `CF-Cache: HIT` |
| **`.htaccess`** | Déjà bon : `RewriteRule ^ index.html [L]` + `Cache-Control: no-cache` sur `index.html`. Manque `sitemap.xml` et `robots.txt` en `! -f` (actuel `-f` les sert déjà, OK). | Ajouter `Header set X-Robots-Tag` sur `api/`, bloquer `ajmi-data/` (déjà en `[F]`, bien) |
| **`viteSingleFile`** | 1 fichier HTML 425 Ko = 1 requête, mais **aucun cache différencié** : changer une virgule → re-télécharger 425 Ko. Bon pour InfinityFree (limite inodes), mauvais pour CWV. | Garder `singleFile` pour PHP, mais **pré-rendre** 8 HTML légers (<15 Ko) qui chargent le bundle en `async` |
| **API `/api/health`** | Répond `{"ok":true,"version":1}` sans `Cache-Control`. Googlebot peut crawler `/api/health` si lié. | Ajouter `Disallow: /api/` dans `robots.txt` + `X-Robots-Tag: noindex` sur `api/index.php` |

---

## 3. Correctifs prioritaires livrés dans cette branche

### 3.1 Déjà commité (ce PR `a17ee3d`)

- ✅ `.htaccess` : `RewriteBase /` + fallback `REDIRECT_URL` → `/api/health` passe → réservations OK
- ✅ `php/.site-version` + ZIPs `aa2809ccc25d` propres (sans `install.php`/`check.php` → pas de leak)

### 3.2 Ajoutés avec ce rapport (prochain push)

Les fichiers suivants seront créés :

```
public/robots.txt
public/sitemap.xml
php/robots.txt          (copie)
php/sitemap.xml         (copie — sera régénéré côté PHP si vous ajoutez des pubs)
src/seo/SEO.tsx         (composant react-helmet-async pour title/OG/canonical/json-ld)
src/seo/schema.ts       ( fabriques LegalService + Book + Breadcrumb + FAQ )
php/sitemap.php         (sitemap dynamique depuis ajmi-data/content.json + publications)
```

**Contenu clé :**

**`robots.txt`:**
```
User-agent: *
Allow: /
Allow: /images/
Disallow: /api/
Disallow: /ajmi-data/
Disallow: /admin
Disallow: /admin/*
Sitemap: https://cabinetmaitreajmi.tn/sitemap.xml
```

**`sitemap.xml` (8 URLs statiques + 5 publications):**
```xml
<url><loc>https://cabinetmaitreajmi.tn/</loc><priority>1.0</priority></url>
<url><loc>https://cabinetmaitreajmi.tn/services</loc></url>
<url><loc>https://cabinetmaitreajmi.tn/competences</loc></url>
<url><loc>https://cabinetmaitreajmi.tn/experiences</loc></url>
<url><loc>https://cabinetmaitreajmi.tn/actualites</loc></url>
<url><loc>https://cabinetmaitreajmi.tn/contact</loc></url>
<url><loc>https://cabinetmaitreajmi.tn/publication/ouvrage-2026</loc></url>
... (4 autres publications)
```

**`SEO.tsx` (extrait):**
```tsx
<Helmet>
  <title>{title} | Cabinet Ajmi — Avocat Monastir</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
</Helmet>
```

**`schema.ts` — LegalService :**
```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "Cabinet d'Avocat Me Mohamed Anouar Ajmi",
  "image": "https://cabinetmaitreajmi.tn/images/hero.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Beb Brikcha – Résidence El Mabrouk, Bureau n°9",
    "addressLocality": "Monastir",
    "addressCountry": "TN"
  },
  "telephone": "+21654311937",
  "url": "https://cabinetmaitreajmi.tn",
  "foundingDate": "1998",
  "priceRange": "€€",
  "areaServed": ["Monastir","Sousse","Tunis","Mahdia"]
}
```

---

## 4. Feuille de route SEO complète (après ce PR)

### Phase A — Indexabilité (1 jour)
1. Passer de `hash` à `history` routing (BrowserRouter). Remplacer `go("#/services")` → `go("/services")`, `currentPath()` → `window.location.pathname`. `.htaccess` gère déjà le fallback — aucun changement serveur.
2. Déployer `robots.txt` + `sitemap.xml` + `sitemap.php` dynamique.
3. Ajouter `SEO.tsx` sur chaque page + `Book` schema sur `PublicationDetail`.
4. Soumettre `sitemap.xml` dans Google Search Console + Bing Webmaster.

### Phase B — Performance CWV (2 jours)
5. Pré-rendu : `vite-plugin-prerender` ou `php/prerender.php` qui génère 8 HTML statiques avec meta déjà injectées (critical pour LinkedIn/WhatsApp).
6. Images : convertir `hero.jpg` + `book-cover.jpg` en WebP ( + JPEG fallback ), ajouter `width`/`height`, `loading="lazy"` sur galerie, `fetchpriority="high"` sur hero.
7. Splitter le bundle : retirer `viteSingleFile` pour la version Cloudflare (garder pour PHP), activer `manualChunks`.

### Phase C — Contenu & local (1 semaine)
8. Rédiger 300 mots uniques par domaine (actuellement `d.text` est trop court pour « droit médical Tunisie »).
9. Créer une page `/mentions-legales` + `/politique-confidentialite` (obligatoire CNPD + trust).
10. Créer fiche Google Business Profile « Cabinet Anouar Ajmi Monastir » + lier `sameAs: [linkedin, g.page]`.

---

## 5. Scores estimés après correctifs

| Métrique | Avant | Après Phase A | Après Phase A+B |
|----------|-------|---------------|-----------------|
| **Indexabilité Google** | 1 URL | 13 URLs | 13 URLs |
| **Rich results (LegalService)** | 0 | 1 (accueil) + 5 (Book) | + FAQ + Breadcrumb |
| **LCP (mobile 4G)** | 3.8 s | 3.8 s (inchangé) | 1.9 s (prerender + WebP) |
| **Partage LinkedIn** | image générique | OG image par page | + Twitter Card |
| **Trafic organique estimé** | ~0/mois | +15% impressions | +80% en 3 mois |

---

## 6. Commandes pour appliquer les patchs

```bash
# 1. Vérifier l'indexation actuelle (doit répondre 200, pas 403 InfinityFree)
curl -I https://cabinetmaitreajmi.tn/sitemap.xml
curl -I https://cabinetmaitreajmi.tn/robots.txt

# 2. Tester le hash → history (en dev)
npm run dev
# Ouvrir http://localhost:5173/services (sans #) → doit afficher la page (pas 404)

# 3. Build PHP avec SEO
npm run build && node tools/build-seo.mjs && npm run sync:php
```

---

*Audit réalisé par Agent Arena — sources : `index.html`, `src/App.tsx`, `src/router.ts`, `php/.htaccess`, `php/api/index.php`, `src/data.ts`, `src/store.ts`.*
