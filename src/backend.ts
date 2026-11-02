import type { Content } from "./store";

/* ------------------------------------------------------------------
   Client de l'API du Cabinet Ajmi.
   L'adresse de l'API est :
     1. la variable d'environnement VITE_API_URL définie au build, sinon
     2. celle saisie dans l'espace d'administration (localStorage), sinon
     3. la même origine que le site (cas standard : l'API sert le site).
-------------------------------------------------------------------*/

const CFG_KEY = "ajmi-api-url";
const TOKEN_KEY = "ajmi-token";
const RESERVATIONS_LOCAL_KEY = "ajmi-reservations-v1";

export function getApiUrl(): string {
  const env = import.meta.env.VITE_API_URL as string | undefined;
  if (env) return env.replace(/\/$/, "");
  const saved = localStorage.getItem(CFG_KEY);
  if (saved) return saved.replace(/\/$/, "");
  return ""; // même origine
}

export function setApiUrl(url: string | null) {
  if (url) localStorage.setItem(CFG_KEY, url.replace(/\/$/, ""));
  else localStorage.removeItem(CFG_KEY);
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

/** Rend absolue une URL d'image renvoyée par l'API (/uploads/...). */
export function mediaUrl(src: string) {
  if (!src || src.startsWith("http") || src.startsWith("data:")) return src;
  if (src.startsWith("/uploads/")) return `${getApiUrl()}${src}`;
  return src;
}

type Res<T> = { data?: T; error?: string };

async function call<T>(path: string, init: RequestInit = {}): Promise<Res<T>> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...(init.headers as object) };
    const tk = getToken();
    if (tk) headers.Authorization = `Bearer ${tk}`;
    const r = await fetch(`${getApiUrl()}/api${path}`, { ...init, headers });
    const txt = await r.text();
    // InfinityFree : si le challenge anti-bot répond à la place de l'API,
    // on reçoit du HTML (aes.js) avec 200 OK — JSON.parse échoue.
    let parsed: unknown = null;
    try {
      parsed = txt ? JSON.parse(txt) : null;
    } catch {
      if (txt.includes("aes.js") || txt.includes("__test") || txt.toLowerCase().includes("<html")) {
        return { error: "Hébergeur en vérification de sécurité — réessayez dans quelques secondes." };
      }
      return { error: `Réponse invalide du serveur (${r.status})` };
    }
    if (!r.ok) return { error: (parsed as { error?: string })?.error || `Erreur ${r.status}` };
    return { data: parsed as T };
  } catch {
    return { error: "Serveur injoignable" };
  }
}

/**
 * Repli form-urlencoded : certains hébergements mutualisés (InfinityFree)
 * filtrent les POST JSON mais laissent passer le form-urlencoded.
 */
async function callFormFallback<T>(path: string, bodyObj: Record<string, unknown>): Promise<Res<T>> {
  try {
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(bodyObj)) {
      if (v !== undefined && v !== null) form.append(k, String(v));
    }
    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
    const tk = getToken();
    if (tk) headers.Authorization = `Bearer ${tk}`;
    const r = await fetch(`${getApiUrl()}/api${path}`, {
      method: "POST",
      headers,
      body: form.toString(),
    });
    const txt = await r.text();
    let parsed: unknown = null;
    try { parsed = txt ? JSON.parse(txt) : null; } catch { return { error: "Serveur injoignable" }; }
    if (!r.ok) return { error: (parsed as { error?: string })?.error || `Erreur ${r.status}` };
    return { data: parsed as T };
  } catch {
    return { error: "Serveur injoignable" };
  }
}

/* ----------------------------- Disponibilité ---------------------------- */

let online: boolean | null = null;

export async function ping(): Promise<boolean> {
  const { data, error } = await call<{ ok: boolean }>("/health");
  // Si health renvoie une page HTML de challenge, on considère le backend injoignable
  // mais on ne force pas offline définitivement : on retente au prochain ping
  if (error && error.includes("vérification de sécurité")) {
    online = false;
    return online;
  }
  online = !!data?.ok;
  return online;
}

/** Résultat du dernier ping (null tant qu'aucun test n'a eu lieu). */
export const isOnline = () => online === true;

/* --------------------------------- Auth --------------------------------- */

