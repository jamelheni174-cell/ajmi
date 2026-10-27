#!/usr/bin/env node
/* ------------------------------------------------------------------
   Mise en place complète sur Cloudflare (une seule commande) :

     npm run cf:setup

   • crée la base D1 et le bucket R2 s'ils n'existent pas
   • renseigne l'identifiant de la base dans wrangler.jsonc
   • applique le schéma SQL
   • génère le secret de signature des jetons
   • crée le compte administrateur
   • construit le site et le déploie

   Options :
     --local        tout faire en local (aucun compte Cloudflare requis)
     --skip-deploy  s'arrêter avant le déploiement
     --skip-admin   ne pas créer de compte administrateur
------------------------------------------------------------------- */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { C, fail, isLoggedIn, ok, sqlString, step, warn, wrangler } from "./lib/wrangler.mjs";
import { hashPassword, randomSecret } from "./lib/password.mjs";

const ARGS = new Set(process.argv.slice(2));
const LOCAL = ARGS.has("--local");
const SKIP_DEPLOY = ARGS.has("--skip-deploy");
const SKIP_ADMIN = ARGS.has("--skip-admin");

const CONFIG = path.join(process.cwd(), "wrangler.jsonc");

if (!fs.existsSync(CONFIG)) {
  fail("wrangler.jsonc introuvable : lancez la commande depuis la racine du projet.");
  process.exit(1);
}

let config = fs.readFileSync(CONFIG, "utf8");
const projectName = /"name":\s*"([^"]+)"/.exec(config)?.[1] ?? "cabinet-ajmi";
const dbName = /"database_name":\s*"([^"]+)"/.exec(config)?.[1] ?? projectName;
const bucket = /"bucket_name":\s*"([^"]+)"/.exec(config)?.[1] ?? `${projectName}-media`;
const ITERATIONS = Number(/"PBKDF2_ITERATIONS":\s*"(\d+)"/.exec(config)?.[1]) || 25000;

console.log(`\n  ${C.bold("Cabinet Ajmi")} — installation sur Cloudflare`);
console.log(`  ${C.dim(`projet : ${projectName} · base : ${dbName} · images : ${bucket}`)}`);

/* ------------------------- 1. Compte Cloudflare ------------------------- */

if (!LOCAL) {
  step("Vérification de la connexion Cloudflare");
  if (!isLoggedIn()) {
    fail(
      "Vous n'êtes pas connecté.\n\n" +
        "  Lancez d'abord :\n\n" +
        `    ${C.bold("npx wrangler login")}\n\n` +
        "  (ou définissez CLOUDFLARE_API_TOKEN), puis relancez « npm run cf:setup ».\n",
    );
    process.exit(1);
  }
  ok("compte Cloudflare authentifié");
}

/* ------------------------------ 2. Base D1 ------------------------------ */

let databaseId = /"database_id":\s*"([^"]+)"/.exec(config)?.[1] ?? "";

