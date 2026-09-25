import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, ensureDirs, hashPassword } from "./lib.js";

ensureDirs();

/* --------------------------- Moteur SQLite ---------------------------
   better-sqlite3 est utilisé quand il est installé (binaire pré-compilé
   ou compilation locale). Sinon, repli sur le module SQLite intégré de
   Node.js 22+ (`node:sqlite`), ce qui permet de faire tourner le backend
   sans outillage de compilation native.
--------------------------------------------------------------------- */

async function openDatabase(file) {
  try {
    const { default: Database } = await import("better-sqlite3");
    const d = new Database(file);
    d.pragma("journal_mode = WAL");
    d.pragma("foreign_keys = ON");
    return d;
  } catch {
    const { DatabaseSync } = await import("node:sqlite");
    await repareWAL(file);
    const d = new DatabaseSync(file);
    // Journal en mode TRUNCATE plutôt que WAL : toutes les écritures validées
    // sont dans le fichier principal, et non dans un fichier -wal annexe. Avec
    // le module node:sqlite (expérimental), le WAL peut ne pas être relu par une
    // connexion ultérieure — une écriture devenait alors invisible, ce qui
    // provoquait des refus de connexion aléatoires.
    d.exec("PRAGMA journal_mode = TRUNCATE; PRAGMA foreign_keys = ON;");
    if (typeof d.pragma !== "function") d.pragma = (s) => d.exec(`PRAGMA ${s}`);
    return d;
  }
}

/* Récupère les données d'un éventuel fichier -wal laissé par une session
   précédente, puis le supprime pour repartir sur un journal propre. */
async function repareWAL(file) {
  const wal = `${file}-wal`;
  const shm = `${file}-shm`;
  try {
    if (!fs.existsSync(file)) return;
    if (fs.existsSync(wal) && fs.statSync(wal).size > 0) {
      // Une connexion dédiée force SQLite à rejouer le journal puis à le vider.
      const { DatabaseSync } = await import("node:sqlite");
      const tmp = new DatabaseSync(file);
      try {
        tmp.exec("PRAGMA journal_mode = DELETE;");
      } finally {
        tmp.close();
      }
    }
    fs.rmSync(wal, { force: true });
    fs.rmSync(shm, { force: true });
  } catch {
    /* le fichier sera simplement rouvert tel quel */
  }
}

export const db = await openDatabase(path.join(DATA_DIR, "ajmi.db"));

/** Ferme la base — utile aux scripts qui se terminent (création d'admin). */
export function closeDb() {
  try {
    db.close?.();
  } catch {
    /* déjà fermée */
  }
}

db.exec(`
  create table if not exists users (
    id         integer primary key autoincrement,
    nom        text not null,
    email      text not null unique,
    password   text not null,
    created_at text not null default (datetime('now'))
  );

  create table if not exists content (
    id         integer primary key check (id = 1),
    data       text not null,
    updated_at text not null default (datetime('now'))
  );

  create table if not exists history (
    id         integer primary key autoincrement,
    data       text not null,
    author     text,
    created_at text not null default (datetime('now'))
  );

  create table if not exists messages (
    id         integer primary key autoincrement,
    nom        text not null,
    email      text not null,
    telephone  text,
    competence text,
    message    text not null,
    lu         integer not null default 0,
    ip         text,
    created_at text not null default (datetime('now'))
  );
  create index if not exists idx_messages_date on messages(created_at desc);

  create table if not exists media (
    id         integer primary key autoincrement,
    name       text not null unique,
    taille     integer,
    created_at text not null default (datetime('now'))
  );
`);

/* --------- Migration depuis l'ancien stockage JSON (une seule fois) -------- */
(function migrate() {
  const flag = path.join(DATA_DIR, ".migrated");
  if (fs.existsSync(flag)) return;
  const grab = (n) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${n}.json`), "utf8"));
    } catch {
      return null;
    }
  };
  const users = grab("users");
  if (Array.isArray(users))
    for (const u of users)
      db.prepare("insert or ignore into users (nom, email, password) values (?, ?, ?)").run(u.nom ?? "Admin", u.email, u.password);
  const content = grab("content");
  if (content) db.prepare("insert or replace into content (id, data) values (1, ?)").run(JSON.stringify(content));
  const messages = grab("messages");
  if (Array.isArray(messages))
    for (const m of messages)
      db.prepare(
        "insert into messages (nom, email, telephone, competence, message, lu, created_at) values (?,?,?,?,?,?,?)",
      ).run(m.nom, m.email, m.telephone ?? "", m.competence ?? "", m.message, m.lu ? 1 : 0, m.created_at ?? new Date().toISOString());
  fs.writeFileSync(flag, new Date().toISOString());
})();

/* --------------------------------- Users --------------------------------- */

export const Users = {
  count: () => db.prepare("select count(*) c from users").get().c,
  byEmail: (email) => db.prepare("select * from users where lower(email) = lower(?)").get(email),
  create: (nom, email, password) =>
    db
      .prepare("insert or replace into users (nom, email, password) values (?, ?, ?)")
      .run(nom, email.toLowerCase(), hashPassword(password)),
  setPassword: (email, password) =>
    db.prepare("update users set password = ? where email = ?").run(hashPassword(password), email),
};

/* -------------------------------- Contenu -------------------------------- */

export const ContentStore = {
  get() {
    const r = db.prepare("select data from content where id = 1").get();
    return r ? JSON.parse(r.data) : null;
  },
  set(data, author) {
    const json = JSON.stringify(data);
    db.prepare(
      "insert into content (id, data, updated_at) values (1, ?, datetime('now')) on conflict(id) do update set data = excluded.data, updated_at = excluded.updated_at",
    ).run(json);
    db.prepare("insert into history (data, author) values (?, ?)").run(json, author ?? null);
    db.prepare("delete from history where id not in (select id from history order by id desc limit 20)").run();
  },
  history: () => db.prepare("select id, author, created_at from history order by id desc").all(),
  version(id) {
    const r = db.prepare("select data from history where id = ?").get(id);
    return r ? JSON.parse(r.data) : null;
  },
};

/* -------------------------------- Messages -------------------------------- */

export const Messages = {
  add: (m, ip) =>
    db
      .prepare("insert into messages (nom, email, telephone, competence, message, ip) values (?,?,?,?,?,?)")
      .run(m.nom, m.email, m.telephone ?? "", m.competence ?? "", m.message, ip),
  all: () => db.prepare("select * from messages order by created_at desc").all().map((m) => ({ ...m, lu: !!m.lu })),
  unread: () => db.prepare("select count(*) c from messages where lu = 0").get().c,
  setRead: (id, lu) => db.prepare("update messages set lu = ? where id = ?").run(lu ? 1 : 0, id),
  remove: (id) => db.prepare("delete from messages where id = ?").run(id),
};

/* --------------------------------- Médias --------------------------------- */

export const Media = {
  add: (name, taille) => db.prepare("insert or replace into media (name, taille) values (?, ?)").run(name, taille),
  all: () => db.prepare("select * from media order by created_at desc").all(),
  remove: (name) => db.prepare("delete from media where name = ?").run(name),
};

/* ------------------------------ Statistiques ------------------------------ */

export const Stats = () => ({
  messages: db.prepare("select count(*) c from messages").get().c,
  nonLus: Messages.unread(),
  medias: db.prepare("select count(*) c from media").get().c,
  versions: db.prepare("select count(*) c from history").get().c,
  derniereMaj: db.prepare("select updated_at from content where id = 1").get()?.updated_at ?? null,
});
