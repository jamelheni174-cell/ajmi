import { useState } from "react";
import { publications, type GalerieItem } from "../data";
import { go } from "../router";
import { ReservationModal } from "../components/ReservationModal";
import { LightboxModal } from "../components/LightboxModal";

interface PublicationDetailProps {
  publicationId: string;
}

export function PublicationDetail({ publicationId }: PublicationDetailProps) {
  const pub = publications.find((p) => p.id === publicationId) || publications[0];
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<GalerieItem | null>(null);

  if (!pub) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-28 sm:py-40 text-center">
        <h2 className="font-serif text-2xl sm:text-3xl">Publication non trouvée</h2>
        <button onClick={() => go("/actualites")} className="mt-6 rounded-xl bg-navy px-6 py-3 text-white text-xs uppercase tracking-widest">
          Retour aux actualités
        </button>
      </div>
    );
  }

  const handleZoomCover = () => {
    if (pub.coverImage) {
      setLightboxImg({
        id: pub.id,
        src: pub.coverImage,
        legende: pub.title,
        category: "tribunaux",
        categoryLabel: "Ouvrage Majeur",
      });
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink pt-24 sm:pt-32 pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Fil d'ariane */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-ink/60">
          <button onClick={() => go("/")} className="hover:text-navy transition">
            Accueil
          </button>
          <span>/</span>
          <button onClick={() => go("/actualites")} className="hover:text-navy transition">
            Publications
          </button>
          <span>/</span>
          <span className="text-navy font-semibold truncate max-w-[180px] sm:max-w-xs">{pub.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
          {/* Couverture & Action rapide */}
          <div className="lg:col-span-4">
            <div className="group relative overflow-hidden rounded-2xl bg-stone/20 p-3 sm:p-4 shadow-xl border border-stone/30">
              {pub.coverImage ? (
                <div className="cursor-pointer overflow-hidden rounded-xl flex justify-center" onClick={handleZoomCover}>
                  <img
                    src={pub.coverImage}
                    alt={pub.title}
                    className="max-h-80 sm:max-h-96 w-auto max-w-full object-contain rounded-lg transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition duration-300 group-hover:opacity-100">
                    <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black">
                      Zoomer la couverture ↗
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex h-72 sm:h-96 w-full items-center justify-center rounded-xl bg-navy/10 text-navy font-serif italic text-sm">
                  Image indisponible
                </div>
              )}
            </div>

            {/* Fiche tarifaire & Commande */}
            <div className="mt-6 rounded-2xl bg-[#0b0d12] p-5 sm:p-6 text-paper shadow-lg border border-amber-500/20">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                Commande directe
              </span>
              {pub.price && <p className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-amber-300">{pub.price}</p>}
              {pub.isbn && (
                <p className="mt-2 text-xs text-paper/60 font-mono break-all">
                  ISBN : <span className="text-paper/90">{pub.isbn}</span>
                </p>
              )}
              {pub.publisher && (
                <p className="mt-1 text-xs text-paper/60">
                  Éditeur : <span className="text-paper/90">{pub.publisher}</span>
                </p>
              )}

              <button
                onClick={() => setShowOrderModal(true)}
                className="mt-5 sm:mt-6 w-full rounded-xl bg-amber-500 py-3.5 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-amber-400 shadow-md text-center"
              >
                Commander / Réserver cet ouvrage
              </button>
            </div>
          </div>

          {/* Métadonnées & Contenu scientifique */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            <div>
              <span className="inline-block rounded-full bg-navy/10 px-3.5 py-1 text-[11px] sm:text-xs uppercase tracking-widest text-navy font-semibold mb-3">
                {pub.type}
              </span>

              {/* Titre Arabe si présent */}
              {pub.titleAr && (
                <h2
                  lang="ar"
                  dir="rtl"
                  className="mb-2 font-serif text-2xl sm:text-3xl leading-snug text-navy break-words"
                  style={{ direction: "rtl", textAlign: "right", unicodeBidi: "isolate" }}
                >
                  {pub.titleAr}
                </h2>
              )}

              {/* Titre Français */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight md:text-4xl text-ink break-words">
                {pub.title}
              </h1>

              <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-ink/60 font-serif italic">{pub.meta}</p>
            </div>

            {/* Résumé bilingue */}
            {pub.summary && (
              <div className="rounded-2xl bg-paper p-5 sm:p-8 shadow-sm border border-stone/40 space-y-4">
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-navy">Résumé de l'ouvrage</h3>
                <p className="text-sm sm:text-base leading-relaxed text-ink/80">{pub.summary}</p>

                {pub.summaryAr && (
                  <p
                    lang="ar"
                    dir="rtl"
                    className="border-t border-stone/20 pt-4 text-sm sm:text-base font-serif leading-relaxed text-ink/80"
                    style={{ direction: "rtl", textAlign: "right", unicodeBidi: "isolate" }}
                  >
                    {pub.summaryAr}
                  </p>
                )}
              </div>
            )}

            {/* Sommaire / Extrait */}
            {pub.sommaire && pub.sommaire.length > 0 && (
              <div className="rounded-2xl bg-paper p-5 sm:p-8 shadow-sm border border-stone/40">
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-navy mb-4">Sommaire &amp; Plan d'étude</h3>
                <ul className="space-y-2.5 sm:space-y-3">
                  {pub.sommaire.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm leading-relaxed text-ink/80">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-stone">
              <button
                onClick={() => setShowOrderModal(true)}
                className="w-full sm:w-auto text-center rounded-xl bg-navy px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-paper transition hover:bg-ink shadow-sm"
              >
                Commander maintenant
              </button>
              <button
                onClick={() => go("/contact")}
                className="w-full sm:w-auto text-center rounded-xl border border-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-ink hover:text-paper"
              >
                Contacter l'auteur / Cabinet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de réservation */}
      {showOrderModal && (
        <ReservationModal publication={pub} onClose={() => setShowOrderModal(false)} />
      )}

      {/* Lightbox Cover */}
      {lightboxImg && (
        <LightboxModal
          item={lightboxImg}
          items={[lightboxImg]}
          onClose={() => setLightboxImg(null)}
          onSelect={(i) => setLightboxImg(i)}
        />
      )}
    </div>
  );
}
