import { useEffect, useState } from "react";
import { ADMIN_PASSWORD } from "../store";
import { isOnline, login, ping } from "../backend";

export function Login({ onOk }: { onOk: () => void }) {
  const [online, setOnline] = useState(isOnline());
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void ping().then(setOnline);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!online) {
      if (pwd === ADMIN_PASSWORD) {
        sessionStorage.setItem("ajmi-admin", "1");
        onOk();
      } else {
        setErr("Mot de passe incorrect.");
      }
      return;
    }
    setBusy(true);
    const { error } = await login(email, pwd);
    setBusy(false);
    if (error) setErr(error);
    else onOk();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ece9e2] px-4 sm:px-6 py-8 sm:py-12 text-[#1e2766]">
      <div className="w-full max-w-md space-y-6">
        {/* En-tête marque */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#1e2766] text-xl sm:text-2xl font-bold text-[#ece9e2] shadow-lg">
            A<span className="text-[#aeb9ec]">.</span>
          </div>
          <p className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[#2e3d91]">
            Espace Sécurisé d'Administration
          </p>
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#1e2766]">Cabinet Ajmi</h1>
        </div>

        {/* Carte de connexion */}
        <form
          onSubmit={submit}
          className="rounded-2xl sm:rounded-3xl border border-[#dcd8cb] bg-white p-5 sm:p-8 shadow-xl transition-all"
        >
          <div className="mb-5 sm:mb-6 flex items-center justify-between border-b border-[#dcd8cb] pb-4">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium uppercase tracking-wider text-[#1e2766]/70">
              <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {online ? "Serveur en ligne" : "Mode autonome"}
            </div>
            <span className="rounded-full bg-[#1e2766]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#1e2766]">
              v2.0
            </span>
          </div>

          {err && (
            <div className="mb-5 sm:mb-6 rounded-xl border border-red-200 bg-red-50 p-3 sm:p-3.5 text-xs text-red-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{err}</span>
            </div>
          )}

          <div className="space-y-4">
            {online && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1e2766]/70 mb-1 font-medium">
                  Identifiant Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact.anouarajmi@gmail.com"
                  className="w-full rounded-xl border border-[#dcd8cb] bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 text-base sm:text-sm text-[#1e2766] outline-none transition focus:border-[#2e3d91] focus:ring-1 focus:ring-[#2e3d91]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1e2766]/70 mb-1 font-medium">
                Mot de passe administrateur
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#dcd8cb] bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 pr-16 sm:pr-20 text-base sm:text-sm text-[#1e2766] outline-none transition focus:border-[#2e3d91] focus:ring-1 focus:ring-[#2e3d91]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-2.5 sm:top-3 text-xs text-[#1e2766]/60 hover:text-[#1e2766] font-medium py-1 px-1.5"
                >
                  {showPwd ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-[#2e3d91] py-3.5 text-xs font-semibold uppercase tracking-widest text-[#ece9e2] transition hover:bg-[#1e2766] shadow-md disabled:opacity-50 text-center"
            >
              {busy ? "Authentification en cours..." : "Accéder à l'Administration"}
            </button>
          </div>

          <div className="mt-6 sm:mt-8 border-t border-[#dcd8cb] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] sm:text-[11px] uppercase tracking-wider text-[#1e2766]/60 text-center sm:text-left">
            <a href="#/" className="hover:text-[#2e3d91] transition flex items-center justify-center sm:justify-start gap-1">
              ← Retour au site
            </a>
            <a href="#/admin/setup" className="hover:text-[#2e3d91] transition">
              Configuration Serveur
            </a>
          </div>
        </form>

        <p className="text-center text-[10px] uppercase tracking-widest text-[#1e2766]/40 px-2">
          Accès restreint au personnel autorisé — Cabinet d'Avocat Me Ajmi
        </p>
      </div>
    </div>
  );
}
