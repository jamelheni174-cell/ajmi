import { useEffect, useState } from "react";
import { getApiUrl, INSTALL_DOC, ping, setApiUrl } from "../backend";
import { Btn, Card, Field, inputCls } from "./ui";

export function Setup() {
  const [url, setUrl] = useState(getApiUrl());
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"?" | "ok" | "ko">("?");

  const test = async () => {
    setMsg("Test de connexion…");
    const ok = await ping();
    setState(ok ? "ok" : "ko");
    setMsg(ok ? "Serveur joignable ✓" : "Serveur injoignable. Vérifiez l'adresse et que « npm start » tourne.");
  };
  useEffect(() => { void test(); }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-stone bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-navy font-semibold">Installation</p>
            <h1 className="font-serif text-lg sm:text-xl">Serveur &amp; déploiement</h1>
          </div>
          <a href="#/admin" className="rounded-xl border border-stone px-3.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] hover:bg-stone/40 font-semibold transition">
            ← Administration
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 sm:space-y-6 px-4 sm:px-6 py-6 sm:py-10">
        <Card>
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${state === "ok" ? "bg-green-500" : state === "ko" ? "bg-red-400" : "bg-stone"}`} />
            <h2 className="font-serif text-xl sm:text-2xl">
              {state === "ok" ? "Backend connecté" : state === "ko" ? "Backend hors ligne" : "Vérification…"}
            </h2>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-ink/70 leading-relaxed">
            Le site fonctionne avec <strong>Cloudflare</strong> (recommandé : un seul tableau de bord, gratuit, sans mise en veille)
            ou avec le <strong>serveur Node.js</strong> autonome du dossier <code>server/</code> pour un VPS. Dans les deux cas,
            les données restent sur votre hébergement.
          </p>
          <div className="mt-5">
            <Field label="Adresse de l'API (vide = même serveur que le site)">
              <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://cabinet-ajmi.tn  ou  http://localhost:4000" />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn variant="primary" onClick={() => { setApiUrl(url.trim() || null); void test(); }}>Enregistrer et tester</Btn>
            <Btn onClick={test}>Tester la connexion</Btn>
          </div>
          {msg && <p className="mt-4 text-xs sm:text-sm text-navy">{msg}</p>}
        </Card>

        <Card>
          <h2 className="font-serif text-xl sm:text-2xl">Démarrage rapide</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed text-stone">{`# Cloudflare — recommandé, gratuit
npm install
npx wrangler login
npm run cf:setup        # base, images, schéma, compte admin, déploiement

# Serveur Node (VPS)
npm install && npm run build
cd server && npm install && npm run admin && npm start`}</pre>
        </Card>

        <Card>
          <h2 className="font-serif text-xl sm:text-2xl">Notice complète de déploiement</h2>
          <pre className="mt-4 max-h-80 overflow-x-auto rounded-xl bg-stone/30 p-3 sm:p-4 text-[10px] sm:text-[11px] leading-relaxed text-ink/80">{INSTALL_DOC}</pre>
          <div className="mt-4">
            <Btn onClick={() => { navigator.clipboard.writeText(INSTALL_DOC); setMsg("Notice copiée ✓"); }}>Copier la notice</Btn>
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-xl sm:text-2xl">Ce que contient le backend</h2>
          <ul className="mt-4 space-y-2 text-xs sm:text-sm leading-relaxed text-ink/75">
            <li>• <strong>Authentification</strong> : mots de passe hachés (PBKDF2 sur Cloudflare, scrypt sur serveur Node), jetons JWT signés, limitation des tentatives de connexion.</li>
            <li>• <strong>Contenu</strong> : stocké en base (D1 ou SQLite), avec historique des 20 dernières versions restaurables.</li>
            <li>• <strong>Messages</strong> : formulaire de contact enregistré en base, protection anti-robot et anti-spam.</li>
            <li>• <strong>Médias</strong> : images téléversées dans R2 (Cloudflare) ou <code>data/uploads/</code> (Node), servies avec cache long.</li>
            <li>• <strong>Réservations</strong> : enregistrées en base et suivies par le client avec son code, sans exposer les autres dossiers.</li>
            <li>• <strong>Sauvegarde</strong> : export complet en JSON depuis l'administration (<code>/api/export</code>).</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
