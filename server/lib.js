import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export function ensureDirs() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* ------------------------- Petite base JSON ------------------------- */

function file(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

export function read(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file(name), "utf8"));
  } catch {
    return fallback;
  }
}

export function write(name, value) {
  ensureDirs();
  const tmp = `${file(name)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file(name)); // écriture atomique
}

/* --------------------------- Mots de passe --------------------------- */

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(":");
    const test = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
  } catch {
    return false;
  }
}

/* ------------------------------- JWT -------------------------------- */

const SECRET =
  process.env.JWT_SECRET ||
  (() => {
    const p = path.join(DATA_DIR, ".secret");
    try {
      return fs.readFileSync(p, "utf8");
    } catch {
      ensureDirs();
      const s = crypto.randomBytes(48).toString("hex");
      fs.writeFileSync(p, s);
      return s;
    }
  })();

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (data) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

export function createToken(payload, days = 7) {
  const body = { ...payload, exp: Date.now() + days * 86400000 };
  const data = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(body)}`;
  return `${data}.${sign(data)}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const expected = sign(data);
  if (expected.length !== parts[2].length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]))) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* -------------------- Limitation de débit simple -------------------- */

const hits = new Map();

export function rateLimit(ip, max = 30, windowMs = 60000) {
  const now = Date.now();
  const entry = hits.get(ip) ?? { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count++;
  hits.set(ip, entry);
  return entry.count <= max;
}
