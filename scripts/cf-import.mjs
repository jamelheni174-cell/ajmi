#!/usr/bin/env node
/* ------------------------------------------------------------------
   Rapatrier les données existantes dans la base D1.

     npm run cf:import -- <source> [options]

   <source> peut être :
     • le dossier « server/data » de l'ancien serveur (ajmi.db, *.json, uploads/)
     • un export JSON téléchargé depuis l'administration (/api/export)
       ou l'ancien fichier content.json / messages.json

   Options :
     --local                 importer dans la base locale (.wrangler)
     --reservations <fichier>  réservations exportées du navigateur
                               (localStorage « ajmi-reservations-v1 »)
     --no-media              ne pas transférer les images vers R2

   Les comptes administrateurs ne sont PAS importés : l'ancien serveur
   hachait les mots de passe avec scrypt, que le Worker ne sait pas
   vérifier. Recréez le compte avec « npm run cf:admin » (les données,
   messages, réservations et images sont, elles, bien reprises).
------------------------------------------------------------------- */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { C, fail, ok, sqlString, step, warn, wrangler } from "./lib/wrangler.mjs";
import { hashPassword } from "./lib/password.mjs";

const argv = process.argv.slice(2);
const LOCAL = argv.includes("--local");
const WITH_MEDIA = !argv.includes("--no-media");
const resIndex = argv.indexOf("--reservations");
const RESERVATIONS_FILE = resIndex !== -1 ? argv[resIndex + 1] : null;

const positional = argv.filter((a, i) => !a.startsWith("--") && (resIndex === -1 || i !== resIndex + 1));
const SOURCE = positional[0];

const config = fs.readFileSync(path.join(process.cwd(), "wrangler.jsonc"), "utf8");
const dbName = /"database_name":\s*"([^"]+)"/.exec(config)?.[1] ?? "cabinet-ajmi";
const bucket = /"bucket_name":\s*"([^"]+)"/.exec(config)?.[1] ?? "cabinet-ajmi-media";
const ITERATIONS = Number(/"PBKDF2_ITERATIONS":\s*"(\d+)"/.exec(config)?.[1]) || 25000;

if (!SOURCE) {
  fail("indiquez la source : npm run cf:import -- ./server/data");
  process.exit(1);
}
if (!fs.existsSync(SOURCE)) {
  fail(`source introuvable : ${SOURCE}`);
  process.exit(1);
}

console.log(`\n  ${C.bold("Import des données")} — Cabinet Ajmi ${C.dim(LOCAL ? "(base locale)" : "(Cloudflare D1)")}`);
console.log(`  ${C.dim(`source : ${path.resolve(SOURCE)}`)}`);

const stat = fs.statSync(SOURCE);
const isDir = stat.isDirectory();

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

/* --------------------------- Lecture de la source ------------------------ */

let content = null;
let messages = [];
let reservations = [];
let mediaRows = [];
let uploadsDir = null;
const notes = [];

if (isDir) {
  uploadsDir = fs.existsSync(path.join(SOURCE, "uploads")) ? path.join(SOURCE, "uploads") : null;
  const dbPath = ["ajmi.db", "data/ajmi.db"].map((p) => path.join(SOURCE, p)).find((p) => fs.existsSync(p));

  if (dbPath) {
    const { DatabaseSync } = await import("node:sqlite");
    const sqlite = new DatabaseSync(dbPath, { readOnly: true });
    const table = (name) => {
      try {
        return sqlite.prepare(`select * from ${name}`).all();
      } catch {
        return [];
      }
    };
    const c = table("content")[0];
    if (c?.data) content = JSON.parse(c.data);
    messages = table("messages");
    reservations = table("reservations");
    mediaRows = table("media");
    notes.push(`base SQLite lue : ${path.relative(process.cwd(), dbPath)}`);
  }

  // Ancien stockage JSON (avant la migration SQLite)
  const legacyContent = readJson(path.join(SOURCE, "content.json"));
  if (!content && legacyContent) content = legacyContent;
  const legacyMessages = readJson(path.join(SOURCE, "messages.json"));
  if (!messages.length && Array.isArray(legacyMessages)) messages = legacyMessages;

  const uploadNames = uploadsDir ? fs.readdirSync(uploadsDir).filter((f) => fs.statSync(path.join(uploadsDir, f)).isFile()) : [];
  if (!mediaRows.length && uploadNames.length) mediaRows = uploadNames.map((name) => ({ name, taille: fs.statSync(path.join(uploadsDir, name)).size }));
} else {
  const data = readJson(SOURCE);
  if (!data) {
    fail("fichier JSON illisible.");
    process.exit(1);
  }
  content = data.content ?? (data.hero && data.contact ? data : null);
  messages = data.messages ?? [];
  reservations = data.reservations ?? [];
  mediaRows = data.media ?? [];
}

if (RESERVATIONS_FILE) {
  const data = readJson(RESERVATIONS_FILE);
  const list = Array.isArray(data) ? data : (data?.["ajmi-reservations-v1"] ?? data?.reservations ?? []);
  if (Array.isArray(list) && list.length) {
    reservations = list.concat(reservations);
    notes.push(`${list.length} réservation(s) lue(s) depuis ${RESERVATIONS_FILE}`);
  } else warn("aucune réservation trouvée dans le fichier fourni.");
}

