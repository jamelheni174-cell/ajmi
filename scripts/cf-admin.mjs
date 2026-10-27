#!/usr/bin/env node
/* ------------------------------------------------------------------
   Créer (ou réinitialiser) le compte administrateur dans la base D1.

     npm run cf:admin                                   (questions posées)
     ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run cf:admin
     npm run cf:admin -- --local                        (base locale)

   Options : --local
------------------------------------------------------------------- */

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { C, fail, ok, sqlString, step, warn, wrangler } from "./lib/wrangler.mjs";
import { hashPassword } from "./lib/password.mjs";

const LOCAL = process.argv.includes("--local");

const config = fs.readFileSync(path.join(process.cwd(), "wrangler.jsonc"), "utf8");
const dbName = /"database_name":\s*"([^"]+)"/.exec(config)?.[1] ?? "cabinet-ajmi";
const ITERATIONS = Number(/"PBKDF2_ITERATIONS":\s*"(\d+)"/.exec(config)?.[1]) || 25000;

console.log(`\n  ${C.bold("Compte administrateur")} — Cabinet Ajmi ${C.dim(LOCAL ? "(base locale)" : "(Cloudflare D1)")}\n`);

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
  fail("email et mot de passe requis (ou définissez ADMIN_EMAIL / ADMIN_PASSWORD).");
  process.exit(1);
}
if (password.length < 8) {
  fail("le mot de passe doit contenir au moins 8 caractères.");
  process.exit(1);
}

step("Enregistrement dans la base");
const sql =
  `insert into users (nom, email, password) values ` +
  `(${sqlString((nom || "Administrateur").trim())}, ${sqlString(email.toLowerCase())}, ${sqlString(hashPassword(password, ITERATIONS))}) ` +
  `on conflict(email) do update set nom = excluded.nom, password = excluded.password;`;

const res = wrangler(["d1", "execute", dbName, LOCAL ? "--local" : "--remote", "--command", sql]);
if (res.status !== 0) {
  fail(`écriture impossible :\n\n${res.text.trim()}`);
  process.exit(1);
}

ok(`compte « ${email.toLowerCase()} » enregistré`);
if (LOCAL) warn("base locale uniquement — relancez sans --local pour la production.");
console.log(`\n  Connexion : ${C.bold("/#/admin")}\n`);
