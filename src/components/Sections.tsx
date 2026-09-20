import { useState } from "react";
import { Reveal } from "./Reveal";
import { Img } from "./Img";
import { useContent } from "../store";
import { PAGES, go } from "../router";
import { isOnline, mediaUrl, sendMessage } from "../backend";
import { LightboxModal } from "./LightboxModal";
import { ReservationModal } from "./ReservationModal";
import { galerieCategories, type GalerieItem, type PublicationItem } from "../data";
import { cn } from "../utils/cn";

const Label = ({ children }: { children: string }) => (
  <p className="mb-4 sm:mb-6 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-navy font-semibold">{children}</p>
);

export function Hero() {
  const c = useContent();
  const [lightboxImg, setLightboxImg] = useState<GalerieItem | null>(null);

  const handleOpenHeroImage = () => {
    setLightboxImg({
      id: "hero-img",
      src: "/images/hero.jpg",
      legende: "Cabinet d'Avocat Me Mohamed Anouar Ajmi — Rigueur, Engagement & Expertise",
      category: "tribunaux",
      categoryLabel: "Cabinet Ajmi",
    });
  };

  return (
    <section id="top" className="flex min-h-screen flex-col bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 sm:px-6 pb-10 sm:pb-14 pt-28 sm:pt-36 md:pt-44">
        <Reveal>
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            {/* Kicker minimisé */}
            <p className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-ink/60">
              <span className="h-px w-5 sm:w-8 bg-navy shrink-0" />
              <span>{c.hero.kicker}</span>
            </p>
            {/* Titre minimisé */}
            <h1 className="mt-3 sm:mt-4 font-serif text-lg sm:text-xl md:text-2xl leading-tight tracking-tight text-ink">
              {c.hero.titre}
              <span className="italic text-navy"> &amp; </span>
              <span className="break-words">{c.hero.titreItalic}</span>
            </h1>
            {/* Accroche centrée : traitement typographique de l'ancien grand titre */}
            <p className="mt-6 sm:mt-8 max-w-3xl text-balance font-serif text-[6vw] sm:text-3xl md:text-4xl lg:text-[3.4rem] font-semibold leading-[1.08] tracking-tight text-ink">
              {c.hero.sous}
            </p>
          </div>
        </Reveal>
      </div>

      {/* Bande visuelle bleu royal */}
      <div
        className="relative h-[26vh] sm:h-[34vh] min-h-[200px] sm:min-h-[240px] cursor-pointer overflow-hidden bg-navy md:h-[40vh] group"
        onClick={handleOpenHeroImage}
      >
        <img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/70 to-ink/80" />
        <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-paper/10 py-3 sm:py-4">
          <div className="marquee flex whitespace-nowrap text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-blue/80">
            {[...c.competences, ...c.competences].map((x, i) => (
              <span key={i} className="px-4 sm:px-8">
                {x} <span className="ml-4 sm:ml-8 text-paper/50">/</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {lightboxImg && (
        <LightboxModal
          item={lightboxImg}
          items={[lightboxImg]}
          onClose={() => setLightboxImg(null)}
          onSelect={(i) => setLightboxImg(i)}
        />
      )}
    </section>
  );
}

export function Cabinet() {
  const c = useContent();
  const [lightboxImg, setLightboxImg] = useState<GalerieItem | null>(null);

  /** Portrait réel : images/portrait-avocat.jpg (robe d'avocat) */
  const portraitSrc = "/images/portrait-avocat.jpg";

  const openPortrait = () => {
    setLightboxImg({
      id: "cabinet-portrait",
      src: portraitSrc,
      legende: `${c.avocat.nom} — ${c.avocat.l1}`,
      category: "tribunaux",
      categoryLabel: "Cabinet Ajmi",
    });
  };

  return (
    <section id="cabinet" className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20 md:py-28">
      <Reveal>
        <Label>Présentation du Cabinet &amp; de l'Avocat</Label>
      </Reveal>

      <div className="mt-6 sm:mt-8 grid items-start gap-8 sm:gap-12 md:grid-cols-12 md:gap-16">
        {/* Portrait réel (portrait-avocat.jpg) en évidence */}
        <Reveal className="md:col-span-5">
          <div
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-stone/30 shadow-lg ring-1 ring-stone/60"
            onClick={openPortrait}
          >
            <img
              src={portraitSrc}
              alt={c.avocat.nom}
              className="aspect-[4/5] w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-paper">
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue">L'avocat</p>
              <h3 className="mt-1 sm:mt-2 font-serif text-xl sm:text-2xl md:text-3xl">{c.avocat.nom}</h3>
              <p className="mt-1 text-xs sm:text-sm font-light text-paper/80">{c.avocat.l1}</p>
              <p className="text-xs sm:text-sm font-light text-paper/70">{c.avocat.l2}</p>
            </div>
            <span className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-wider text-paper opacity-90 sm:opacity-0 backdrop-blur transition sm:group-hover:opacity-100">
              Agrandir ↗
            </span>
          </div>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="#/avocat"
              className="w-full sm:w-auto text-center rounded-xl bg-navy px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-paper transition hover:bg-ink shadow-sm"
            >
              Profil complet
            </a>
            <a
              href={c.contact.linkedin}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto text-center rounded-xl border border-ink px-6 py-3 text-[11px] uppercase tracking-[0.2em] transition hover:bg-ink hover:text-paper"
            >
              LinkedIn ↗
            </a>
          </div>
        </Reveal>

        {/* Présentation fusionnée Cabinet + Avocat */}
        <Reveal delay={120} className="md:col-span-7 space-y-4 sm:space-y-6 text-sm sm:text-[15px] font-light leading-relaxed sm:leading-[1.9] text-ink/80 md:text-base">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl leading-tight text-ink">{c.cabinet.titre}</h2>
          <p>{c.cabinet.p1}</p>
          <p>{c.cabinet.p2}</p>
          <p className="border-l-2 border-navy pl-4 sm:pl-6 font-serif text-lg sm:text-2xl italic leading-snug text-ink">
            « {c.cabinet.citation} »
          </p>

          <div className="grid gap-3 sm:gap-4 border-t border-stone pt-6 sm:pt-8 grid-cols-1 sm:grid-cols-2">
            {[
              { t: "Conseil", d: "Startups, sociétés, contrats & investissement" },
              { t: "Contentieux", d: "Représentation devant les juridictions" },
              { t: "Droit médical", d: "Responsabilité & indemnisation (Loi 32-2024)" },
              { t: "Engagement", d: "Droits humains & politiques publiques" },
            ].map((x) => (
              <div key={x.t} className="rounded-xl bg-stone/40 p-4 sm:px-5 sm:py-4">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-navy font-semibold">{x.t}</p>
                <p className="mt-1 text-xs sm:text-sm text-ink/75 leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {lightboxImg && (
        <LightboxModal
          item={lightboxImg}
          items={[lightboxImg]}
          onClose={() => setLightboxImg(null)}
          onSelect={(i) => setLightboxImg(i)}
        />
      )}
    </section>
  );
}

export function Chiffres() {
  const c = useContent();
  return (
    <section className="border-y border-stone bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-stone sm:divide-y-0 md:grid-cols-4 md:divide-x">
        {c.chiffres.map((x, i) => (
          <Reveal
            key={i}
            delay={i * 100}
            className={cn(
              "p-5 sm:p-8 md:px-10 md:py-14 text-center sm:text-left",
              i % 2 === 0 ? "border-r border-stone md:border-r-0" : "",
            )}
          >
            <p className="font-serif text-4xl sm:text-5xl md:text-7xl font-light text-ink">{x.v}</p>
            <p className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-ink/60 leading-tight">
              {x.l}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Domaines() {
  const c = useContent();
  return (
    <section id="services" className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-28 md:py-40">
        <Reveal>
          <Label>Domaines d'intervention</Label>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl">Expertises &amp; Conseils</h2>
          <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base font-light leading-relaxed text-ink/70">
            Cinq pôles d'expertise structurés pour répondre aux besoins des entreprises, des familles, des professionnels de santé et des particuliers.
          </p>
        </Reveal>
        <div className="mt-10 sm:mt-16 space-y-px bg-stone">
          {c.domaines.map((d, i) => (
            <Reveal key={i} delay={i * 60} className="bg-paper">
              <article className="grid gap-4 sm:gap-6 p-5 sm:p-8 md:grid-cols-12 md:gap-10 md:p-12">
                <div className="md:col-span-1">
                  <span className="font-serif text-2xl sm:text-3xl text-navy md:text-4xl">{d.n}</span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="font-serif text-xl sm:text-2xl leading-tight md:text-3xl">{d.title}</h3>
                  <a
                    href="#/services"
                    className="mt-3 sm:mt-4 inline-block border-b border-navy/40 pb-0.5 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-navy/70 transition hover:border-navy hover:text-navy"
                  >
                    En savoir +
                  </a>
                </div>
                <div className="md:col-span-7">
                  <p className="text-sm sm:text-[15px] font-light leading-relaxed sm:leading-[1.85] text-ink/75">{d.text}</p>
                  {d.items && d.items.length > 0 && (
                    <ul className="mt-4 sm:mt-5 flex flex-wrap gap-1.5 sm:gap-2">
                      {d.items.map((item) => (
                        <li
                          key={item}
                          className="rounded-full border border-stone bg-stone/40 px-3 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-[11px] tracking-wide text-ink/70"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Competences() {
  const c = useContent();
  return (
    <section id="competences" className="border-t border-stone py-12 sm:py-20">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6">
        <Label>Matières &amp; spécialités</Label>
        <p className="font-serif text-xl sm:text-2xl leading-relaxed text-ink/90 md:text-3xl">
          {c.competences.map((x, i) => (
            <span key={i}>
              {x}
              {i < c.competences.length - 1 && <span className="mx-2 sm:mx-3 text-navy">/</span>}
            </span>
          ))}
        </p>
      </Reveal>
    </section>
  );
}

export function Parcours() {
  const c = useContent();
  const [lightboxImg, setLightboxImg] = useState<GalerieItem | null>(null);

  const handleZoomPortrait = () => {
    setLightboxImg({
      id: "portrait-img",
      src: mediaUrl(c.avocat.portrait),
      legende: c.avocat.nom + " — " + c.avocat.l1,
      category: "tribunaux",
      categoryLabel: "Avocat",
    });
  };

  return (
    <section id="parcours" className="border-t border-stone">
      <div className="mx-auto grid max-w-7xl gap-10 sm:gap-16 px-4 sm:px-6 py-16 sm:py-28 md:grid-cols-12 md:py-36">
        <Reveal className="md:col-span-4">
          <Label>L'avocat</Label>
          <div className="cursor-pointer group relative overflow-hidden rounded-xl mb-6 sm:mb-8 max-w-xs mx-auto md:mx-0" onClick={handleZoomPortrait}>
            <Img src={mediaUrl(c.avocat.portrait)} alt={c.avocat.nom} className="aspect-[4/5] w-full transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-black">
                Zoomer HD ↗
              </span>
            </div>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">{c.avocat.nom}</h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-light text-ink/70">{c.avocat.l1}</p>
          <p className="mt-1 text-xs sm:text-sm font-light text-ink/70">{c.avocat.l2}</p>
          <a href={c.contact.linkedin} target="_blank" rel="noreferrer" className="mt-6 sm:mt-8 inline-block border-b border-ink pb-1 text-[10px] sm:text-[11px] uppercase tracking-[0.25em]">
            Profil LinkedIn ↗
          </a>
        </Reveal>
        <div className="md:col-span-7 md:col-start-6">
          <Label>Expériences professionnelles &amp; engagements</Label>
          <ul className="divide-y divide-stone border-y border-stone">
            {c.experiences.map((e, i) => (
              <Reveal key={i} delay={i * 80}>
                <li className="grid gap-1 py-4 sm:py-6 md:grid-cols-2 md:gap-8">
                  <span className="font-serif text-lg sm:text-xl">{e.role}</span>
                  <span className="text-xs sm:text-sm font-light leading-relaxed text-ink/70">{e.org}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>

      {lightboxImg && (
        <LightboxModal
          item={lightboxImg}
          items={[lightboxImg]}
          onClose={() => setLightboxImg(null)}
          onSelect={(i) => setLightboxImg(i)}
        />
      )}
    </section>
  );
}

export function Publications() {
  const c = useContent();
  const featured = c.publications.find((p) => p.featured || p.id === "ouvrage-2026") || c.publications[0];
  const others = c.publications.filter((p) => p !== featured);
  const [selectedPubForOrder, setSelectedPubForOrder] = useState<PublicationItem | null>(null);

  const asPubItem = (p: typeof featured): PublicationItem => ({
    id: p.id || "pub",
    type: p.type,
    title: p.title,
    meta: p.meta,
    featured: p.featured,
    titleAr: p.titleAr,
    isbn: p.isbn,
    price: p.price,
    publisher: p.publisher,
    coverImage: p.coverImage,
    summary: p.summary,
    summaryAr: p.summaryAr,
    sommaire: p.sommaire,
  });

  return (
    <section id="publications" className="bg-stone/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-28 md:py-36">
        <Reveal>
          <Label>Publications, prix &amp; contributions scientifiques</Label>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">Articles &amp; Ouvrages Officiels</h2>
        </Reveal>

        {/* CARTE EN VEDETTE : OUVRAGE MAJEUR 2026 */}
        {featured && (
          <Reveal className="mt-8 sm:mt-12 overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0b0d12] text-paper shadow-2xl border border-amber-500/30">
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 p-5 sm:p-8 md:p-12 items-center">
              <div className="lg:col-span-5 flex justify-center">
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-amber-500/10 p-2 sm:p-3 border border-amber-500/30 shadow-2xl transition duration-500 hover:border-amber-400 max-w-full"
                  onClick={() => go(`#/publication/${featured.id}`)}
                >
                  <img
                    src={featured.coverImage || "/images/book-cover.jpg"}
                    alt={featured.title}
                    className="max-h-72 sm:max-h-80 w-auto max-w-full object-contain sm:object-cover rounded-xl transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <span className="rounded-full bg-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black">
                      Voir la fiche complète ➔
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="rounded-full bg-amber-500/20 px-3.5 py-1 text-[11px] sm:text-xs uppercase tracking-widest text-amber-300 border border-amber-500/40">
                    Ouvrage Majeur 2026
                  </span>
                  {featured.price && (
                    <span className="font-mono text-xs sm:text-sm font-bold text-amber-400">
                      Prix : {featured.price}
                    </span>
                  )}
                </div>

                {featured.titleAr && (
                  <h3
                    lang="ar"
                    dir="rtl"
                    className="font-serif text-xl sm:text-2xl text-amber-200 md:text-3xl break-words"
                    style={{ direction: "rtl", textAlign: "right", unicodeBidi: "isolate" }}
                  >
                    {featured.titleAr}
                  </h3>
                )}

                <h2
                  className="font-serif text-2xl sm:text-3xl font-bold md:text-4xl text-paper cursor-pointer hover:text-amber-300 transition break-words"
                  onClick={() => go(`#/publication/${featured.id}`)}
                >
                  {featured.title}
                </h2>

                <p className="text-xs sm:text-sm leading-relaxed text-paper/80 font-light">
                  {featured.summary || featured.meta}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-white/10 text-[11px] sm:text-xs font-mono text-paper/60">
                  {featured.isbn && <span>ISBN: {featured.isbn}</span>}
                  {featured.publisher && <span>Éditeur: {featured.publisher}</span>}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button
                    onClick={() => setSelectedPubForOrder(asPubItem(featured))}
                    className="w-full sm:w-auto text-center rounded-xl bg-amber-500 px-6 sm:px-8 py-3.5 text-xs font-semibold uppercase tracking-wider sm:tracking-widest text-black transition hover:bg-amber-400 shadow-lg"
                  >
                    Commander / Réserver l'ouvrage
                  </button>
                  <button
                    onClick={() => go(`#/publication/${featured.id}`)}
                    className="w-full sm:w-auto text-center rounded-xl border border-white/30 px-5 sm:px-6 py-3.5 text-xs font-semibold uppercase tracking-wider sm:tracking-widest text-paper transition hover:bg-white/10"
                  >
                    En savoir plus &amp; Sommaire
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* AUTRES PUBLICATIONS */}
        <div className="mt-10 sm:mt-14 grid gap-px bg-stone grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {others.map((p, i) => (
            <Reveal key={p.id || i} delay={i * 80} className="bg-paper">
              <article className="flex h-full flex-col p-6 sm:p-8">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-navy font-semibold">{p.type}</span>
                <h3
                  className="mt-4 sm:mt-6 font-serif text-xl sm:text-2xl leading-snug cursor-pointer hover:text-navy transition"
                  onClick={() => go(`#/publication/${p.id || "pub-" + i}`)}
                >
                  {p.title}
                </h3>
                <p className="mt-3 sm:mt-4 text-xs text-ink/70 font-light line-clamp-3">{p.summary}</p>
                <div className="mt-auto pt-6 sm:pt-8 flex items-center justify-between text-xs text-ink/60">
                  <span className="font-serif italic">{p.meta}</span>
                  <button
                    onClick={() => go(`#/publication/${p.id || "pub-" + i}`)}
                    className="font-semibold text-navy uppercase tracking-wider hover:underline"
                  >
                    Fiche ➔
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
          <Reveal delay={400} className="bg-ink text-paper">
            <div className="flex h-full flex-col justify-between p-6 sm:p-8">
              <p className="font-serif text-2xl sm:text-3xl italic leading-snug">« Le droit n'est pas une contrainte, c'est une stratégie. »</p>
              <p className="mt-6 sm:mt-8 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-stone/70">Cabinet Ajmi</p>
            </div>
          </Reveal>
        </div>
      </div>

      {selectedPubForOrder && (
        <ReservationModal publication={selectedPubForOrder} onClose={() => setSelectedPubForOrder(null)} />
      )}
    </section>
  );
}

export function Galerie() {
  const c = useContent();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPhoto, setSelectedPhoto] = useState<GalerieItem | null>(null);

  if (!c.galerie.length) return null;

  const toGalerie = (g: (typeof c.galerie)[0], i: number): GalerieItem => ({
    id: g.id || `photo-${i}`,
    src: g.src,
    legende: g.legende,
    category: (g.category as GalerieItem["category"]) || "tribunaux",
    categoryLabel: g.categoryLabel || "Galerie",
    tall: !!g.tall,
  });

  const allPhotos = c.galerie.map(toGalerie);
  const filteredPhotos =
    activeCategory === "all" ? allPhotos : allPhotos.filter((g) => g.category === activeCategory);

  return (
    <section id="galerie" className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-28 md:py-36">
        <Reveal>
          <p className="mb-4 sm:mb-6 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-blue font-semibold">Galerie HD Interactive</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl">{c.galerieIntro.titre}</h2>
          <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base font-light leading-relaxed text-stone">{c.galerieIntro.texte}</p>
        </Reveal>

        {/* Onglets de filtrage par catégorie */}
        <div className="mt-8 sm:mt-10 -mx-4 px-4 sm:mx-0 sm:px-0 flex flex-nowrap overflow-x-auto sm:flex-wrap gap-2 sm:gap-3 border-b border-white/10 pb-4 sm:pb-6 scrollbar-none">
          {galerieCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs uppercase tracking-wider font-medium transition duration-300 shrink-0 whitespace-nowrap ${
                activeCategory === cat.key
                  ? "bg-amber-400 text-black shadow-lg"
                  : "bg-white/5 text-paper/70 hover:bg-white/10 hover:text-paper border border-white/10"
              }`}
            >
              {cat.label}
              {cat.key === "all" ? ` (${c.galerie.length})` : ""}
            </button>
          ))}
        </div>

        {/* Grille de photos */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredPhotos.map((g, i) => (
            <Reveal key={g.id || i} delay={(i % 4) * 80} className={g.tall ? "sm:row-span-2" : ""}>
              <figure
                className="group relative h-full cursor-zoom-in overflow-hidden rounded-xl bg-white/5 border border-white/10"
                onClick={() => setSelectedPhoto(g)}
              >
                <Img
                  src={mediaUrl(g.src)}
                  alt={g.legende}
                  className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
                    g.tall ? "aspect-[4/3] sm:aspect-[3/4] md:aspect-[3/5]" : "aspect-[4/3]"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 sm:via-transparent to-transparent opacity-95 sm:opacity-0 transition duration-300 sm:group-hover:opacity-100 flex flex-col justify-end p-3 sm:p-4">
                  <span className="inline-block rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-black font-semibold w-fit mb-1">
                    {g.categoryLabel}
                  </span>
                  <p className="text-xs text-paper font-light line-clamp-2">{g.legende}</p>
                </div>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox Modal HD */}
      {selectedPhoto && (
        <LightboxModal
          item={selectedPhoto}
          items={filteredPhotos}
          onClose={() => setSelectedPhoto(null)}
          onSelect={(item) => setSelectedPhoto(item)}
        />
      )}
    </section>
  );
}

export function Valeurs() {
  const c = useContent();
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-28">
      <Reveal>
        <Label>Valeurs</Label>
        <p className="max-w-2xl text-sm sm:text-base font-light leading-relaxed text-ink/80">{c.valeursTexte}</p>
      </Reveal>
      <ul className="mt-8 sm:mt-14 flex flex-wrap gap-x-6 sm:gap-x-10 gap-y-3 sm:gap-y-4">
        {c.valeurs.map((v, i) => (
          <Reveal key={i} delay={i * 80}>
            <li className="font-serif text-3xl sm:text-5xl md:text-7xl break-words">{v}</li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/** Bandeau clients animé (marquee) — placé sous la présentation Cabinet & Avocat */
export function Clients({
  variant = "section",
}: {
  /** "marquee" = bandeau compact animé ; "section" = grille complète */
  variant?: "marquee" | "section";
}) {
  const c = useContent();
  const items = c.clients.map((x, i) => {
    const name = typeof x === "string" ? x : x.name;
    const logo = typeof x === "string" ? undefined : x.logo;
    return { name, logo, key: `${name}-${i}` };
  });

  if (variant === "marquee") {
    // Double the list for seamless infinite scroll
    const loop = [...items, ...items, ...items];
    return (
      <section
        id="clients-marquee"
        className="overflow-hidden border-y border-stone bg-stone/30 py-8 sm:py-10 md:py-12"
        aria-label="Ils nous ont fait confiance"
      >
        <div className="mx-auto mb-4 sm:mb-6 max-w-7xl px-4 sm:px-6">
          <p className="text-center text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-navy/70 font-semibold">
            Ils nous ont fait confiance
          </p>
        </div>
        <div className="clients-marquee-mask relative overflow-hidden">
          <div className="clients-marquee flex w-max items-center gap-8 sm:gap-12 md:gap-16">
            {loop.map((item, i) => (
              <div
                key={`${item.key}-${i}`}
                className="flex h-16 w-36 sm:h-20 sm:w-44 shrink-0 flex-col items-center justify-center gap-1.5 sm:gap-2 md:h-24 md:w-52"
                title={item.name}
              >
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="max-h-11 sm:max-h-14 max-w-[120px] sm:max-w-[140px] object-contain opacity-90 transition duration-300 hover:opacity-100 md:max-h-16 md:max-w-[160px]"
                    loading="lazy"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                      const fallback = el.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <span
                  className={
                    item.logo
                      ? "hidden text-center font-serif text-xs sm:text-sm text-ink/70"
                      : "text-center font-serif text-sm sm:text-base text-ink/80 md:text-lg"
                  }
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-stone">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-28">
        <Reveal>
          <Label>Ils nous ont fait confiance</Label>
          <p className="max-w-2xl text-sm sm:text-base font-light leading-relaxed text-ink/80">
            Nous remercions nos clients et partenaires institutionnels, associatifs et économiques pour la confiance qu'ils nous témoignent
            au quotidien.
          </p>
        </Reveal>
        <ul className="mt-10 sm:mt-14 grid gap-px bg-stone grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.key} delay={i * 60} className="bg-paper">
              <li className="flex h-32 sm:h-40 flex-col items-center justify-center gap-2 sm:gap-3 px-3 sm:px-6 text-center">
                {item.logo ? (
                  <>
                    <img
                      src={item.logo}
                      alt={item.name}
                      className="h-12 sm:h-16 max-w-[120px] sm:max-w-[160px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="text-[9px] sm:text-[10px] font-light uppercase tracking-wider sm:tracking-widest text-ink/55 line-clamp-1">{item.name}</span>
                  </>
                ) : (
                  <span className="font-serif text-base sm:text-xl md:text-2xl">{item.name}</span>
                )}
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Contact() {
  const c = useContent();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      nom: String(f.get("nom") ?? ""),
      email: String(f.get("email") ?? ""),
      telephone: String(f.get("tel") ?? ""),
      competence: String(f.get("competence") ?? ""),
      message: String(f.get("message") ?? ""),
    };
    if (isOnline()) {
      setBusy(true);
      const { error } = await sendMessage(payload);
      setBusy(false);
      if (error) return setErr("Envoi impossible. Merci de nous écrire directement par email.");
      setSent(true);
      return;
    }
    const body = encodeURIComponent(
      `Nom : ${payload.nom}\nTéléphone : ${payload.telephone}\nCompétence : ${payload.competence}\n\n${payload.message}`,
    );
    window.location.href = `mailto:${c.contact.email}?subject=${encodeURIComponent("Demande de consultation")}&body=${body}`;
    setSent(true);
  };
  const input = "w-full border-b border-paper/30 bg-transparent py-3 text-base sm:text-sm text-paper placeholder:text-paper/40 focus:border-blue focus:outline-none";
  return (
    <section id="contact" className="bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 sm:gap-16 px-4 sm:px-6 py-16 sm:py-28 md:grid-cols-12 md:py-40">
        <Reveal className="md:col-span-5">
          <p className="mb-4 sm:mb-6 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-blue font-semibold">Contact</p>
          <h2 className="font-serif text-3xl sm:text-5xl leading-tight md:text-6xl">
            Nous serions fiers de vous <span className="italic">accompagner.</span>
          </h2>
          <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6 text-sm font-light text-stone">
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-blue">Téléphone</p>
              <a href={c.contact.phoneHref} className="mt-1 block text-base sm:text-lg text-paper">{c.contact.phone}</a>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-blue">Email</p>
              <a href={`mailto:${c.contact.email}`} className="mt-1 block text-base sm:text-lg text-paper break-all">{c.contact.email}</a>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-blue">Adresse</p>
              <p className="mt-1 text-base sm:text-lg text-paper">{c.contact.address}</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={150} className="md:col-span-6 md:col-start-7">
          {sent ? (
            <p className="font-serif text-2xl sm:text-3xl italic">
              Merci, votre demande a bien été transmise au cabinet. Nous revenons vers vous dans les meilleurs délais.
            </p>
          ) : (
            <form onSubmit={submit} className="grid gap-6 sm:gap-8 sm:grid-cols-2">
              <input name="nom" required placeholder="Nom &amp; prénom" className={input} />
              <input name="tel" placeholder="Téléphone" className={input} />
              <input name="email" type="email" required placeholder="Email" className={input} />
              <select name="competence" className={`${input} appearance-none cursor-pointer`} defaultValue="">
                <option value="" disabled className="text-ink">Pour quelle compétence ?</option>
                {c.domaines.map((d, i) => (
                  <option key={i} value={d.title} className="text-ink">{d.title}</option>
                ))}
              </select>
              <textarea name="message" rows={4} required placeholder="Message" className={`${input} sm:col-span-2`} />
              <div className="sm:col-span-2">
                <button disabled={busy} className="w-full sm:w-fit bg-paper px-8 py-3.5 sm:py-3 text-[11px] uppercase tracking-[0.25em] text-ink transition hover:bg-blue hover:text-ink disabled:opacity-50 font-semibold shadow-sm">
                  {busy ? "Envoi…" : "Envoyer"}
                </button>
                {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const c = useContent();
  return (
    <footer className="border-t border-paper/10 bg-ink text-paper/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
        <p className="text-center font-serif text-2xl sm:text-3xl md:text-4xl italic text-paper">« {c.citationFooter.texte} »</p>
        <p className="mt-3 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em]">{c.citationFooter.auteur}</p>

        <div className="mt-12 sm:mt-16 grid gap-8 sm:gap-10 border-t border-paper/10 pt-10 sm:pt-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-paper/10 p-1.5 ring-1 ring-paper/20">
                <img
                  src="/images/logo-cabinet-light.png"
                  alt="Logo Cabinet Ajmi"
                  className="h-full w-full object-contain"
                />
              </span>
              <p className="font-serif text-lg sm:text-xl text-paper">
                Cabinet <span className="italic">Ajmi</span>
              </p>
            </div>
            <p className="mt-3 text-xs sm:text-sm font-light leading-relaxed">{c.avocat.l1}</p>
            <p className="mt-1 text-xs sm:text-sm font-light leading-relaxed">{c.avocat.nom}</p>
          </div>
          <div>
            <p className="mb-3 sm:mb-4 text-[10px] uppercase tracking-[0.25em] text-gold font-semibold">Navigation</p>
            <ul className="space-y-2 text-xs sm:text-sm font-light">
              {PAGES.map((p) => (
                <li key={p.path}><a href={`#${p.path}`} className="hover:text-paper">{p.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 sm:mb-4 text-[10px] uppercase tracking-[0.25em] text-gold font-semibold">Domaines</p>
            <ul className="space-y-2 text-xs sm:text-sm font-light">
              {c.domaines.slice(0, 5).map((d, i) => (
                <li key={i}><a href="#/services" className="hover:text-paper">{d.title}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 sm:mb-4 text-[10px] uppercase tracking-[0.25em] text-gold font-semibold">Contact</p>
            <ul className="space-y-2 text-xs sm:text-sm font-light">
              <li><a href={c.contact.phoneHref} className="hover:text-paper">{c.contact.phone}</a></li>
              <li><a href={`mailto:${c.contact.email}`} className="break-all hover:text-paper">{c.contact.email}</a></li>
              <li className="leading-relaxed">{c.contact.address}</li>
              <li><a href={c.contact.linkedin} target="_blank" rel="noreferrer" className="hover:text-paper">LinkedIn ↗</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 flex flex-col items-center justify-between gap-4 border-t border-paper/10 pt-8 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] md:flex-row text-center md:text-left">
          <span>© {new Date().getFullYear()} Cabinet d'Avocat Ajmi — Monastir</span>
          <a href="#/admin" className="hover:text-paper font-semibold">Administration</a>
        </div>
      </div>
    </footer>
  );
}