export async function login(email: string, password: string): Promise<{ error?: string }> {
  const { data, error } = await call<{ token: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (error) return { error };
  setToken(data!.token);
  return {};
}

export function logout() {
  setToken(null);
}

export async function me() {
  if (!getToken()) return null;
  const { data } = await call<{ user: { email: string; nom: string } }>("/me");
  return data?.user ?? null;
}

export async function changePassword(ancien: string, nouveau: string) {
  return call("/password", { method: "POST", body: JSON.stringify({ ancien, nouveau }) });
}

/* -------------------------------- Contenu -------------------------------- */

export async function fetchContent(): Promise<Content | null> {
  const { data } = await call<Content | null>("/content");
  return data ?? null;
}

export async function pushContent(c: Content) {
  return call("/content", { method: "PUT", body: JSON.stringify(c) });
}

export async function fetchHistory() {
  const { data } = await call<{ i: number; at: string }[]>("/history");
  return data ?? [];
}

export async function restoreVersion(i: number) {
  const { data } = await call<Content>(`/history/${i}`);
  return data ?? null;
}

/* -------------------------------- Messages ------------------------------- */

export type Message = {
  id: string;
  created_at: string;
  nom: string;
  email: string;
  telephone: string;
  competence: string;
  message: string;
  lu: boolean;
};

export async function sendMessage(m: Omit<Message, "id" | "created_at" | "lu">) {
  const res = await call("/messages", { method: "POST", body: JSON.stringify(m) });
  if (res.error && res.error.includes("vérification de sécurité")) {
    // repli form-urlencoded pour InfinityFree
    return callFormFallback("/messages", m as unknown as Record<string, unknown>);
  }
  return res;
}

export async function fetchMessages() {
  const { data } = await call<Message[]>("/messages");
  return data ?? [];
}

export const markRead = (id: string, lu: boolean) =>
  call(`/messages/${id}`, { method: "PUT", body: JSON.stringify({ lu }) });

export const deleteMessage = (id: string) => call(`/messages/${id}`, { method: "DELETE" });

/* ------------------------------ Réservations ----------------------------- */

export type ReservationStatus = "en_attente" | "confirmee" | "livree" | "annulee";

export type Reservation = {
  id: string;
  created_at: string;
  publication_id: string;
  publication_title: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  quantite: number;
  remarques?: string;
  statut: ReservationStatus;
};

export function getLocalReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(RESERVATIONS_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalReservation(res: Reservation) {
  const list = getLocalReservations();
  list.unshift(res);
  localStorage.setItem(RESERVATIONS_LOCAL_KEY, JSON.stringify(list));
}

export function updateLocalReservationStatus(id: string, statut: ReservationStatus) {
  const list = getLocalReservations().map((r) => (r.id === id ? { ...r, statut } : r));
  localStorage.setItem(RESERVATIONS_LOCAL_KEY, JSON.stringify(list));
  return list;
}

export function deleteLocalReservation(id: string) {
  const list = getLocalReservations().filter((r) => r.id !== id);
  localStorage.setItem(RESERVATIONS_LOCAL_KEY, JSON.stringify(list));
  return list;
}

const localReservation = (resData: Omit<Reservation, "id" | "created_at" | "statut">): Reservation => ({
  ...resData,
  id: `RES-#${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
  created_at: new Date().toISOString(),
  statut: "en_attente",
});

export async function createReservation(resData: Omit<Reservation, "id" | "created_at" | "statut">): Promise<{ reservation?: Reservation; error?: string }> {
  // Si le backend n'a jamais répondu à ping(), on considère qu'on est peut-être hors ligne,
  // mais on tente quand même l'envoi serveur avant de tomber en local.
  const wasOnline = isOnline();
  const tryServer = async (): Promise<Res<Reservation>> => {
    let res = await call<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(resData),
    });
    // InfinityFree : challenge HTML → on retente en form-urlencoded
    if (res.error && res.error.includes("vérification de sécurité")) {
      res = await callFormFallback<Reservation>("/reservations", resData as unknown as Record<string, unknown>);
    }
    return res;
  };

  if (wasOnline || online === null) {
    const { data, error } = await tryServer();
    if (data) {
      saveLocalReservation(data);
      return { reservation: data };
    }
    if (error) {
      // Erreur serveur explicite (validation, quota, etc.) → on la remonte au lieu de masquer en local
      // Seuls les erreurs réseau "Serveur injoignable" tombent en repli local
      if (error === "Serveur injoignable" || error.includes("vérification de sécurité")) {
        // Vrai hors-ligne ou challenge temporaire : on garde une copie locale pour ne pas perdre la saisie,
        // mais on signale l'erreur pour que l'utilisateur réessaie.
        // On NE renvoie pas de fausse réservation confirmée.
        return { error: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez. Votre saisie est conservée." };
      }
      return { error };
    }
  }

  // Cas vraiment hors ligne (ping a échoué précédemment) : copie locale de secours
  // L'utilisateur verra que c'est une sauvegarde locale, pas une confirmation serveur.
  const newRes = localReservation(resData);
  saveLocalReservation(newRes);
  return { reservation: newRes, error: "Mode hors ligne — réservation enregistrée localement. Elle sera visible par le cabinet une fois la connexion rétablie." };
}

/** Liste complète — réservée à l'administration (jeton requis). */
export async function fetchReservations(): Promise<Reservation[]> {
  if (isOnline()) {
    const { data } = await call<Reservation[]>("/reservations");
    if (data && Array.isArray(data)) return data;
  }
  return getLocalReservations();
}

/** Suivi public : renvoie uniquement la réservation correspondant au code. */
export async function trackReservation(code: string): Promise<Reservation | null> {
  if (isOnline()) {
    const { data } = await call<Reservation>(`/reservations/track/${encodeURIComponent(code)}`);
    if (data) return data;
    // Si le serveur répond 404, on tente aussi le cache local (cas où la réservation
    // a été faite hors ligne ou le code a une ancienne forme RÉSER-#)
  }
  const norm = (v: string) => v.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const target = norm(code);
  if (!target) return null;
  return getLocalReservations().find((r) => norm(r.id) === target || norm(r.id).includes(target)) ?? null;
}

export async function updateReservationStatus(id: string, statut: ReservationStatus) {
  if (isOnline()) {
    const { error } = await call(`/reservations/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ statut }),
    });
    if (!error) {
      updateLocalReservationStatus(id, statut);
      return fetchReservations();
    }
  }
  return updateLocalReservationStatus(id, statut);
}