if (!content && !messages.length && !reservations.length) {
  fail("rien à importer dans cette source.");
  process.exit(1);
}

/* ----------------------------- Génération SQL ---------------------------- */

const norm = (value) => String(value || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
// Pas de BEGIN/COMMIT explicite : D1 exécute déjà le fichier en transaction.
const lines = ["-- import généré par npm run cf:import"];

if (content) {
  const raw = JSON.stringify(content);
  if (raw.length > 90_000) {
    warn(`le contenu pèse ${(raw.length / 1024).toFixed(0)} Ko : D1 limite une requête à 100 Ko.`);
  }
  lines.push(`insert or replace into content (id, data, updated_at) values (1, ${sqlString(raw)}, datetime('now'));`);
  lines.push(`insert into history (data, author) values (${sqlString(raw)}, 'import');`);
}

for (const m of messages) {
  lines.push(
    `insert into messages (nom, email, telephone, competence, message, lu, ip, created_at) values (` +
      [
        sqlString(m.nom ?? ""),
        sqlString(m.email ?? ""),
        sqlString(m.telephone ?? ""),
        sqlString(m.competence ?? ""),
        sqlString(m.message ?? ""),
        m.lu ? 1 : 0,
        sqlString(m.ip ?? ""),
        sqlString(m.created_at ?? new Date().toISOString()),
      ].join(", ") +
      ");",
  );
}

for (const r of reservations) {
  const id = r.id ?? `RÉSER-#${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
  lines.push(
    `insert or replace into reservations (id, code_norm, created_at, publication_id, publication_title, nom, telephone, email, adresse, quantite, remarques, statut, ip) values (` +
      [
        sqlString(id),
        sqlString(r.code_norm ?? norm(id)),
        sqlString(r.created_at ?? new Date().toISOString()),
        sqlString(r.publication_id ?? ""),
        sqlString(r.publication_title ?? ""),
        sqlString(r.nom ?? ""),
        sqlString(r.telephone ?? ""),
        sqlString(r.email ?? ""),
        sqlString(r.adresse ?? ""),
        Math.max(1, Number(r.quantite) || 1),
        sqlString(r.remarques ?? ""),
        sqlString(["en_attente", "confirmee", "livree", "annulee"].includes(r.statut) ? r.statut : "en_attente"),
        sqlString(r.ip ?? ""),
      ].join(", ") +
      ");",
  );
}

for (const m of mediaRows) {
  if (!m?.name) continue;
  lines.push(`insert or replace into media (name, taille) values (${sqlString(m.name)}, ${Number(m.taille) || 0});`);
}

const sqlFile = path.join(os.tmpdir(), `ajmi-import-${Date.now()}.sql`);
fs.writeFileSync(sqlFile, lines.join("\n"), "utf8");

console.log(
  `\n  ${C.dim("à importer :")} ${content ? "contenu, " : ""}${messages.length} message(s), ` +
    `${reservations.length} réservation(s), ${mediaRows.length} image(s)`,
);
for (const note of notes) console.log(`  ${C.dim(`· ${note}`)}`);

/* -------------------------------- Exécution ------------------------------ */

step("Écriture dans la base");
const res = wrangler(["d1", "execute", dbName, LOCAL ? "--local" : "--remote", "--file", sqlFile]);
if (res.status !== 0) {
  fail(`import impossible :\n\n${res.text.trim()}`);
  process.exit(1);
}
ok("données importées");
fs.rmSync(sqlFile, { force: true });

if (WITH_MEDIA && uploadsDir) {
  const files = fs.readdirSync(uploadsDir).filter((f) => fs.statSync(path.join(uploadsDir, f)).isFile());
  if (files.length) {
    step(`Transfert de ${files.length} image(s) vers R2`);
    let done = 0;
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const type = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[ext] ?? "application/octet-stream";
      const put = wrangler([
        "r2", "object", "put", `${bucket}/uploads/${file}`,
        "--file", path.join(uploadsDir, file),
        "--content-type", type,
        ...(LOCAL ? ["--local"] : []),
      ]);
      if (put.status === 0) done++;
      else warn(`échec pour ${file}`);
    }
    ok(`${done}/${files.length} image(s) transférée(s)`);
  }
} else if (uploadsDir && !WITH_MEDIA) {
  warn("images ignorées (--no-media).");
}

/* --------------------------------- Compte -------------------------------- */

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  step("Création du compte administrateur");
  const sql =
    `insert into users (nom, email, password) values ` +
    `(${sqlString(process.env.ADMIN_NOM || "Administrateur")}, ${sqlString(process.env.ADMIN_EMAIL.toLowerCase())}, ${sqlString(hashPassword(process.env.ADMIN_PASSWORD, ITERATIONS))}) ` +
    `on conflict(email) do update set nom = excluded.nom, password = excluded.password;`;
  const r = wrangler(["d1", "execute", dbName, LOCAL ? "--local" : "--remote", "--command", sql]);
  if (r.status === 0) ok(`compte « ${process.env.ADMIN_EMAIL.toLowerCase()} » créé`);
  else warn("création du compte impossible : lancez « npm run cf:admin ».");
} else {
  warn("compte administrateur non repris (mots de passe scrypt) → npm run cf:admin");
}

console.log(`\n  ${C.green("✓ Import terminé.")} ${LOCAL ? "Base locale." : "Pensez à redéployer si besoin : npm run cf:deploy"}\n`);
