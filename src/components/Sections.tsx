import { useState } from "react";
import { Reveal } from "./Reveal";
import { Img } from "./Img";
import { useContent } from "../store";
import { PAGES, go } from "../router";
import { isOnline, mediaUrl, sendMessage } from "../backend";
import { LightboxModal } from "./LightboxModal";
import { ReservationModal } from "./ReservationModal";
import { galerieCategories, type GalerieItem, type PublicationItem } from "../data";

const Label = ({ children }: { children: string }) => (
  <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-navy">{children}</p>
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
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-14 pt-36 md:pt-44">
        <Reveal>
          <div className="grid items-end gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="mb-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-ink/60">
                <span className="h-px w-10 bg-navy" />
                {c.hero.kicker}
              </p>
              <h1 className="font-serif text-[13vw] leading-[0.95] sm:text-6xl md:text-7xl lg:text-[5.6rem]">
                {c.hero.titre}
                <span className="italic text-navy"> &amp; </span>
                {c.hero.titreItalic}
              </h1>
            </div>
            <div className="md:col-span-4">
              <p className="max-w-sm font-serif text-xl leading-snug text-ink/80 md:text-2xl">{c.hero.sous}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#/contact"
                  className="rounded-xl bg-navy px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] text-paper transition hover:bg-ink"
                >
                  Prendre RDV
                </a>
                <a
                  href={c.contact.phoneHref}
                  className="rounded-full border border-ink px-6 py-3.5 text-sm transition hover:bg-ink hover:text-paper"
                >
                  {c.contact.phone}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Bande visuelle bleu royal */}
      <div
        className="relative h-[34vh] min-h-[240px] cursor-pointer overflow-hidden bg-navy md:h-[40vh] group"
        onClick={handleOpenHeroImage}
      >
        <img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/70 to-ink/80" />
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition duration-300">
          <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wider text-amber-300 backdrop-blur-sm border border-amber-500/20">
            Agrandir en HD ↗
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-paper/10 py-4">
          <div className="marquee flex whitespace-nowrap text-[11px] uppercase tracking-[0.3em] text-blue/80">
            {[...c.competences, ...c.competences].map((x, i) => (
              <span key={i} className="px-8">
                {x} <span className="ml-8 text-paper/50">/</span>
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
  return (
    <section id="cabinet" className="mx-auto max-w-7xl px-6 py-28 md:py-40">
      <div className="grid gap-16 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <Label>Présentation du Cabinet</Label>
          <h2 className="font-serif text-4xl leading-tight md:text-5xl">{c.cabinet.titre}</h2>
        </Reveal>
        <Reveal delay={150} className="md:col-span-7 md:col-start-6 space-y-6 text-[15px] font-light leading-[1.9] text-ink/80 md:text-base">
          <p>{c.cabinet.p1}</p>
          <p>{c.cabinet.p2}</p>
          <p className="font-serif text-2xl italic leading-snug text-ink">« {c.cabinet.citation} »</p>
        </Reveal>
      </div>
    </section>
  );
}

export function Chiffres() {
  const c = useContent();
  return (
    <section className="border-y border-stone">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-stone md:grid-cols-4 md:divide-x">
        {c.chiffres.map((x, i) => (
          <Reveal key={i} delay={i * 100} className="px-6 py-14 md:px-10">
            <p className="font-serif text-6xl md:text-7xl">{x.v}</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-ink/60">{x.l}</p>
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
      <div className="mx-auto max-w-7xl px-6 py-28 md:py-40">
        <Reveal>
          <Label>Domaines d'intervention</Label>
          <h2 className="font-serif text-4xl md:text-6xl">Expertises &amp; Conseils</h2>
        </Reveal>
        <div className="mt-16 grid gap-px bg-stone md:grid-cols-2 lg:grid-cols-3">
          {c.domaines.map((d, i) => (
            <Reveal key={i} delay={i * 80} className="bg-paper p-10">
              <span className="font-serif text-3xl text-navy">{d.n}</span>
              <h3 className="mt-6 font-serif text-2xl">{d.title}</h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-ink/75">{d.text}</p>
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
    <section id="competences" className="border-t border-stone py-20">
      <Reveal className="mx-auto max-w-7xl px-6">
        <Label>Matières &amp; spécialités</Label>
        <p className="font-serif text-2xl leading-relaxed text-ink/90 md:text-3xl">
          {c.competences.map((x, i) => (
            <span key={i}>
              {x}
              {i < c.competences.length - 1 && <span className="mx-3 text-navy">/</span>}
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
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-12 md:py-36">
        <Reveal className="md:col-span-4">
          <Label>L'avocat</Label>
          <div className="cursor-pointer group relative overflow-hidden rounded-xl mb-8" onClick={handleZoomPortrait}>
            <Img src={mediaUrl(c.avocat.portrait)} alt={c.avocat.nom} className="aspect-[4/5] w-full max-w-xs transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-black">
                Zoomer HD ↗
              </span>
            </div>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl">{c.avocat.nom}</h2>
          <p className="mt-4 text-sm font-light text-ink/70">{c.avocat.l1}</p>
          <p className="mt-1 text-sm font-light text-ink/70">{c.avocat.l2}</p>
          <a href={c.contact.linkedin} target="_blank" rel="noreferrer" className="mt-8 inline-block border-b border-ink pb-1 text-[11px] uppercase tracking-[0.25em]">
            Profil LinkedIn ↗
          </a>
        </Reveal>
        <div className="md:col-span-7 md:col-start-6">
          <Label>Expériences professionnelles &amp; engagements</Label>
          <ul className="divide-y divide-stone border-y border-stone">
            {c.experiences.map((e, i) => (
              <Reveal key={i} delay={i * 80}>
                <li className="grid gap-1 py-6 md:grid-cols-2 md:gap-8">
                  <span className="font-serif text-xl">{e.role}</span>
                  <span className="text-sm font-light leading-relaxed text-ink/70">{e.org}</span>
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

  return (
    <section id="publications" className="bg-stone/30">
      <div className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <Reveal>
          <Label>Publications, prix &amp; contributions scientifiques</Label>
          <h2 className="font-serif text-4xl md:text-5xl">Articles &amp; Ouvrages Officiels</h2>
        </Reveal>

        {/* CARTE EN VEDETTE : OUVRAGE MAJEUR 2026 */}
        {featured && (
          <Reveal className="mt-12 overflow-hidden rounded-3xl bg-[#0b0d12] text-paper shadow-2xl border border-amber-500/30">
            <div className="grid gap-8 lg:grid-cols-12 p-8 md:p-12 items-center">
              <div className="lg:col-span-5 flex justify-center">
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-amber-500/10 p-3 border border-amber-500/30 shadow-2xl transition duration-500 hover:border-amber-400"
                  onClick={() => go(`#/publication/${featured.id}`)}
                >
                  <img
                    src={featured.coverImage || "/images/book-cover.jpg"}
                    alt={featured.title}
                    className="h-80 w-auto object-cover rounded-xl transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <span className="rounded-full bg-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black">
                      Voir la fiche complète ➔
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-amber-500/20 px-4 py-1 text-xs uppercase tracking-widest text-amber-300 border border-amber-500/40">
                    Ouvrage Majeur 2026
                  </span>
                  {featured.price && (
                    <span className="font-mono text-sm font-bold text-amber-400">
                      Prix : {featured.price}
                    </span>
                  )}
                </div>

                {featured.titleAr && (
                  <h3 className="font-serif text-2xl md:text-3xl text-amber-200 dir-rtl text-right">
                    {featured.titleAr}
                  </h3>
                )}

                <h2
                  className="font-serif text-3xl font-bold md:text-4xl text-paper cursor-pointer hover:text-amber-300 transition"
                  onClick={() => go(`#/publication/${featured.id}`)}
                >
                  {featured.title}
                </h2>

                <p className="text-sm leading-relaxed text-paper/80 font-light">
                  {featured.summary || featured.meta}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10 text-xs font-mono text-paper/60">
                  {featured.isbn && <span>ISBN: {featured.isbn}</span>}
                  {featured.publisher && <span>Éditeur: {featured.publisher}</span>}
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => setSelectedPubForOrder(featured)}
                    className="rounded-xl bg-amber-500 px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-amber-400 shadow-lg"
                  >
                    Commander / Réserver l'ouvrage
                  </button>
                  <button
                    onClick={() => go(`#/publication/${featured.id}`)}
                    className="rounded-xl border border-white/30 px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-paper transition hover:bg-white/10"
                  >
                    En savoir plus &amp; Sommaire
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* AUTRES PUBLICATIONS */}
        <div className="mt-14 grid gap-px bg-stone md:grid-cols-2 lg:grid-cols-3">
          {others.map((p, i) => (
            <Reveal key={p.id || i} delay={i * 80} className="bg-paper">
              <article className="flex h-full flex-col p-8">
                <span className="text-[11px] uppercase tracking-[0.3em] text-navy">{p.type}</span>
                <h3
                  className="mt-6 font-serif text-2xl leading-snug cursor-pointer hover:text-navy transition"
                  onClick={() => go(`#/publication/${p.id || "pub-" + i}`)}
                >
                  {p.title}
                </h3>
                <p className="mt-4 text-xs text-ink/70 font-light line-clamp-3">{p.summary}</p>
                <div className="mt-auto pt-8 flex items-center justify-between text-xs text-ink/60">
                  <span className="font-serif italic">{p.meta}</span>
                  <button
                    onClick={() => go(`#/publication/${p.id || "pub-" + i}`)}
                    className="font-medium text-navy uppercase tracking-wider hover:underline"
                  >
                    Fiche ➔
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
          <Reveal delay={400} className="bg-ink text-paper">
            <div className="flex h-full flex-col justify-between p-8">
              <p className="font-serif text-3xl italic leading-snug">« Le droit n'est pas une contrainte, c'est une stratégie. »</p>
              <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-stone/70">Cabinet Ajmi</p>
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

  const filteredPhotos =
    activeCategory === "all" ? c.galerie : c.galerie.filter((g) => g.category === activeCategory);

  return (
    <section id="galerie" className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <Reveal>
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-blue">Galerie HD Interactive</p>
          <h2 className="font-serif text-4xl md:text-6xl">{c.galerieIntro.titre}</h2>
          <p className="mt-6 max-w-2xl font-light leading-relaxed text-stone">{c.galerieIntro.texte}</p>
        </Reveal>

        {/* Onglets de filtrage par catégorie */}
        <div className="mt-10 flex flex-wrap gap-3 border-b border-white/10 pb-6">
          {galerieCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-full px-5 py-2.5 text-xs uppercase tracking-wider font-medium transition duration-300 ${
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
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {filteredPhotos.map((g, i) => (
            <Reveal key={g.id || i} delay={(i % 4) * 80} className={g.tall ? "row-span-2" : ""}>
              <figure
                className="group relative h-full cursor-zoom-in overflow-hidden rounded-xl bg-white/5 border border-white/10"
                onClick={() => setSelectedPhoto(g)}
              >
                <Img
                  src={mediaUrl(g.src)}
                  alt={g.legende}
                  className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
                    g.tall ? "aspect-[3/4] md:aspect-[3/5]" : "aspect-[4/3]"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
                  <span className="inline-block rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-black font-semibold w-fit mb-1">
                    {g.categoryLabel}
                  </span>
                  <p className="text-xs text-paper font-light">{g.legende}</p>
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
    <section className="mx-auto max-w-7xl px-6 py-28">
      <Reveal>
        <Label>Valeurs</Label>
        <p className="max-w-2xl text-base font-light leading-relaxed text-ink/80">{c.valeursTexte}</p>
      </Reveal>
      <ul className="mt-14 flex flex-wrap gap-x-10 gap-y-4">
        {c.valeurs.map((v, i) => (
          <Reveal key={i} delay={i * 80}>
            <li className="font-serif text-5xl md:text-7xl">{v}</li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function Clients() {
  const c = useContent();
  return (
    <section className="border-t border-stone">
      <div className="mx-auto max-w-7xl px-6 py-28">
        <Reveal>
          <Label>Ils nous ont fait confiance</Label>
          <p className="max-w-2xl text-base font-light leading-relaxed text-ink/80">
            Nous remercions nos clients et partenaires institutionnels, associatifs et économiques pour la confiance qu'ils nous témoignent
            au quotidien.
          </p>
        </Reveal>
        <ul className="mt-14 grid gap-px bg-stone sm:grid-cols-2 lg:grid-cols-3">
          {c.clients.map((x, i) => {
            const name = typeof x === "string" ? x : x.name;
            const logo = typeof x === "string" ? undefined : x.logo;
            return (
              <Reveal key={i} delay={i * 60} className="bg-paper">
                <li className="flex h-36 flex-col items-center justify-center gap-3 px-6 text-center">
                  {logo ? (
                    <>
                      <img
                        src={logo}
                        alt={name}
                        className="h-14 max-w-[140px] object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="text-xs font-light text-ink/60 uppercase tracking-widest">{name}</span>
                    </>
                  ) : (
                    <span className="font-serif text-xl md:text-2xl">{name}</span>
                  )}
                </li>
              </Reveal>
            );
          })}
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
  const input = "w-full border-b border-paper/30 bg-transparent py-3 text-paper placeholder:text-paper/40 focus:border-blue focus:outline-none";
  return (
    <section id="contact" className="bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-12 md:py-40">
        <Reveal className="md:col-span-5">
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-blue">Contact</p>
          <h2 className="font-serif text-5xl leading-tight md:text-6xl">
            Nous serions fiers de vous <span className="italic">accompagner.</span>
          </h2>
          <div className="mt-12 space-y-6 text-sm font-light text-stone">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-blue">Téléphone</p>
              <a href={c.contact.phoneHref} className="mt-1 block text-lg text-paper">{c.contact.phone}</a>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-blue">Email</p>
              <a href={`mailto:${c.contact.email}`} className="mt-1 block text-lg text-paper break-all">{c.contact.email}</a>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-blue">Adresse</p>
              <p className="mt-1 text-lg text-paper">{c.contact.address}</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={150} className="md:col-span-6 md:col-start-7">
          {sent ? (
            <p className="font-serif text-3xl italic">
              Merci, votre demande a bien été transmise au cabinet. Nous revenons vers vous dans les meilleurs délais.
            </p>
          ) : (
            <form onSubmit={submit} className="grid gap-8 sm:grid-cols-2">
              <input name="nom" required placeholder="Nom &amp; prénom" className={input} />
              <input name="tel" placeholder="Téléphone" className={input} />
              <input name="email" type="email" required placeholder="Email" className={input} />
              <select name="competence" className={`${input} appearance-none`} defaultValue="">
                <option value="" disabled className="text-ink">Pour quelle compétence ?</option>
                {c.domaines.map((d, i) => (
                  <option key={i} value={d.title} className="text-ink">{d.title}</option>
                ))}
              </select>
              <textarea name="message" rows={4} required placeholder="Message" className={`${input} sm:col-span-2`} />
              <div className="sm:col-span-2">
                <button disabled={busy} className="w-fit bg-paper px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-ink transition hover:bg-blue hover:text-ink disabled:opacity-50">
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
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-center font-serif text-3xl italic text-paper md:text-4xl">« {c.citationFooter.texte} »</p>
        <p className="mt-3 text-center text-[11px] uppercase tracking-[0.3em]">{c.citationFooter.auteur}</p>

        <div className="mt-16 grid gap-10 border-t border-paper/10 pt-12 md:grid-cols-4">
          <div>
            <p className="font-serif text-xl text-paper">Cabinet <span className="italic">Ajmi</span></p>
            <p className="mt-3 text-sm font-light leading-relaxed">{c.avocat.l1}</p>
          </div>
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-gold">Navigation</p>
            <ul className="space-y-2 text-sm font-light">
              {PAGES.map((p) => (
                <li key={p.path}><a href={`#${p.path}`} className="hover:text-paper">{p.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-gold">Domaines</p>
            <ul className="space-y-2 text-sm font-light">
              {c.domaines.slice(0, 5).map((d, i) => (
                <li key={i}><a href="#/services" className="hover:text-paper">{d.title}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-gold">Contact</p>
            <ul className="space-y-2 text-sm font-light">
              <li><a href={c.contact.phoneHref} className="hover:text-paper">{c.contact.phone}</a></li>
              <li><a href={`mailto:${c.contact.email}`} className="break-all hover:text-paper">{c.contact.email}</a></li>
              <li className="leading-relaxed">{c.contact.address}</li>
              <li><a href={c.contact.linkedin} target="_blank" rel="noreferrer" className="hover:text-paper">LinkedIn ↗</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-paper/10 pt-8 text-[11px] uppercase tracking-[0.25em] md:flex-row">
          <span>© {new Date().getFullYear()} Cabinet d'Avocat Ajmi — Monastir</span>
          <a href="#/admin" className="hover:text-paper">Administration</a>
        </div>
      </div>
    </footer>
  );
}
