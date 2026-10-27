/* ------------------------------------------------------------------
   Cabinet Ajmi — API et site, en un seul Worker Cloudflare.

   • /api/*      → cette fonction (D1 pour les données, R2 pour les images)
   • /uploads/*  → images téléversées, servies depuis R2
   • le reste    → fichiers du site (dist/), servis par le réseau Cloudflare

   Portage fidèle de server/index.js ; seules les réservations d'ouvrages,
   jusque-là stockées dans le navigateur, passent en base (D1) pour être
   visibles par le cabinet et suivies par les clients.
------------------------------------------------------------------- */

import { createDb } from "./db.js";
import {
  HEADERS_CORS, HttpError, createToken, extname, hashPassword, ipOf, json,
  jwtSecret, MIME, normalizeCode, rateLimit, rateLimitPeek, readJson, verifyPassword, verifyToken,
} from "./lib.js";

const MAX_UPLOAD = 8 * 1024 * 1024; // 8 Mo
const STATUTS = new Set(["en_attente", "confirmee", "livree", "annulee"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS_CORS });

    try {
      if (path.startsWith("/api/")) return await api(request, env, path);
      if (path.startsWith("/uploads/")) return await uploaded(request, env, path);
      return await env.ASSETS.fetch(request);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error("Erreur inattendue :", error);
      return json({ error: "Erreur interne du serveur." }, 500);
    }
  },
};

/* --------------------------------- API --------------------------------- */

