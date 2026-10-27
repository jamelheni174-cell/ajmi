#!/usr/bin/env node
/* ------------------------------------------------------------------
   Construction du site puis déploiement sur Cloudflare.

     npm run cf:deploy

   Au premier déploiement, le secret JWT généré par « npm run cf:setup »
   est envoyé en même temps que le code (Cloudflare refuse d'enregistrer
   un secret pour un Worker qui n'existe pas encore). Le fichier
   .secrets.env est supprimé dès que l'envoi a réussi.
------------------------------------------------------------------- */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { C, fail, ok, step, warn, wranglerInteractive } from "./lib/wrangler.mjs";

const SECRETS_FILE = path.join(process.cwd(), ".secrets.env");

step("Construction du site");
const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (build.status !== 0) {
  fail("la construction du site a échoué.");
  process.exit(1);
}
ok("site construit dans dist/");

step("Déploiement sur Cloudflare");

const firstDeploy = fs.existsSync(SECRETS_FILE);
const args = ["deploy"];
if (firstDeploy) args.push("--secrets-file", SECRETS_FILE);

// Sortie diffusée en direct : au premier déploiement, Cloudflare peut
// demander le sous-domaine workers.dev de compte.
const deployed = await wranglerInteractive(args);
if (deployed.status !== 0) {
  if (firstDeploy) warn(`secret conservé dans ${path.basename(SECRETS_FILE)} : il sera renvoyé au prochain essai.`);
  fail(`déploiement impossible :\n\n${deployed.text.trim()}`);
  process.exit(1);
}

if (firstDeploy) {
  fs.rmSync(SECRETS_FILE, { force: true });
  ok("secret JWT envoyé avec le déploiement");
}

const url = /https:\/\/[a-z0-9.-]+\.workers\.dev/i.exec(deployed.text)?.[0] ?? "";

if (url) {
  const health = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(15000) })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  if (health?.ok) ok("API en ligne (JWT_SECRET et base de données opérationnels)");
  else warn(`l'API ne répond pas encore : ouvrez ${url}/api/health dans le navigateur.`);
}

console.log(`\n  ${C.green("✓ Site en ligne")}${url ? ` : ${C.bold(url)}` : ""}`);
if (url) console.log(`  ${C.dim("Administration :")} ${url}/#/admin\n`);
