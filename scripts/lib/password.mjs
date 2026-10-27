import crypto from "node:crypto";

/**
 * Empreinte de mot de passe au format attendu par le Worker :
 *   pbkdf2$<itérations>$<sel base64url>$<empreinte base64url>
 *
 * Node (pbkdf2Sync) et le Web Crypto du Worker produisent exactement les
 * mêmes octets pour les mêmes paramètres : un compte créé ici peut donc se
 * connecter sur le site déployé.
 */
export function hashPassword(password, iterations = 25000) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(String(password), salt, iterations, 64, "sha256");
  return `pbkdf2$${iterations}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function randomSecret(bytes = 48) {
  return crypto.randomBytes(bytes).toString("hex");
}

/** Code de réservation au même format que le Worker. */
export function reservationCode() {
  return `RÉSER-#${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