async function api(request, env, path) {
  const ip = ipOf(request);
  if (!rateLimit(`ip:${ip}`, 120)) return json({ error: "Trop de requêtes, réessayez dans une minute." }, 429);

  const { users, content, messages, media, reservations, stats } = createDb(env);
  const secret = jwtSecret(env);

  const auth = async () => {
    const header = request.headers.get("authorization") || "";
    return verifyToken(header.replace(/^Bearer /i, ""), secret);
  };

  /* ------------------------------- Santé ------------------------------- */
  if (path === "/api/health") return json({ ok: true, version: 1 });

  /* ------------------------------ Connexion ---------------------------- */
  if (path === "/api/login" && request.method === "POST") {
    const key = `login:${ip}`;
    if (!rateLimitPeek(key, 8, 300000)) return json({ error: "Trop de tentatives. Réessayez dans 5 minutes." }, 429);

    const { email, password } = await readJson(request, 4096);
    const user = await users.byEmail(String(email || ""));
    if (!user || !(await verifyPassword(String(password || ""), user.password))) {
      rateLimit(key, 8, 300000); // seuls les échecs consomment le quota
      return json({ error: "Identifiants incorrects." }, 401);
    }
    const token = await createToken({ sub: user.email, nom: user.nom }, secret);
    return json({ token, user: { email: user.email, nom: user.nom } });
  }

  /* ------------------------------- Profil ------------------------------ */
  if (path === "/api/me") {
    const me = await auth();
    return me ? json({ user: { email: me.sub, nom: me.nom } }) : json({ error: "Non authentifié" }, 401);
  }

  if (path === "/api/password" && request.method === "POST") {
    const me = await auth();
    if (!me) return json({ error: "Non authentifié" }, 401);

    const { ancien, nouveau } = await readJson(request, 4096);
    if (String(nouveau || "").length < 8) return json({ error: "8 caractères minimum." }, 400);

    const user = await users.byEmail(me.sub);
    if (!user || !(await verifyPassword(String(ancien || ""), user.password))) {
      return json({ error: "Ancien mot de passe incorrect." }, 400);
    }
    await users.setPassword(user.email, await hashPassword(String(nouveau), iterations(env)));
    return json({ ok: true });
  }

  /* ------------------------------- Contenu ----------------------------- */
  if (path === "/api/content") {
    if (request.method === "GET") return json(await content.get());
    if (request.method === "PUT") {
      const me = await auth();
      if (!me) return json({ error: "Non authentifié" }, 401);
      await content.set(await readJson(request, 4 * 1024 * 1024), me.sub);
      return json({ ok: true });
    }
  }

  if (path === "/api/history" && request.method === "GET") {
    if (!(await auth())) return json({ error: "Non authentifié" }, 401);
    const rows = await content.history();
    return json(rows.map((h) => ({ i: h.id, at: h.created_at, par: h.author })));
  }

  if (path.startsWith("/api/history/") && request.method === "GET") {
    if (!(await auth())) return json({ error: "Non authentifié" }, 401);
    const version = await content.version(Number(path.split("/")[3]));
    return version ? json(version) : json({ error: "Version introuvable" }, 404);
  }

  if (path === "/api/stats" && request.method === "GET") {
    if (!(await auth())) return json({ error: "Non authentifié" }, 401);
    return json(await stats());
  }

  if (path === "/api/export" && request.method === "GET") {
    if (!(await auth())) return json({ error: "Non authentifié" }, 401);
    return json({
      content: await content.get(),
      messages: await messages.all(),
      reservations: await reservations.all(),
      stats: await stats(),
    });
  }

  /* ------------------------------- Messages ---------------------------- */
  if (path === "/api/messages") {
    if (request.method === "POST") {
      if (!rateLimit(`msg:${ip}`, 5, 600000)) return json({ error: "Trop d'envois. Réessayez plus tard." }, 429);
      const m = await readJson(request, 64 * 1024);
      if (!m.nom || !m.email || !m.message) return json({ error: "Champs obligatoires manquants." }, 400);
      if (m.piege) return json({ ok: true }); // pot de miel anti-robot
      await messages.add(
        {
          nom: String(m.nom).slice(0, 120),
          email: String(m.email).slice(0, 160),
          telephone: String(m.telephone || "").slice(0, 60),
          competence: String(m.competence || "").slice(0, 120),
          message: String(m.message).slice(0, 5000),
        },
        ip,
      );
      return json({ ok: true }, 201);
    }
    if (request.method === "GET") {
      if (!(await auth())) return json({ error: "Non authentifié" }, 401);
      return json(await messages.all());
    }
  }

  if (path.startsWith("/api/messages/")) {
    if (!(await auth())) return json({ error: "Non authentifié" }, 401);
    const id = Number(path.split("/")[3]);
    if (request.method === "PUT") {
      const { lu } = await readJson(request, 4096);
      await messages.setRead(id, !!lu);
      return json({ ok: true });
    }
    if (request.method === "DELETE") {
      await messages.remove(id);
      return json({ ok: true });
    }
  }

  /* -------------------------------- Médias ----------------------------- */
  if (path === "/api/media") {
    if (request.method === "GET") {
      const rows = await media.all();
      return json(rows.map((m) => ({ name: m.name, url: `/uploads/${m.name}`, taille: m.taille })));
    }
    if (request.method === "POST") {
      if (!(await auth())) return json({ error: "Non authentifié" }, 401);
      const { name, dataUrl } = await readJson(request, Math.ceil((MAX_UPLOAD * 4) / 3) + 4096);
      const match = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(dataUrl || "");
      if (!match) return json({ error: "Format d'image non supporté." }, 400);

      const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[match[1]];
      const safe = `${Date.now()}-${String(name || "image")
        .replace(/[^a-z0-9._-]/gi, "_")
        .replace(/\.[^.]*$/, "")}${ext}`;
      const bytes = Uint8Array.from(atob(match[3]), (c) => c.charCodeAt(0));
      if (bytes.byteLength > MAX_UPLOAD) return json({ error: "Fichier trop volumineux (8 Mo max)." }, 413);

      await env.MEDIA.put(`uploads/${safe}`, bytes, { httpMetadata: { contentType: match[1] } });
      await media.add(safe, bytes.byteLength);
      return json({ name: safe, url: `/uploads/${safe}` }, 201);
    }
  }

  if (path.startsWith("/api/media/") && request.method === "DELETE") {
    if (!(await auth())) return json({ error: "Non authentifié" }, 401);
    const name = decodeURIComponent(path.split("/")[3] || "").replace(/^.*[\\/]/, "");
    await env.MEDIA.delete(`uploads/${name}`);
    await media.remove(name);
    return json({ ok: true });
  }

  /* ----------------------------- Réservations -------------------------- */
  if (path === "/api/reservations") {
    if (request.method === "GET") {
      if (!(await auth())) return json({ error: "Non authentifié" }, 401);
      return json(await reservations.all());
    }
    if (request.method === "POST") {
      if (!rateLimit(`res:${ip}`, 8, 600000)) return json({ error: "Trop de demandes. Réessayez plus tard." }, 429);
      const r = await readJson(request, 32 * 1024);
      if (!r.nom || !r.publication_title) return json({ error: "Champs obligatoires manquants." }, 400);

      const id = makeCode();
      const reservation = {
        id,
        code_norm: normalizeCode(id),
        created_at: new Date().toISOString(),
        publication_id: String(r.publication_id || "").slice(0, 120),
        publication_title: String(r.publication_title).slice(0, 240),
        nom: String(r.nom).slice(0, 120),
        telephone: String(r.telephone || "").slice(0, 60),
        email: String(r.email || "").slice(0, 160),
        adresse: String(r.adresse || "").slice(0, 300),
        quantite: Math.max(1, Math.min(99, Number(r.quantite) || 1)),
        remarques: String(r.remarques || "").slice(0, 1000),
        statut: "en_attente",
        ip,
      };
      await reservations.add(reservation);
      const { code_norm, ip: _ip, ...visible } = reservation;
      return json(visible, 201);
    }
  }

  // Suivi public : un client ne voit que SA réservation, jamais toute la liste.
  if (path.startsWith("/api/reservations/track/") && request.method === "GET") {
    if (!rateLimit(`track:${ip}`, 30, 60000)) return json({ error: "Trop de recherches, patientez une minute." }, 429);
    const code = normalizeCode(decodeURIComponent(path.slice("/api/reservations/track/".length)));
    if (!code) return json({ error: "Code manquant." }, 400);

    const found = (await reservations.byCode(code)) ?? (await reservations.likeCode(code));
    if (!found) return json({ error: "Réservation introuvable." }, 404);

    // Champs utiles au client — ni email, ni adresse IP.
    return json({
      id: found.id,
      created_at: found.created_at,
      publication_id: found.publication_id,
      publication_title: found.publication_title,
      nom: found.nom,
      telephone: found.telephone,
      adresse: found.adresse,
      quantite: found.quantite,
      remarques: found.remarques,
      statut: found.statut,
    });
  }

  if (path.startsWith("/api/reservations/")) {
    if (!(await auth())) return json({ error: "Non authentifié" }, 401);
    const id = decodeURIComponent(path.slice("/api/reservations/".length));

    if (request.method === "PUT") {
      const { statut } = await readJson(request, 4096);
      if (!STATUTS.has(String(statut))) return json({ error: "Statut inconnu." }, 400);
      await reservations.setStatus(id, String(statut));
      return json({ ok: true });
    }
    if (request.method === "DELETE") {
      await reservations.remove(id);
      return json({ ok: true });
    }
  }

  return json({ error: "Route inconnue" }, 404);
}

/* ------------------------- Images téléversées ------------------------- */

async function uploaded(request, env, path) {
  const name = decodeURIComponent(path.slice("/uploads/".length)).replace(/^.*[\\/]/, "");
  if (!name) return json({ error: "Introuvable" }, 404);

  const object = await env.MEDIA.get(`uploads/${name}`);
  if (!object) return json({ error: "Introuvable" }, 404);

  const headers = {
    "content-type": object.httpMetadata?.contentType || MIME[extname(name)] || "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    etag: object.httpEtag,
    "access-control-allow-origin": "*",
  };

  if (request.method === "HEAD") return new Response(null, { headers });
  if (request.headers.get("if-none-match") === object.httpEtag) return new Response(null, { status: 304, headers });

  return new Response(object.body, { headers });
}

/* ------------------------------ Divers ------------------------------- */

function iterations(env) {
  const n = Number(env.PBKDF2_ITERATIONS);
  return Number.isFinite(n) && n >= 1000 ? n : 25000;
}

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(3));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `RÉSER-#${hex}`;
}
