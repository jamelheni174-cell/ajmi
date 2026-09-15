import { useEffect, useState } from "react";
import {
  deleteReservationApi,
  fetchReservations,
  updateReservationStatus,
  type Reservation,
  type ReservationStatus,
} from "../backend";
import { Btn, Card } from "./ui";

const STATUT_BADGES: Record<ReservationStatus, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-amber-100 text-amber-900 border-amber-300" },
  confirmee: { label: "Confirmée", cls: "bg-blue-100 text-blue-900 border-blue-300" },
  livree: { label: "Livrée", cls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  annulee: { label: "Annulée", cls: "bg-red-100 text-red-900 border-red-300" },
};

function RefreshIcon() {
  return (
    <svg className="h-3.5 w-3.5 inline-block mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export function ReservationsAdmin() {
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    const data = await fetchReservations();
    setList(data);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleStatusChange = async (id: string, newStatut: ReservationStatus) => {
    const updated = await updateReservationStatus(id, newStatut);
    setList(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous supprimer définitivement cette réservation ?")) return;
    const updated = await deleteReservationApi(id);
    setList(updated);
  };

  const filtered = list.filter((r) => {
    if (filterStatut !== "all" && r.statut !== filterStatut) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.nom.toLowerCase().includes(q) ||
        r.telephone.toLowerCase().includes(q) ||
        r.publication_title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = list.filter((r) => r.statut === "en_attente").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#2e3d91]">
            Suivi des Commandes d'Ouvrages
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1e2766]">Tableau de Bord des Réservations</h2>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="rounded-full bg-[#2e3d91] px-4 py-1 text-xs font-bold text-[#ece9e2] shadow-md">
              {pendingCount} commande{pendingCount > 1 ? "s" : ""} en attente
            </span>
          )}
          <Btn onClick={refresh} variant="ghost">
            <RefreshIcon /> Rafraîchir
          </Btn>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {["all", "en_attente", "confirmee", "livree", "annulee"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatut(st)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  filterStatut === st
                    ? "bg-[#1e2766] text-[#ece9e2] shadow-md"
                    : "bg-[#ece9e2]/50 text-[#1e2766]/70 hover:bg-[#ece9e2] hover:text-[#1e2766]"
                }`}
              >
                {st === "all" ? `Toutes (${list.length})` : STATUT_BADGES[st as ReservationStatus]?.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Rechercher nom, tél, réf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-[#dcd8cb] bg-white px-4 py-2 text-xs text-[#1e2766] outline-none focus:border-[#2e3d91]"
          />
        </div>
      </Card>

      {/* Liste des réservations */}
      {loading ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1e2766]/50 text-center py-8">Chargement des réservations...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-[#1e2766]/60 font-serif italic">
            Aucune réservation enregistrée.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((res) => {
            const badge = STATUT_BADGES[res.statut] || STATUT_BADGES.en_attente;
            return (
              <Card key={res.id}>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-base font-bold text-[#2e3d91] bg-[#ece9e2] px-3 py-1 rounded-lg">
                        {res.id}
                      </span>
                      <span className={`rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-[#1e2766]/50 font-mono">
                        {new Date(res.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#1e2766]">{res.publication_title}</h3>
                    <p className="text-xs font-semibold text-[#2e3d91]">
                      Quantité commandée : <span className="text-[#1e2766]">{res.quantite} exemplaire(s)</span>
                    </p>

                    <div className="mt-4 rounded-xl bg-[#ece9e2]/50 p-4 space-y-2 text-xs text-[#1e2766] border border-[#dcd8cb]">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <p>
                          <strong className="text-[#1e2766]">Client :</strong> {res.nom}
                        </p>
                        <p>
                          <strong className="text-[#1e2766]">Téléphone :</strong>{" "}
                          <a href={`tel:${res.telephone}`} className="text-[#2e3d91] font-mono font-bold underline hover:text-[#1e2766]">
                            {res.telephone}
                          </a>
                        </p>
                      </div>

                      {res.email && (
                        <p>
                          <strong className="text-[#1e2766]">Email :</strong> {res.email}
                        </p>
                      )}
                      {res.adresse && (
                        <p>
                          <strong className="text-[#1e2766]">Adresse :</strong> {res.adresse}
                        </p>
                      )}
                      {res.remarques && (
                        <p className="italic text-[#1e2766]/80 border-t border-[#dcd8cb] pt-2 mt-2">
                          « {res.remarques} »
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Statut */}
                  <div className="flex flex-col items-end gap-3 min-w-[200px]">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#1e2766]/60">Changer l'état</label>
                    <select
                      value={res.statut}
                      onChange={(e) => handleStatusChange(res.id, e.target.value as ReservationStatus)}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-[#1e2766] border border-[#dcd8cb] focus:border-[#2e3d91] focus:ring-1 focus:ring-[#2e3d91] shadow-sm cursor-pointer outline-none transition"
                    >
                      <option value="en_attente" className="py-2 font-semibold text-[#1e2766]">En attente</option>
                      <option value="confirmee" className="py-2 font-semibold text-[#2e3d91]">✓ Confirmée</option>
                      <option value="livree" className="py-2 font-semibold text-emerald-800">✓ Livrée</option>
                      <option value="annulee" className="py-2 font-semibold text-red-700">✕ Annulée</option>
                    </select>

                    <Btn variant="danger" onClick={() => handleDelete(res.id)}>
                      Supprimer
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
