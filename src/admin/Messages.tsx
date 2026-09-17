import { useEffect, useState } from "react";
import { deleteMessage, fetchMessages, markRead, type Message } from "../backend";
import { Btn, Card } from "./ui";

export function Messages() {
  const [list, setList] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"tous" | "non-lus">("tous");

  const load = async () => {
    setLoading(true);
    setList(await fetchMessages());
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const shown = filter === "tous" ? list : list.filter((m) => !m.lu);
  const nonLus = list.filter((m) => !m.lu).length;

  if (loading) return <Card><p className="text-xs sm:text-sm text-ink/60 text-center py-6">Chargement des messages…</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm">
            <strong>{list.length}</strong> message(s) · <span className="text-navy font-semibold">{nonLus} non lu(s)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => setFilter(filter === "tous" ? "non-lus" : "tous")}>
              {filter === "tous" ? "Voir les non-lus" : "Voir tous"}
            </Btn>
            <Btn onClick={load}>Actualiser</Btn>
          </div>
        </div>
      </Card>

      {shown.length === 0 && <Card><p className="text-xs sm:text-sm text-ink/60 text-center py-6">Aucun message pour le moment.</p></Card>}

      {shown.map((m) => (
        <Card key={m.id}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <p className="font-serif text-lg sm:text-xl font-bold">
                {m.nom} {!m.lu && <span className="ml-2 rounded-full bg-navy px-2 py-0.5 align-middle text-[9px] uppercase tracking-[0.2em] text-white">Nouveau</span>}
              </p>
              <p className="mt-1 text-xs text-ink/60">
                {m.created_at ? new Date(m.created_at).toLocaleString("fr-FR") : ""} · {m.competence || "—"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <a href={`mailto:${m.email}`} className="rounded-xl border border-stone px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] hover:bg-stone/40 font-semibold transition">
                Répondre
              </a>
              <Btn onClick={async () => { await markRead(m.id!, !m.lu); void load(); }}>{m.lu ? "Non lu" : "Marquer lu"}</Btn>
              <Btn variant="danger" onClick={async () => { if (confirm("Supprimer ce message ?")) { await deleteMessage(m.id!); void load(); } }}>Supprimer</Btn>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 grid gap-1 text-xs sm:text-sm text-ink/75">
            <p className="break-all"><span className="text-ink/45 font-medium">Email :</span> {m.email}</p>
            <p><span className="text-ink/45 font-medium">Téléphone :</span> {m.telephone || "—"}</p>
          </div>
          <p className="mt-3 sm:mt-4 whitespace-pre-wrap rounded-xl bg-stone/30 p-3 sm:p-4 text-xs sm:text-sm leading-relaxed">{m.message}</p>
        </Card>
      ))}
    </div>
  );
}