if (LOCAL) {
  ok("mode local : la base D1 est simulée dans .wrangler/");
} else {
  step(`Base de données D1 « ${dbName} »`);
  const list = wrangler(["d1", "list", "--json"]);
  let found = null;
  try {
    const rows = JSON.parse(list.stdout.slice(list.stdout.indexOf("[")));
    found = rows.find((r) => r.name === dbName) ?? null;
  } catch {
    /* sortie non JSON : on tentera la création */
  }

  if (found) {
    databaseId = found.uuid ?? found.id ?? databaseId;
    ok(`base existante (${databaseId})`);
  } else {
    const created = wrangler(["d1", "create", dbName]);
    if (created.status !== 0) {
      fail(`création impossible :\n\n${created.text.trim()}`);
      process.exit(1);
    }
    databaseId = /database_id["'\s=:]+([0-9a-f]{8}-[0-9a-f-]{27,})/i.exec(created.text)?.[1] ?? "";
    if (!databaseId) {
      // Certaines versions de wrangler n'affichent pas la configuration :
      // on relit la liste des bases pour retrouver l'identifiant.
      const again = wrangler(["d1", "list", "--json"]);
      try {
        const rows = JSON.parse(again.stdout.slice(again.stdout.indexOf("[")));
        const row = rows.find((r) => r.name === dbName);
        databaseId = row?.uuid ?? row?.id ?? "";
      } catch {
        /* on affichera l'erreur ci-dessous */
      }
    }
    if (!databaseId) {
      fail(`base créée mais identifiant illisible. Copiez « database_id » dans wrangler.jsonc :\n\n${created.text.trim()}`);
      process.exit(1);
    }
    ok(`base créée (${databaseId})`);
  }

  if (!config.includes(databaseId)) {
    config = config.replace(/"database_id":\s*"[^"]*"/, `"database_id": "${databaseId}"`);
    fs.writeFileSync(CONFIG, config);
    ok("identifiant enregistré dans wrangler.jsonc");
  }
}

/* ------------------------- 3. Bucket R2 (images) ------------------------ */

if (!LOCAL) {
  step(`Stockage des images R2 « ${bucket} »`);
  const res = wrangler(["r2", "bucket", "create", bucket]);
  if (res.status === 0) ok("bucket créé");
  else if (/already exists|already owned|10004/i.test(res.text)) ok("bucket existant");
  else {
    fail(`création du bucket impossible :\n\n${res.text.trim()}`);
    process.exit(1);
  }
}

/* ------------------------------ 4. Schéma ------------------------------- */

step("Application du schéma SQL");
const migrate = wrangler([
  "d1", "migrations", "apply", dbName,
  LOCAL ? "--local" : "--remote",
], { input: "\n" });
if (migrate.status !== 0 && !/No migrations to apply/i.test(migrate.text)) {
  fail(`migration impossible :\n\n${migrate.text.trim()}`);
  process.exit(1);
}
ok("tables en place (users, content, history, messages, media, reservations)");

/* --------------------------- 5. Secret JWT ------------------------------ */

if (LOCAL) {
  if (!fs.existsSync(".dev.vars")) {
    fs.writeFileSync(".dev.vars", `JWT_SECRET=${randomSecret()}\n`);
    ok("secret local écrit dans .dev.vars");
  } else ok("secret local déjà présent (.dev.vars)");
} else {
  step("Secret de signature des jetons");
  const res = wrangler(["secret", "put", "JWT_SECRET"], { input: `${randomSecret()}\n` });
  if (res.status === 0) ok("JWT_SECRET enregistré (invisible dans le code)");
  else {
    warn("enregistrement automatique impossible.");
    warn("Lancez à la main :  npx wrangler secret put JWT_SECRET");
  }
}

/* ------------------------- 6. Compte administrateur --------------------- */

if (!SKIP_ADMIN) {
  step("Compte administrateur");
  let nom = process.env.ADMIN_NOM;
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;

  if ((!email || !password) && stdin.isTTY) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    nom = (await rl.question("  Nom affiché   : ")).trim() || "Administrateur";
    email = (await rl.question("  Email         : ")).trim();
    password = (await rl.question("  Mot de passe  : ")).trim();
    rl.close();
  }

  if (!email || !password) {
    warn("aucun compte créé (mode non interactif).");
    warn("Lancez :  npm run cf:admin   — ou définissez ADMIN_EMAIL et ADMIN_PASSWORD.");
  } else if (password.length < 8) {
    fail("le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  } else {
    const sql =
      `insert into users (nom, email, password) values ` +
      `(${sqlString((nom || "Administrateur").trim())}, ${sqlString(email.toLowerCase())}, ${sqlString(hashPassword(password, ITERATIONS))}) ` +
      `on conflict(email) do update set nom = excluded.nom, password = excluded.password;`;
    const res = wrangler(["d1", "execute", dbName, LOCAL ? "--local" : "--remote", "--command", sql]);
    if (res.status !== 0) {
      fail(`création du compte impossible :\n\n${res.text.trim()}`);
      process.exit(1);
    }
    ok(`compte « ${email.toLowerCase()} » prêt`);
  }
}

/* --------------------------- 7. Build + deploy -------------------------- */

if (!SKIP_DEPLOY) {
  step("Construction du site");
  const build = wrangler(["--version"]); // garde-fou : wrangler présent
  if (build.status !== 0) {
    fail("wrangler introuvable : lancez « npm install ».");
    process.exit(1);
  }

  const { spawnSync } = await import("node:child_process");
  const compiled = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (compiled.status !== 0) {
    fail("la construction du site a échoué.");
    process.exit(1);
  }
  ok("site construit dans dist/");

  if (LOCAL) {
    console.log(`\n  ${C.bold("Tout est prêt en local.")} Lancez :\n\n    ${C.bold("npm run cf:dev")}\n`);
  } else {
    step("Déploiement sur Cloudflare");
    const deployed = wrangler(["deploy"]);
    if (deployed.status !== 0) {
      fail(`déploiement impossible :\n\n${deployed.text.trim()}`);
      process.exit(1);
    }
    const url = /https:\/\/[a-z0-9.-]+\.workers\.dev/i.exec(deployed.text)?.[0] ?? "";
    console.log(`\n  ${C.green("✓ Site en ligne")}${url ? ` : ${C.bold(url)}` : ""}`);
    console.log(`  ${C.dim("Espace d'administration : ")}${url}/#/admin\n`);
  }
} else {
  console.log(`\n  ${C.bold("Installation terminée.")} Déployez avec : ${C.bold("npm run cf:deploy")}\n`);
}
