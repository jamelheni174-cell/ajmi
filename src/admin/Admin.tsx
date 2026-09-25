import { useEffect, useRef, useState } from "react";
import { defaultContent, resetContent, saveContent, type Content, type Photo } from "../store";
import { Btn, Card, Field, fileToDataUrl, inputCls } from "./ui";
import { fetchHistory, fetchReservations, isOnline, logout, me, ping, pushContent, restoreVersion, uploadImage } from "../backend";
import { Login } from "./Login";
import { Messages } from "./Messages";
import { Medias } from "./Medias";
import { ReservationsAdmin } from "./Reservations";
import type { GalerieItem } from "../data";

const BASE_TABS = ["Accueil", "Cabinet", "Domaines", "Compétences", "Avocat", "Parcours", "Publications", "Réservations", "Galerie", "Clients", "Contact"] as const;
const ONLINE_TABS = ["Messages", "Médiathèque"] as const;
const TABS = [...BASE_TABS, ...ONLINE_TABS] as const;
type Tab = (typeof TABS)[number];

export function Admin({ content, setContent }: { content: Content; setContent: (c: Content) => void }) {
  const [online, setOnline] = useState(isOnline());
  const [auth, setAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("Accueil");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [hist, setHist] = useState<{ i: number; at: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const up = await ping();
      setOnline(up);
      setAuth(up ? !!(await me()) : sessionStorage.getItem("ajmi-admin") === "1");
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchReservations();
        const pending = res.filter((r) => r.statut === "en_attente").length;
        setPendingReservationsCount(pending);
      } catch {
        setPendingReservationsCount(0);
      }
    })();
  }, [tab]);

  const up = (patch: Partial<Content>) => setContent({ ...content, ...patch });
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  const persist = async () => {
    saveContent(content);
    if (!online) return flash("Enregistré localement ✓");
    setSaving(true);
    const { error } = await pushContent(content);
    setSaving(false);
    flash(error ? `Erreur : ${error}` : "Publié en ligne ✓ — visible par tous les visiteurs");
  };

  if (checking)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ece9e2] text-[#1e2766] px-4">
        <p className="text-xs uppercase tracking-[0.3em] font-semibold text-center">Vérification de la session...</p>
      </div>
    );

  if (!auth) return <Login onOk={() => setAuth(true)} />;

  /* ---------- Listes génériques ---------- */
  const listCtl = <T,>(key: keyof Content, arr: T[], empty: T) => ({
    edit: (i: number, patch: Partial<T>) => {
      const copy = [...arr];
      copy[i] = { ...copy[i], ...patch };
      up({ [key]: copy } as unknown as Partial<Content>);
    },
    add: () => up({ [key]: [...arr, empty] } as unknown as Partial<Content>),
    del: (i: number) => up({ [key]: arr.filter((_, j) => j !== i) } as unknown as Partial<Content>),
    move: (i: number, dir: -1 | 1) => {
      const copy = [...arr];
      const j = i + dir;
      if (j < 0 || j >= copy.length) return;
      [copy[i], copy[j]] = [copy[j], copy[i]];
      up({ [key]: copy } as unknown as Partial<Content>);
    },
  });

  const strList = (key: "competences" | "valeurs" | "clients") => (
    <Card>
      <div className="space-y-2">
        {content[key].map((v, i) => {
          const valStr = typeof v === "string" ? v : v.name;
          return (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                value={valStr}
                onChange={(e) => {
                  const copy = [...content[key]];
                  if (typeof copy[i] === "object") {
                    (copy[i] as { name: string }).name = e.target.value;
                  } else {
                    (copy[i] as unknown as string) = e.target.value;
                  }
                  up({ [key]: copy } as Partial<Content>);
                }}
              />
              <Btn variant="danger" onClick={() => up({ [key]: content[key].filter((_, j) => j !== i) } as Partial<Content>)}>
                ✕
              </Btn>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <Btn onClick={() => up({ [key]: [...content[key], key === "clients" ? ({ name: "" } as any) : ""] } as Partial<Content>)}>
          + Ajouter
        </Btn>
      </div>
    </Card>
  );

  const dc = listCtl<Content["domaines"][0]>("domaines", content.domaines, {
    n: "06",
    title: "Nouveau domaine",
    text: "",
    items: [],
  });
  const ec = listCtl<Content["experiences"][0]>("experiences", content.experiences, { role: "", org: "" });
  const pc = listCtl<Content["publications"][0]>("publications", content.publications, { type: "Article", title: "", meta: "" });
  const gc = listCtl<Photo>("galerie", content.galerie, { src: "", legende: "", tall: false });
  const cc = listCtl<Content["chiffres"][0]>("chiffres", content.chiffres, { v: "", l: "" });

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    flash("Traitement des images…");
    const nouveaux: Photo[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await fileToDataUrl(f);
      const legende = f.name.replace(/\.[^.]+$/, "");
      if (online) {
        const { url, error } = await uploadImage(dataUrl, f.name);
        if (error) { flash(`Erreur d'envoi : ${error}`); continue; }
        nouveaux.push({ src: url!, legende, tall: false });
      } else {
        nouveaux.push({ src: dataUrl, legende, tall: false });
      }
    }
    up({ galerie: [...content.galerie, ...nouveaux] });
    flash(`${nouveaux.length} photo(s) ajoutée(s) — cliquez sur Publier`);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cabinet-ajmi-contenu.json";
    a.click();
  };

  const importJson = async (f: File | undefined) => {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      setContent({ ...defaultContent, ...parsed });
      flash("Contenu importé — pensez à enregistrer");
    } catch {
      flash("Fichier invalide");
    }
  };

  return (
    <div className="min-h-screen bg-[#ece9e2] text-[#1e2766]">
      {/* Header Institutionnel (#1e2766) */}
      <header className="sticky top-0 z-20 border-b border-[#2e3d91]/50 bg-[#1e2766] text-[#ece9e2] shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10 text-lg sm:text-xl font-serif font-bold text-white border border-white/20 shrink-0">
              A<span className="text-[#aeb9ec]">.</span>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[#aeb9ec]">
                Panneau d'Administration
              </p>
              <h1 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">Cabinet Me Mohamed Anouar Ajmi</h1>
              <p className="mt-0.5 text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[#ece9e2]/70">
                {online ? "● En ligne · synchronisé" : "○ Mode local autonome"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Btn onClick={exportJson} variant="headerGhost">
              Exporter
            </Btn>
            <Btn onClick={() => fileRef.current?.click()} variant="headerGhost">
              Importer
            </Btn>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
            <Btn
              variant="danger"
              onClick={() => {
                if (confirm("Réinitialiser tout le contenu ?")) {
                  resetContent();
                  setContent(defaultContent);
                  flash("Contenu réinitialisé");
                }
              }}
            >
              Réinitialiser
            </Btn>
            <a
              href="#/admin/setup"
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-white hover:bg-white/20 transition"
            >
              Serveur
            </a>
            <a
              href="#/"
              className="rounded-xl border border-[#aeb9ec]/40 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[#aeb9ec] hover:bg-white/20 transition"
            >
              Voir le site ↗
            </a>
            {online && (
              <Btn onClick={async () => { logout(); sessionStorage.removeItem("ajmi-admin"); setAuth(false); }} variant="headerGhost">
                Déconnexion
              </Btn>
            )}
            <Btn variant="accent" onClick={() => void persist()}>
              {saving ? "Publication…" : online ? "Publier en ligne" : "Enregistrer"}
            </Btn>
          </div>
        </div>

        {/* Barre d'onglets */}
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 pb-2.5 pt-1 border-t border-white/10 scrollbar-none touch-pan-x">
          {TABS.filter((t) => online || !ONLINE_TABS.includes(t as (typeof ONLINE_TABS)[number])).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative whitespace-nowrap rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em] transition duration-200 shrink-0 ${
                tab === t
                  ? "bg-[#2e3d91] text-white shadow-sm font-bold border border-white/20"
                  : "text-[#ece9e2]/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t}
              {t === "Réservations" && pendingReservationsCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-amber-400 text-[9px] sm:text-[10px] font-bold text-[#1e2766] shadow-sm">
                  {pendingReservationsCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 rounded-xl bg-[#1e2766] px-4 py-3 sm:px-6 sm:py-3.5 text-xs font-bold uppercase tracking-wider text-[#ece9e2] shadow-2xl border border-[#2e3d91] max-w-[90vw]">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-7xl space-y-4 sm:space-y-6 px-4 sm:px-6 py-6 sm:py-10">
        {tab === "Accueil" && (
          <>
            <Card>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1e2766] mb-4">Section En-tête (Hero)</h2>
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <Field label="Sur-titre (Kicker)">
                  <input className={inputCls} value={content.hero.kicker} onChange={(e) => up({ hero: { ...content.hero, kicker: e.target.value } })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Titre principal">
                    <input className={inputCls} value={content.hero.titre} onChange={(e) => up({ hero: { ...content.hero, titre: e.target.value } })} />
                  </Field>
                  <Field label="Titre en italique">
                    <input className={inputCls} value={content.hero.titreItalic} onChange={(e) => up({ hero: { ...content.hero, titreItalic: e.target.value } })} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Sous-titre / Accroche">
                    <textarea rows={3} className={inputCls} value={content.hero.sous} onChange={(e) => up({ hero: { ...content.hero, sous: e.target.value } })} />
                  </Field>
                </div>
              </div>
            </Card>
            {online && (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1e2766]">Historique des publications</h2>
                    <p className="mt-1 text-xs text-[#1e2766]/60">Les 10 dernières versions publiées peuvent être restaurées.</p>
                  </div>
                  <Btn onClick={async () => setHist(await fetchHistory())}>Charger l'historique</Btn>
                </div>
                {hist.length > 0 && (
                  <ul className="mt-4 divide-y divide-[#dcd8cb] border-t border-[#dcd8cb]">
                    {hist.map((h) => (
                      <li key={h.i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 text-xs sm:text-sm">
                        <span>{new Date(h.at).toLocaleString("fr-FR")}</span>
                        <Btn
                          onClick={async () => {
                            const v = await restoreVersion(h.i);
                            if (v) { setContent(v); flash("Version chargée — cliquez sur Publier pour confirmer"); }
                          }}
                        >
                          Restaurer
                        </Btn>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
            <Card>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1e2766] mb-4">Chiffres clés du cabinet</h2>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {content.chiffres.map((c, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <input className={`${inputCls} w-20 sm:w-24 font-bold text-[#2e3d91]`} value={c.v} onChange={(e) => cc.edit(i, { v: e.target.value })} />
                    <input className={inputCls} value={c.l} onChange={(e) => cc.edit(i, { l: e.target.value })} />
                    <Btn variant="danger" onClick={() => cc.del(i)}>✕</Btn>
                  </div>
                ))}
              </div>
              <div className="mt-4"><Btn onClick={cc.add}>+ Ajouter un chiffre</Btn></div>
            </Card>
          </>
        )}

        {tab === "Cabinet" && (
          <Card>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1e2766] mb-4">Présentation du Cabinet</h2>
            <div className="space-y-4">
              <Field label="Titre de section">
                <input className={inputCls} value={content.cabinet.titre} onChange={(e) => up({ cabinet: { ...content.cabinet, titre: e.target.value } })} />
              </Field>
              <Field label="Paragraphe 1">
                <textarea rows={4} className={inputCls} value={content.cabinet.p1} onChange={(e) => up({ cabinet: { ...content.cabinet, p1: e.target.value } })} />
              </Field>
              <Field label="Paragraphe 2">
                <textarea rows={4} className={inputCls} value={content.cabinet.p2} onChange={(e) => up({ cabinet: { ...content.cabinet, p2: e.target.value } })} />
              </Field>
              <Field label="Citation mise en avant">
                <textarea rows={3} className={inputCls} value={content.cabinet.citation} onChange={(e) => up({ cabinet: { ...content.cabinet, citation: e.target.value } })} />
              </Field>
            </div>
          </Card>
        )}

        {tab === "Domaines" &&
          content.domaines.map((dd, i) => (
            <Card key={i}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-serif text-base sm:text-lg font-bold text-[#1e2766]">{dd.title || "Sans titre"}</span>
                <div className="flex gap-1.5 sm:gap-2">
                  <Btn onClick={() => dc.move(i, -1)}>↑</Btn>
                  <Btn onClick={() => dc.move(i, 1)}>↓</Btn>
                  <Btn variant="danger" onClick={() => dc.del(i)}>Supprimer</Btn>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
                <Field label="N°"><input className={inputCls} value={dd.n} onChange={(e) => dc.edit(i, { n: e.target.value })} /></Field>
                <Field label="Titre du domaine"><input className={inputCls} value={dd.title} onChange={(e) => dc.edit(i, { title: e.target.value })} /></Field>
              </div>
              <div className="mt-3">
                <Field label="Description détaillée"><textarea rows={3} className={inputCls} value={dd.text} onChange={(e) => dc.edit(i, { text: e.target.value })} /></Field>
              </div>
              <div className="mt-3">
                <Field label="Sous-rubriques (une par ligne)">
                  <textarea
                    rows={4}
                    className={inputCls}
                    value={(dd.items || []).join("\n")}
                    placeholder={"Création de sociétés & startups\nDroit social\n…"}
                    onChange={(e) =>
                      dc.edit(i, {
                        items: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
              </div>
            </Card>
          ))}
        {tab === "Domaines" && <Btn onClick={dc.add}>+ Ajouter un domaine</Btn>}

        {tab === "Compétences" && strList("competences")}

        {tab === "Avocat" && (
          <Card>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1e2766] mb-4">Profil de Maître Mohamed Anouar Ajmi</h2>
            <div className="grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="max-w-[220px] mx-auto md:mx-0">
                <img src={content.avocat.portrait} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover border border-[#dcd8cb] shadow-sm" />
                <label className="mt-3 block cursor-pointer rounded-xl border border-[#dcd8cb] bg-[#ece9e2]/50 px-4 py-2.5 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1e2766] hover:bg-[#ece9e2]">
                  Changer le portrait
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const dataUrl = await fileToDataUrl(f);
                      if (online) {
                        const { url, error } = await uploadImage(dataUrl, "portrait");
                        if (error) return flash(`Erreur : ${error}`);
                        up({ avocat: { ...content.avocat, portrait: url! } });
                      } else up({ avocat: { ...content.avocat, portrait: dataUrl } });
                    }}
                  />
                </label>
              </div>
              <div className="space-y-4">
                <Field label="Nom complet"><input className={inputCls} value={content.avocat.nom} onChange={(e) => up({ avocat: { ...content.avocat, nom: e.target.value } })} /></Field>
                <Field label="Titre principal"><input className={inputCls} value={content.avocat.l1} onChange={(e) => up({ avocat: { ...content.avocat, l1: e.target.value } })} /></Field>
                <Field label="Titre secondaire"><input className={inputCls} value={content.avocat.l2} onChange={(e) => up({ avocat: { ...content.avocat, l2: e.target.value } })} /></Field>
                <Field label="Texte « Valeurs »"><textarea rows={3} className={inputCls} value={content.valeursTexte} onChange={(e) => up({ valeursTexte: e.target.value })} /></Field>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2e3d91]">Liste des valeurs</p>
                {strList("valeurs")}
              </div>
            </div>
          </Card>
        )}

        {tab === "Parcours" && (
          <>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1e2766]">Expériences &amp; Engagements</h2>
              <Btn onClick={ec.add}>+ Ajouter une expérience</Btn>
            </div>
            {content.experiences.map((ex, i) => (
              <Card key={i}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Fonction / Rôle"><input className={inputCls} value={ex.role} onChange={(e) => ec.edit(i, { role: e.target.value })} /></Field>
                  <Field label="Organisation / Institution"><input className={inputCls} value={ex.org} onChange={(e) => ec.edit(i, { org: e.target.value })} /></Field>
                </div>
                <div className="mt-3 flex gap-2">
                  <Btn onClick={() => ec.move(i, -1)}>↑ Monter</Btn>
                  <Btn onClick={() => ec.move(i, 1)}>↓ Descendre</Btn>
                  <Btn variant="danger" onClick={() => ec.del(i)}>Supprimer</Btn>
                </div>
              </Card>
            ))}
          </>
        )}

        {tab === "Publications" && (
          <>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1e2766]">Gestionnaire des Publications &amp; Ouvrages</h2>
              <Btn onClick={pc.add} variant="primary">+ Ajouter une publication</Btn>
            </div>
            {content.publications.map((p, i) => (
              <Card key={i}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#dcd8cb] pb-3">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#2e3d91]">
                    Publication #{i + 1} {p.featured ? "— [OUVRAGE EN VEDETTE]" : ""}
                  </span>
                  <label className="flex items-center gap-2 text-xs text-[#1e2766] font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!p.featured}
                      onChange={(e) => pc.edit(i, { featured: e.target.checked })}
                    />
                    Mettre en vedette (Carte d'Accueil)
                  </label>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                  <Field label="Identifiant Route (slug)">
                    <input className={inputCls} value={p.id || ""} placeholder="ex: ouvrage-2026" onChange={(e) => pc.edit(i, { id: e.target.value })} />
                  </Field>
                  <Field label="Type / Catégorie">
                    <input className={inputCls} value={p.type} placeholder="ex: Ouvrage Majeur 2026" onChange={(e) => pc.edit(i, { type: e.target.value })} />
                  </Field>
                  <Field label="Titre Français">
                    <input className={inputCls} value={p.title} onChange={(e) => pc.edit(i, { title: e.target.value })} />
                  </Field>
                  <Field label="Titre Arabe (Optionnel)">
                    <input className={inputCls} value={p.titleAr || ""} placeholder="ex: التعويض عن الأضرار..." onChange={(e) => pc.edit(i, { titleAr: e.target.value })} />
                  </Field>
                  <Field label="Référence / Éditeur">
                    <input className={inputCls} value={p.meta} onChange={(e) => pc.edit(i, { meta: e.target.value })} />
                  </Field>
                  <Field label="Code ISBN">
                    <input className={inputCls} value={p.isbn || ""} placeholder="978-9938-20-976-1" onChange={(e) => pc.edit(i, { isbn: e.target.value })} />
                  </Field>
                  <Field label="Prix public">
                    <input className={inputCls} value={p.price || ""} placeholder="12 TND (12 د.ت)" onChange={(e) => pc.edit(i, { price: e.target.value })} />
                  </Field>
                  <Field label="Chemin Image Couverture">
                    <input className={inputCls} value={p.coverImage || ""} placeholder="/images/book-cover.jpg" onChange={(e) => pc.edit(i, { coverImage: e.target.value })} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Résumé détaillé">
                      <textarea rows={3} className={inputCls} value={p.summary || ""} onChange={(e) => pc.edit(i, { summary: e.target.value })} />
                    </Field>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-[#dcd8cb] pt-3">
                  <Btn onClick={() => pc.move(i, -1)}>↑ Monter</Btn>
                  <Btn onClick={() => pc.move(i, 1)}>↓ Descendre</Btn>
                  <Btn variant="danger" onClick={() => pc.del(i)}>Supprimer</Btn>
                </div>
              </Card>
            ))}
          </>
        )}

        {tab === "Réservations" && <ReservationsAdmin />}

        {tab === "Galerie" && (
          <>
            <Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Titre de la section"><input className={inputCls} value={content.galerieIntro.titre} onChange={(e) => up({ galerieIntro: { ...content.galerieIntro, titre: e.target.value } })} /></Field>
                <Field label="Texte d'introduction"><textarea rows={3} className={inputCls} value={content.galerieIntro.texte} onChange={(e) => up({ galerieIntro: { ...content.galerieIntro, texte: e.target.value } })} /></Field>
              </div>
              <label className="mt-4 inline-block cursor-pointer rounded-xl bg-[#2e3d91] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-[#1e2766] shadow-sm transition">
                + Téléverser des photos
                <input type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
              </label>
              <p className="mt-2 text-xs text-[#1e2766]/60">Les images sont redimensionnées automatiquement (1400 px max).</p>
            </Card>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {content.galerie.map((g, i) => (
                <Card key={i}>
                  <img src={g.src} alt="" className="aspect-[4/3] w-full rounded-xl object-cover border border-[#dcd8cb]" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")} />
                  <div className="mt-3 space-y-2">
                    <Field label="Légende"><input className={inputCls} value={g.legende} onChange={(e) => gc.edit(i, { legende: e.target.value })} /></Field>
                    <Field label="Catégorie (moscou | tribunaux | conferences)">
                      <input className={inputCls} value={g.category || "tribunal"} onChange={(e) => gc.edit(i, { category: e.target.value as GalerieItem["category"] })} />
                    </Field>
                    <Field label="Chemin / source"><input className={inputCls} value={g.src.startsWith("data:") ? "(image téléversée)" : g.src} readOnly={g.src.startsWith("data:")} onChange={(e) => gc.edit(i, { src: e.target.value })} /></Field>
                    <label className="flex items-center gap-2 text-xs text-[#1e2766]/80 font-medium">
                      <input type="checkbox" checked={g.tall} onChange={(e) => gc.edit(i, { tall: e.target.checked })} /> Format portrait (grande vignette)
                    </label>
                    <div className="flex gap-2 pt-1">
                      <Btn onClick={() => gc.move(i, -1)}>←</Btn>
                      <Btn onClick={() => gc.move(i, 1)}>→</Btn>
                      <Btn variant="danger" onClick={() => gc.del(i)}>Supprimer</Btn>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {tab === "Clients" && strList("clients")}

        {tab === "Messages" && <Messages />}
        {tab === "Médiathèque" && <Medias />}

        {tab === "Contact" && (
          <Card>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1e2766] mb-4">Coordonnées du Cabinet</h2>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              <Field label="Téléphone (affiché)"><input className={inputCls} value={content.contact.phone} onChange={(e) => up({ contact: { ...content.contact, phone: e.target.value } })} /></Field>
              <Field label="Téléphone (lien tel:)"><input className={inputCls} value={content.contact.phoneHref} onChange={(e) => up({ contact: { ...content.contact, phoneHref: e.target.value } })} /></Field>
              <Field label="Email"><input className={inputCls} value={content.contact.email} onChange={(e) => up({ contact: { ...content.contact, email: e.target.value } })} /></Field>
              <Field label="LinkedIn"><input className={inputCls} value={content.contact.linkedin} onChange={(e) => up({ contact: { ...content.contact, linkedin: e.target.value } })} /></Field>
              <div className="md:col-span-2">
                <Field label="Adresse"><input className={inputCls} value={content.contact.address} onChange={(e) => up({ contact: { ...content.contact, address: e.target.value } })} /></Field>
              </div>
              <Field label="Citation de pied de page"><input className={inputCls} value={content.citationFooter.texte} onChange={(e) => up({ citationFooter: { ...content.citationFooter, texte: e.target.value } })} /></Field>
              <Field label="Auteur de la citation"><input className={inputCls} value={content.citationFooter.auteur} onChange={(e) => up({ citationFooter: { ...content.citationFooter, auteur: e.target.value } })} /></Field>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
