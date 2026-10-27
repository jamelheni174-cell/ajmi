/* ------------------------------------------------------------------
   Utilitaires du Worker : réponses JSON, mots de passe (PBKDF2),
   jetons JWT (HS256), limitation de débit.
   Même contrat que server/lib.js, en Web Crypto (compatible Workers).
------------------------------------------------------------------- */

const enc = new TextEncoder();

export const HEADERS_CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
  "access-control-max-age": "86400",
};

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...HEADERS_CORS,
      ...headers,
    },
  });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------ Base64url ------------------------------ */

export function b64url(value) {
  const bytes = typeof value === "string" ? enc.encode(value) : new Uint8Array(value);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64url(text) {
  const b64 = String(text).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ----------------------------- Mots de passe ----------------------------
   Format stocké : pbkdf2$<itérations>$<sel b64url>$<empreinte b64url>
   (l'ancien serveur Node utilisait scrypt : ces empreintes ne peuvent pas
   être vérifiées ici, le compte administrateur doit être recréé/saisi.)
---------------------------------------------------------------------- */

const DEFAULT_ITERATIONS = 25000;

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 512);
  return new Uint8Array(bits);
}

export async function hashPassword(password, iterations = DEFAULT_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, iterations);
  return `pbkdf2$${iterations}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, iterations, salt, hash] = String(stored || "").split("$");
    if (scheme !== "pbkdf2") return false;
    const test = await pbkdf2(String(password), fromB64url(salt), Number(iterations));
    return timingSafeEqual(test, fromB64url(hash));
  } catch {
    return false;
  }
}

/* --------------------------------- JWT --------------------------------- */

export function jwtSecret(env) {
  const secret = env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new HttpError(500, "JWT_SECRET manquant : lancez « npm run cf:setup ».");
  }
  return secret;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createToken(payload, secret, days = 7) {
  const body = { ...payload, exp: Date.now() + days * 86400000 };
  const data = `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64url(JSON.stringify(body))}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyToken(token, secret) {
  if (!token) return null;
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;
  try {
    const data = `${parts[0]}.${parts[1]}`;
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify("HMAC", key, fromB64url(parts[2]), enc.encode(data));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ------------------------- Limitation de débit -------------------------
   En mémoire, par instance du Worker : suffisant pour freiner les robots
   et les attaques par force brute. Les compteurs sont réinitialisés quand
   l'instance redémarre (comportement identique au serveur Node d'origine,
   qui repartait de zéro à chaque redémarrage du processus).
--------------------------------------------------------------------- */

const hits = new Map();

export function rateLimitPeek(key, max = 30, windowMs = 60000) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.start > windowMs) return true;
  return entry.count < max;
}

export function rateLimit(key, max = 30, windowMs = 60000) {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v.start > 600000) hits.delete(k);
  }
  const entry = hits.get(key) ?? { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count++;
  hits.set(key, entry);
  return entry.count <= max;
}

/* ------------------------- Requête / IP ------------------------- */

export const ipOf = (request) =>
  (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "?").split(",")[0].trim();

export async function readJson(request, limit = 1024 * 1024) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > limit) throw new HttpError(413, "Fichier trop volumineux (8 Mo max).");
  const buf = await request.arrayBuffer();
  if (buf.byteLength > limit) throw new HttpError(413, "Fichier trop volumineux (8 Mo max).");
  if (!buf.byteLength) return {};
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    throw new HttpError(400, "Requête invalide.");
  }
}

/* ------------------------------ Divers ------------------------------ */

export const normalizeCode = (value) => String(value || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

export const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
};

export function extname(name) {
  const i = String(name).lastIndexOf(".");
  return i === -1 ? "" : String(name).slice(i).toLowerCase();
}
