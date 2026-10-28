-- ---------------------------------------------------------------------
--  Cabinet Ajmi — schéma SQLite (hébergement mutualisé, aucune config)
--  Appliqué par install.php
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nom        TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  data       TEXT NOT NULL,
  author     TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nom        TEXT NOT NULL,
  email      TEXT NOT NULL,
  telephone  TEXT,
  competence TEXT,
  message    TEXT NOT NULL,
  lu         INTEGER NOT NULL DEFAULT 0,
  ip         TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(created_at DESC);

CREATE TABLE IF NOT EXISTS media (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  taille     INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id                TEXT PRIMARY KEY,
  code_norm         TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  publication_id    TEXT NOT NULL DEFAULT '',
  publication_title TEXT NOT NULL DEFAULT '',
  nom               TEXT NOT NULL,
  telephone         TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL DEFAULT '',
  adresse           TEXT NOT NULL DEFAULT '',
  quantite          INTEGER NOT NULL DEFAULT 1,
  remarques         TEXT DEFAULT '',
  statut            TEXT NOT NULL DEFAULT 'en_attente',
  ip                TEXT
);
CREATE INDEX IF NOT EXISTS idx_reservations_code ON reservations(code_norm);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(created_at DESC);