export async function deleteReservationApi(id: string) {
  if (isOnline()) {
    const { error } = await call(`/reservations/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!error) {
      deleteLocalReservation(id);
      return fetchReservations();
    }
  }
  return deleteLocalReservation(id);
}

/* --------------------------------- Médias -------------------------------- */

export async function uploadImage(dataUrl: string, name: string): Promise<{ url?: string; error?: string }> {
  const { data, error } = await call<{ url: string }>("/media", {
    method: "POST",
    body: JSON.stringify({ name, dataUrl }),
  });
  return error ? { error } : { url: mediaUrl(data!.url) };
}

export async function listImages() {
  const { data } = await call<{ name: string; url: string }[]>("/media");
  return (data ?? []).map((i) => ({ ...i, url: mediaUrl(i.url) }));
}

export const deleteImage = (name: string) => call(`/media/${encodeURIComponent(name)}`, { method: "DELETE" });

/* ---------------------- Notice d'installation serveur --------------------- */

export const INSTALL_DOC = `# Déploiement — Cabinet Ajmi

## Option 1 — Cloudflare (recommandé, gratuit)

    npm install
    npx wrangler login        # une seule fois
    npm run cf:setup          # D1 + R2 + schéma + secret + admin + déploiement

Mise à jour du site   :  npm run cf:deploy
Reprise des données   :  npm run cf:import -- ./server/data
Compte administrateur :  npm run cf:admin

Le Worker sert le site (dist/), l'API (/api/*) et les images (/uploads/*).
Base D1, stockage R2, HTTPS et domaine personnalisé sont inclus dans le
plan gratuit de Cloudflare, qui autorise un usage commercial.

## Option 2 — Serveur Node (VPS, machine dédiée)

    npm install && npm run build
    cd server && npm install
    npm run admin             # nom, email, mot de passe
    npm start                 # http://localhost:4000

Voir server/README.md (systemd + Nginx) pour la mise en production.

## Variables d'environnement (Cloudflare)

    JWT_SECRET          secret de signature (posé par npm run cf:setup)
    PBKDF2_ITERATIONS   force du hachage (25 000 = plan gratuit)
`;
