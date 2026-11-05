#!/usr/bin/env node
// Inject SEO head into php/index.html (and dist if exists): canonical, OG, json-ld, preconnect
import fs from 'fs';
import path from 'path';

const SITE = 'https://cabinetmaitreajmi.tn';
const TITLE = 'Cabinet d\'Avocat Ajmi | Affaires · Famille · Médical · Biens · Contrats — Monastir';
const DESC = 'Cabinet d\'Avocat Ajmi — Me Mohamed Anouar Ajmi, Avocat près la Cour d\'Appel à Monastir. Droit des affaires, famille, médical, biens et contrats. +216 54 311 937.';

const headInject = `
    <link rel="canonical" href="${SITE}/" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESC}" />
    <meta property="og:url" content="${SITE}/" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${SITE}/images/og-image.jpg" />
    <meta property="og:image:secure_url" content="${SITE}/images/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:alt" content="Cabinet Ajmi — Me Anouar Ajmi, Avocat Monastir" />
    <meta property="og:site_name" content="Cabinet Ajmi" />
    <meta property="og:locale" content="fr_TN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESC}" />
    <meta name="twitter:image" content="${SITE}/images/og-image.jpg" />
    <meta name="twitter:image:alt" content="Cabinet Ajmi — Avocat Monastir" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"LegalService","name":"Cabinet d'Avocat Me Mohamed Anouar Ajmi","url":"${SITE}","logo":"${SITE}/images/logo-cabinet-dark.png","image":"${SITE}/images/og-image.jpg","telephone":"+21654311937","address":{"@type":"PostalAddress","streetAddress":"Beb Brikcha – Résidence El Mabrouk, Bureau n°9","addressLocality":"Monastir","addressCountry":"TN"},"priceRange":"€€"}</script>
`;

for (const p of ['php/index.html', 'dist/index.html']) {
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');
  // Only check head section for static OG (not JS bundle)
  const head = html.slice(0, html.indexOf('</head>'));
  if (head.includes('property="og:title"')) { console.log(`skip ${p} (already SEO)`); continue; }
  html = html.replace('</title>', `</title>${headInject}`);
  fs.writeFileSync(p, html);
  console.log(`SEO injected → ${p}`);
}
