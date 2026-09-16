import { useState } from "react";
import { createReservation, type Reservation } from "../backend";
import type { PublicationItem } from "../data";
import { go } from "../router";

interface ReservationModalProps {
  publication: PublicationItem;
  onClose: () => void;
}

export function ReservationModal({ publication, onClose }: ReservationModalProps) {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [remarques, setRemarques] = useState("");

  const [loading, setLoading] = useState(false);
  const [submittedRes, setSubmittedRes] = useState<Reservation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim()) {
      setErrorMsg("Veuillez renseigner au minimum votre Nom et votre Téléphone.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createReservation({
        publication_id: publication.id,
        publication_title: publication.title,
        nom,
        telephone,
        email,
        adresse,
        quantite,
        remarques,
      });

      if (res.reservation) {
        setSubmittedRes(res.reservation);
      } else {
        setErrorMsg("Une erreur est survenue lors de l'enregistrement de votre commande.");
      }
    } catch {
      setErrorMsg("Impossible de valider la réservation pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0b0d12] p-5 sm:p-8 text-paper shadow-2xl border border-amber-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-paper/60 transition hover:text-amber-400"
          aria-label="Fermer"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {submittedRes ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl text-amber-300">Réservation Confirmée !</h3>
            <p className="mt-2 text-sm text-paper/70">
              Votre commande pour <strong>« {publication.title} »</strong> a été enregistrée avec succès.
            </p>

            <div className="my-6 rounded-xl bg-amber-500/10 p-4 border border-amber-500/30">
              <p className="text-xs uppercase tracking-widest text-amber-400">Numéro de Réservation</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-amber-200">{submittedRes.id}</p>
              <p className="mt-2 text-[11px] text-paper/50">Conservez ce numéro pour le suivi de votre livraison.</p>
            </div>

            <p className="text-xs text-paper/60">
              Le secrétariat du cabinet vous contactera au <strong>{submittedRes.telephone}</strong> pour finaliser les détails.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  go(`/suivi?code=${encodeURIComponent(submittedRes.id)}`);
                }}
                className="w-full rounded-xl bg-amber-500 px-6 py-3 font-semibold uppercase tracking-wider text-black transition hover:bg-amber-400"
              >
                Suivre ma commande en ligne ➔
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-white/20 px-6 py-2.5 text-xs uppercase tracking-wider text-paper/70 hover:bg-white/10"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400">
                Commande d'Ouvrage
              </span>
              <h3 className="font-serif text-2xl text-paper mt-1">{publication.title}</h3>
              {publication.price && (
                <p className="mt-1 text-sm font-semibold text-amber-400">{publication.price}</p>
              )}
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-lg bg-red-950/60 p-3 text-xs text-red-300 border border-red-500/30">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-paper/70 mb-1">
                  Nom &amp; Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex: Dr. Mohamed Mansour"
                  className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-paper border border-white/10 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-paper/70 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+216 98 000 000"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-paper border border-white/10 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-paper/70 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="adresse@exemple.com"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-paper border border-white/10 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-paper/70 mb-1">
                    Adresse de livraison
                  </label>
                  <input
                    type="text"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    placeholder="Ville, Rue, Code Postal"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-paper border border-white/10 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-paper/70 mb-1">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={quantite}
                    onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-paper border border-white/10 focus:border-amber-400 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-paper/70 mb-1">
                  Remarques / Instructions (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={remarques}
                  onChange={(e) => setRemarques(e.target.value)}
                  placeholder="Dedicasse souhaitée, précision de livraison..."
                  className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-paper border border-white/10 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-amber-500 py-3.5 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-amber-400 disabled:opacity-50"
              >
                {loading ? "Enregistrement en cours..." : "Confirmer la Réservation"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
