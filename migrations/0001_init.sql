-- Schéma du Cabinet Ajmi sur Cloudflare D1 (SQLite).
-- Appliqué par : npm run cf:setup  (ou npx wrangler d1 migrations apply cabinet-ajmi --remote)

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

-- Réservations d'ouvrages (suivi de commande).
create table if not exists reservations (
  id                text primary key,
  code_norm         text not null,
  created_at        text not null,
  publication_id    text not null default '',
  publication_title text not null default '',
  nom               text not null,
  telephone         text not null default '',
  email             text not null default '',
  adresse           text not null default '',
  quantite          integer not null default 1,
  remarques         text default '',
  statut            text not null default 'en_attente',
  ip                text
);
create index if not exists idx_reservations_code on reservations(code_norm);
create index if not exists idx_reservations_date on reservations(created_at desc);
