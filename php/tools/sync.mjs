#!/usr/bin/env node
/* ------------------------------------------------------------------
   Recopie le site React compilé (dist/) dans la version PHP.

     npm run build && node php/tools/sync.mjs

   À lancer après toute modification du site (textes, styles, pages)
   pour que la version PHP serve la même chose que la version Cloudflare.
   Le site PHP ne contient que du HTML/CSS/JS déjà compilés : aucun
   outil Node n'est nécessaire sur l'hébergement.
------------------------------------------------------------------- */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const racine = path.resolve(import.meta.dirname, "../..");
const dist = path.join(racine, "dist");
const php = path.join(racine, "php");

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("✗ dist/index.html introuvable : lancez d'abord « npm run build ».");
  process.exit(1);
}

/* ------------------------------ index.html ----------------------------- */

const html = fs.readFileSync(path.join(dist, "index.html"));
fs.writeFileSync(path.join(php, "index.html"), html);

const empreinte = crypto.createHash("sha256").update(html).digest("hex").slice(0, 12);
fs.writeFileSync(
  path.join(php, ".site-version"),
  JSON.stringify(
    {
      empreinte,
      taille: html.length,
      synchronise: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
);

/* -------------------------------- images ------------------------------- */

const sourceImages = path.join(dist, "images");
const cibleImages = path.join(php, "images");

if (fs.existsSync(sourceImages)) {
  fs.rmSync(cibleImages, { recursive: true, force: true });
  fs.cpSync(sourceImages, cibleImages, { recursive: true });

  const compter = (dossier) =>
    fs.readdirSync(dossier, { withFileTypes: true }).reduce((total, entree) => {
      const chemin = path.join(dossier, entree.name);
      return total + (entree.isDirectory() ? compter(chemin) : 1);
    }, 0);

  console.log(`✓ site copié dans php/ — ${compter(cibleImages)} image(s), empreinte ${empreinte}`);
} else {
  console.log(`✓ index.html copié dans php/ — empreinte ${empreinte} (aucun dossier images dans dist/)`);
}

console.log("\n  À transférer sur l'hébergement : index.html et le dossier images/.");
