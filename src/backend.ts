import type { Content } from "./store";

/* ------------------------------------------------------------------
   Client de l'API du Cabinet Ajmi (serveur Node maison).
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
    const parsed = txt ? JSON.parse(txt) : null;
    if (!r.ok) return { error: parsed?.error || `Erreur ${r.status}` };
    return { data: parsed as T };
  } catch {
    return { error: "Serveur injoignable" };
  }
}

/* ----------------------------- Disponibilité ---------------------------- */

let online: boolean | null = null;

export async function ping(): Promise<boolean> {
  const { data } = await call<{ ok: boolean }>("/health");
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
  return call("/messages", { method: "POST", body: JSON.stringify(m) });
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
  id: `RÉSER-#${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
  created_at: new Date().toISOString(),
  statut: "en_attente",
});

export async function createReservation(resData: Omit<Reservation, "id" | "created_at" | "statut">): Promise<{ reservation: Reservation; error?: string }> {
  if (isOnline()) {
    // Le serveur attribue lui-même la référence (unique, visible par le cabinet).
    const { data } = await call<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(resData),
    });
    if (data) {
      saveLocalReservation(data);
      return { reservation: data };
    }
  }

  // Hors ligne : la demande reste dans le navigateur et part en copie locale.
  const newRes = localReservation(resData);
  saveLocalReservation(newRes);
  return { reservation: newRes };
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
