import { useEffect, useState } from "react";
import { fetchReservations, type Reservation, type ReservationStatus } from "../backend";
import { go } from "../router";

const STEPS: { status: ReservationStatus; label: string; desc: string }[] = [
  { status: "en_attente", label: "Demande Reçue", desc: "Votre réservation a été enregistrée avec succès." },
  { status: "confirmee", label: "Confirmée par le Cabinet", desc: "Notre équipe a validé votre commande." },
  { status: "livree", label: "Livrée / Récupérée", desc: "L'ouvrage vous a été remis ou livré." },
];

export function SuiviPage() {
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Reservation | null>(null);
  const [searched, setSearched] = useState(false);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    // Check URL query param code or hash code
    const updateFromUrl = async () => {
      const data = await fetchReservations();
      setAllReservations(data);

      const urlParams = new URLSearchParams(window.location.search);
      const queryCode = urlParams.get("code");
      const hash = window.location.hash;
      let targetCode = queryCode;

      if (!targetCode && hash.includes("code=")) {
        const parts = hash.split("code=");
        targetCode = decodeURIComponent(parts[1] || "");
      }

      if (targetCode) {
        setCode(targetCode);
        performSearch(targetCode, data);
      }
    };

    void updateFromUrl();
  }, []);

  const normalizeCode = (str: string) => str.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  const performSearch = (inputCode: string, list: Reservation[] = allReservations) => {
    setSearching(true);
    setSearched(true);

    const normInput = normalizeCode(inputCode);
    if (!normInput) {
      setResult(null);
      setSearching(false);
      return;
    }

    const found = list.find(
      (r) => normalizeCode(r.id) === normInput || normalizeCode(r.id).includes(normInput)
    );

    setResult(found || null);
    setSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(code);
  };

  const getStepIndex = (status: ReservationStatus) => {
    if (status === "en_attente") return 0;
    if (status === "confirmee") return 1;
    if (status === "livree") return 2;
    return -1; // annulee
  };

  return (
    <div className="min-h-screen bg-paper text-ink pt-24 sm:pt-32 pb-16 sm:pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Fil d'ariane */}
        <div className="mb-6 sm:mb-8 flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-widest text-ink/60">
          <button onClick={() => go("/")} className="hover:text-navy transition">
            Accueil
          </button>
          <span>/</span>
          <span className="text-navy font-semibold">Suivi de Commande</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-navy">
            Service Client &amp; E-Réservations
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ink mt-2">
            Suivi de votre Commande d'Ouvrage
          </h1>
          <p className="mt-3 sm:mt-4 max-w-lg mx-auto text-xs sm:text-sm font-light leading-relaxed text-ink/70">
            Saisissez le numéro de réservation reçu lors de votre commande (ex: <code className="font-mono bg-stone/40 px-1.5 py-0.5 rounded text-navy break-all">RÉSER-#C68F9C</code> ou simplement <code className="font-mono bg-stone/40 px-1.5 py-0.5 rounded text-navy">C68F9C</code>).
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl border border-stone/40 mb-8 sm:mb-12">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code de réservation (ex: RÉSER-#C68F9C)..."
              className="flex-1 rounded-xl sm:rounded-2xl border border-stone bg-paper/30 px-4 sm:px-5 py-3 sm:py-4 font-mono text-base text-ink outline-none transition focus:border-navy focus:bg-white"
            />
            <button
              type="submit"
              disabled={searching}
              className="w-full sm:w-auto rounded-xl sm:rounded-2xl bg-navy px-6 sm:px-8 py-3.5 sm:py-4 text-xs font-semibold uppercase tracking-widest text-paper transition hover:bg-ink shadow-md shrink-0 text-center"
            >
              {searching ? "Recherche..." : "Rechercher mon suivi ➔"}
            </button>
          </form>
        </div>

        {/* Résultats */}
        {searched && (
          <div>
            {result ? (
              <div className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-8 md:p-10 shadow-xl border border-stone/40 space-y-6 sm:space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone pb-5 sm:pb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy">
                      Référence Unique
                    </span>
                    <p className="font-mono text-2xl sm:text-3xl font-bold text-ink mt-0.5 break-all">{result.id}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase tracking-widest text-ink/50">Date de commande</span>
                    <p className="text-xs sm:text-sm font-mono text-ink/80 mt-0.5">
                      {new Date(result.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Statut Annulé spécifique */}
                {result.statut === "annulee" ? (
                  <div className="rounded-2xl bg-red-50 p-4 sm:p-6 border border-red-200 text-red-900">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✕</span>
                      <div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold">Commande Annulée</h3>
                        <p className="text-xs sm:text-sm mt-1 text-red-800">
                          Cette réservation a été annulée. N'hésitez pas à contacter le secrétariat pour toute question.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Timeline des étapes */
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-semibold text-navy mb-4 sm:mb-6">Progression de la commande</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                      {STEPS.map((step, idx) => {
                        const currentStepIdx = getStepIndex(result.statut);
                        const isDone = currentStepIdx >= idx;
                        const isCurrent = currentStepIdx === idx;

                        return (
                          <div
                            key={step.status}
                            className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-5 border transition-all ${
                              isCurrent
                                ? "bg-navy text-paper border-navy shadow-lg"
                                : isDone
                                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                                : "bg-paper/40 border-stone/50 text-ink/40"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <span
                                className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-bold ${
                                  isCurrent
                                    ? "bg-paper text-navy"
                                    : isDone
                                    ? "bg-emerald-600 text-white"
                                    : "bg-stone text-ink/50"
                                }`}
                              >
                                {isDone ? "✓" : idx + 1}
                              </span>
                              {isCurrent && (
                                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                                  En cours
                                </span>
                              )}
                            </div>
                            <h4 className="font-serif text-base sm:text-lg font-bold">{step.label}</h4>
                            <p className="text-xs mt-1 sm:mt-2 leading-relaxed opacity-80">{step.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Détails de la réservation */}
                <div className="rounded-xl sm:rounded-2xl bg-paper p-4 sm:p-6 border border-stone/30 space-y-3 sm:space-y-4">
                  <h4 className="font-serif text-base sm:text-lg font-bold text-navy">Détails de l'Ouvrage</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-ink/80">
                    <div>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-ink/50 block">Ouvrage :</span>
                      <strong className="text-ink font-serif text-sm sm:text-base">{result.publication_title}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-ink/50 block">Quantité :</span>
                      <strong>{result.quantite} exemplaire(s)</strong>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-ink/50 block">Destinataire :</span>
                      <strong>{result.nom}</strong> ({result.telephone})
                    </div>
                    {result.adresse && (
                      <div>
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-ink/50 block">Adresse :</span>
                        <strong>{result.adresse}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact assistance */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-stone text-xs text-ink/70">
                  <p>Besoin d'aide ou de modifier votre commande ?</p>
                  <button
                    onClick={() => go("/contact")}
                    className="w-full sm:w-auto text-center rounded-xl border border-ink px-5 py-2.5 font-semibold uppercase tracking-wider text-ink hover:bg-ink hover:text-paper transition"
                  >
                    Contacter le secrétariat
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl sm:rounded-3xl bg-white p-8 sm:p-12 text-center shadow-lg border border-stone/40">
                <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-stone/40 text-ink/60">
                  <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-ink">Aucune réservation trouvée</h3>
                <p className="mt-2 text-xs sm:text-sm text-ink/70 max-w-md mx-auto">
                  Le numéro <code className="font-mono bg-stone/30 px-2 py-0.5 rounded text-navy break-all">{code}</code> ne correspond à aucun dossier actif. Vérifiez l'orthographe ou contactez le cabinet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
