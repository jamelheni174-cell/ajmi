import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {
  DATA_DIR, UPLOAD_DIR, ensureDirs,
  createToken, verifyToken, verifyPassword, rateLimit, rateLimitPeek,
} from "./lib.js";
import { ContentStore, Media, Messages, Stats, Users } from "./db.js";

const PORT = process.env.PORT || 4000;
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(process.cwd(), "..", "dist");
const MAX_UPLOAD = 8 * 1024 * 1024; // 8 Mo

ensureDirs();

/* ----------------------------- Utilitaires ----------------------------- */

const json = (res, code, data) => {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  });
  res.end(body);
};

const body = (req, limit = MAX_UPLOAD) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });

const auth = (req) => verifyToken((req.headers.authorization || "").replace(/^Bearer /, ""));
const ipOf = (req) => (req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "?").trim();

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".txt": "text/plain",
};

/* -------------------------------- Routes -------------------------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  if (req.method === "OPTIONS") return json(res, 204, {});

  try {
    /* ---------- API ---------- */
    if (p.startsWith("/api/")) {
      if (!rateLimit(ipOf(req), 120)) return json(res, 429, { error: "Trop de requêtes, réessayez dans une minute." });

      // Santé
      if (p === "/api/health") return json(res, 200, { ok: true, version: 1 });

      // Connexion
      if (p === "/api/login" && req.method === "POST") {
        const cle = `login:${ipOf(req)}`;
        if (!rateLimitPeek(cle, 8, 300000))
          return json(res, 429, { error: "Trop de tentatives. Réessayez dans 5 minutes." });
        const { email, password } = await body(req, 4096);
        const u = Users.byEmail(String(email || ""));
        if (!u || !verifyPassword(String(password || ""), u.password)) {
          rateLimit(cle, 8, 300000); // seuls les échecs consomment le quota
          return json(res, 401, { error: "Identifiants incorrects." });
        }
        return json(res, 200, { token: createToken({ sub: u.email, nom: u.nom }), user: { email: u.email, nom: u.nom } });
      }

      // Profil courant
      if (p === "/api/me") {
        const me = auth(req);
        return me ? json(res, 200, { user: { email: me.sub, nom: me.nom } }) : json(res, 401, { error: "Non authentifié" });
      }

      // Changement de mot de passe
      if (p === "/api/password" && req.method === "POST") {
        const me = auth(req);
        if (!me) return json(res, 401, { error: "Non authentifié" });
        const { ancien, nouveau } = await body(req, 4096);
        if (String(nouveau || "").length < 8) return json(res, 400, { error: "8 caractères minimum." });
        const u = Users.byEmail(me.sub);
        if (!u || !verifyPassword(String(ancien || ""), u.password))
          return json(res, 400, { error: "Ancien mot de passe incorrect." });
        Users.setPassword(u.email, String(nouveau));
        return json(res, 200, { ok: true });
      }

      // Contenu du site
      if (p === "/api/content") {
        if (req.method === "GET") return json(res, 200, ContentStore.get());
        if (req.method === "PUT") {
          const me = auth(req);
          if (!me) return json(res, 401, { error: "Non authentifié" });
          ContentStore.set(await body(req), me.sub);
          return json(res, 200, { ok: true });
        }
      }

      // Historique / restauration
      if (p === "/api/history" && req.method === "GET") {
        if (!auth(req)) return json(res, 401, { error: "Non authentifié" });
        return json(res, 200, ContentStore.history().map((h) => ({ i: h.id, at: h.created_at, par: h.author })));
      }
      if (p.startsWith("/api/history/") && req.method === "GET") {
        if (!auth(req)) return json(res, 401, { error: "Non authentifié" });
        const v = ContentStore.version(Number(p.split("/")[3]));
        return v ? json(res, 200, v) : json(res, 404, { error: "Version introuvable" });
      }

      // Tableau de bord
      if (p === "/api/stats" && req.method === "GET") {
        if (!auth(req)) return json(res, 401, { error: "Non authentifié" });
        return json(res, 200, Stats());
      }

      // Messages
      if (p === "/api/messages") {
        if (req.method === "POST") {
          if (!rateLimit(`msg:${ipOf(req)}`, 5, 600000))
            return json(res, 429, { error: "Trop d'envois. Réessayez plus tard." });
          const m = await body(req, 64 * 1024);
          if (!m.nom || !m.email || !m.message) return json(res, 400, { error: "Champs obligatoires manquants." });
          if (m.piege) return json(res, 200, { ok: true }); // pot de miel anti-robot
          Messages.add(
            {
              nom: String(m.nom).slice(0, 120),
              email: String(m.email).slice(0, 160),
              telephone: String(m.telephone || "").slice(0, 60),
              competence: String(m.competence || "").slice(0, 120),
              message: String(m.message).slice(0, 5000),
            },
            ipOf(req),
          );
          return json(res, 201, { ok: true });
        }
        if (req.method === "GET") {
          if (!auth(req)) return json(res, 401, { error: "Non authentifié" });
          return json(res, 200, Messages.all());
        }
      }
      if (p.startsWith("/api/messages/")) {
        if (!auth(req)) return json(res, 401, { error: "Non authentifié" });
        const id = Number(p.split("/")[3]);
        if (req.method === "PUT") {
          const { lu } = await body(req, 4096);
          Messages.setRead(id, !!lu);
          return json(res, 200, { ok: true });
        }
        if (req.method === "DELETE") {
          Messages.remove(id);
          return json(res, 200, { ok: true });
        }
      }

      // Médias
      if (p === "/api/media") {
        if (req.method === "GET")
          return json(res, 200, Media.all().map((m) => ({ name: m.name, url: `/uploads/${m.name}`, taille: m.taille })));
        if (req.method === "POST") {
          if (!auth(req)) return json(res, 401, { error: "Non authentifié" });
          const { name, dataUrl } = await body(req);
          const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(dataUrl || "");
          if (!m) return json(res, 400, { error: "Format d'image non supporté." });
          const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[m[1]];
          const safe = `${Date.now()}-${String(name || "image").replace(/[^a-z0-9._-]/gi, "_").replace(/\.[^.]*$/, "")}${ext}`;
          const buf = Buffer.from(m[3], "base64");
          fs.writeFileSync(path.join(UPLOAD_DIR, safe), buf);
          Media.add(safe, buf.length);
          return json(res, 201, { name: safe, url: `/uploads/${safe}` });
        }
      }
      if (p.startsWith("/api/media/") && req.method === "DELETE") {
        if (!auth(req)) return json(res, 401, { error: "Non authentifié" });
        const name = path.basename(decodeURIComponent(p.split("/")[3]));
        const f = path.join(UPLOAD_DIR, name);
        if (fs.existsSync(f)) fs.unlinkSync(f);
        Media.remove(name);
        return json(res, 200, { ok: true });
      }

      // Export complet (sauvegarde)
      if (p === "/api/export" && req.method === "GET") {
        if (!auth(req)) return json(res, 401, { error: "Non authentifié" });
        return json(res, 200, { content: ContentStore.get(), messages: Messages.all(), stats: Stats() });
      }

      return json(res, 404, { error: "Route inconnue" });
    }

    /* ---------- Fichiers téléversés ---------- */
    if (p.startsWith("/uploads/")) {
      const f = path.join(UPLOAD_DIR, path.basename(decodeURIComponent(p)));
      if (!fs.existsSync(f)) return json(res, 404, { error: "Introuvable" });
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      });
      return fs.createReadStream(f).pipe(res);
    }

    /* ---------- Site statique (SPA) ---------- */
    let file = path.join(PUBLIC_DIR, p === "/" ? "index.html" : decodeURIComponent(p));
    if (!file.startsWith(PUBLIC_DIR)) file = path.join(PUBLIC_DIR, "index.html");
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC_DIR, "index.html");
    if (!fs.existsSync(file)) return json(res, 404, { error: "Site non déployé (dossier dist absent)" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "text/plain" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    json(res, e.message === "too large" ? 413 : 400, { error: e.message === "too large" ? "Fichier trop volumineux (8 Mo max)." : "Requête invalide." });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Cabinet Ajmi — API et site`);
  console.log(`  ➜  http://localhost:${PORT}`);
  console.log(`  Données : ${DATA_DIR}`);
  console.log(`  Base    : SQLite (${DATA_DIR}/ajmi.db)`);
  if (!Users.count()) console.log(`  ⚠  Aucun administrateur : lancez « npm run admin »\n`);
  else console.log("");
});
