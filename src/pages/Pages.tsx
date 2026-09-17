import type { ReactElement } from "react";
import { useContent } from "../store";
import { Reveal } from "../components/Reveal";
import { Img } from "../components/Img";
import { PageCTA, PageHeader } from "../components/PageHeader";
import { mediaUrl } from "../backend";
import {
  Cabinet, Chiffres, Clients, Competences, Contact, Domaines, Galerie, Hero, Publications, Valeurs,
} from "../components/Sections";
import { PAGES } from "../router";

/* -------------------------- Sections d'accueil -------------------------- */

function SectionHead({ num, titre, lien }: { num: string; titre: string; lien?: { l: string; t: string } }) {
  return (
    <div className="mb-12 flex items-end justify-between gap-6">
      <div className="flex items-baseline gap-5">
        <span className="text-[11px] tracking-[0.3em] text-navy/50">{num}</span>
        <h2 className="font-serif text-3xl leading-tight md:text-5xl">{titre}</h2>
      </div>
      {lien && (
        <a href={lien.l} className="hidden shrink-0 border-b border-navy pb-1 text-[11px] uppercase tracking-[0.25em] md:block">
          {lien.t} ↗
        </a>
      )}
    </div>
  );
}

/** Sélection d'expériences (style « Sélection d'expériences » de la référence). */
function HomeExperiences() {
  const c = useContent();
  const items = c.experiences.slice(0, 4);
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <SectionHead num="01" titre="Sélection d'expériences" lien={{ l: "#/experiences", t: "Tout le parcours" }} />
        <ul className="divide-y divide-stone border-y border-stone">
          {items.map((e, i) => (
            <Reveal key={i} delay={i * 60}>
              <li className="group grid gap-3 py-8 md:grid-cols-12 md:items-baseline md:gap-10">
                <span className="text-[11px] tracking-[0.3em] text-navy/50 md:col-span-2">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-serif text-2xl leading-snug md:col-span-5 md:text-3xl">{e.role}</h3>
                <p className="text-sm font-light leading-relaxed text-ink/70 md:col-span-5">{e.org}</p>
              </li>
            </Reveal>
          ))}
        </ul>
        <a href="#/experiences" className="mt-8 inline-block border-b border-navy pb-1 text-[11px] uppercase tracking-[0.25em] md:hidden">
          Tout le parcours ↗
        </a>
      </div>
    </section>
  );
}

/** Publications récentes (3). */
function HomePublications() {
  const c = useContent();
  return (
    <section className="bg-stone/25">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <SectionHead num="02" titre="Réflexions & publications" lien={{ l: "#/actualites", t: "Toutes les actualités" }} />
        <div className="grid gap-px bg-stone md:grid-cols-3">
          {c.publications.slice(0, 3).map((p, i) => (
            <Reveal key={i} delay={i * 80} className="bg-paper">
              <article className="flex h-full flex-col p-8">
                <span className="text-[11px] uppercase tracking-[0.3em] text-navy">{p.type}</span>
                <h3 className="mt-6 font-serif text-2xl leading-snug">{p.title}</h3>
                <p className="mt-auto pt-8 text-sm font-light text-ink/60">{p.meta}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Aperçu galerie (4 images, mosaïque). */
function HomeGalerie() {
  const c = useContent();
  const photos = c.galerie.slice(0, 4);
  if (!photos.length) return null;
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <SectionHead num="03" titre="En images" lien={{ l: "#/experiences", t: "Toutes les photos" }} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {photos.map((g, i) => (
            <Reveal key={i} delay={i * 80}>
              <a href="#/experiences" className="block">
                <Img src={mediaUrl(g.src)} alt={g.legende} className={i === 0 ? "aspect-[3/4]" : "aspect-[3/4] md:aspect-square"} />
                <p className="mt-3 line-clamp-2 text-[10px] uppercase tracking-[0.18em] text-ink/55">{g.legende}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Lien direct vers la prise de contact. */
function HomeContact() {
  const c = useContent();
  return (
    <section className="bg-navy text-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-24">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.3em] text-blue">Contact</p>
          <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl">
            Nous serions fiers de vous <span className="italic">accompagner.</span>
          </h2>
          <p className="mt-6 max-w-md font-light leading-relaxed text-stone">
            Disponibilité, réactivité et rigueur analytique : exposons votre situation lors d'un premier échange.
          </p>
        </Reveal>
        <Reveal delay={120} className="space-y-5 md:pl-10">
          <a href={c.contact.phoneHref} className="flex items-center justify-between gap-4 border-b border-paper/20 pb-5 transition hover:border-blue">
            <span className="text-[11px] uppercase tracking-[0.3em] text-blue">Téléphone</span>
            <span className="font-serif text-2xl">{c.contact.phone}</span>
          </a>
          <a href={`mailto:${c.contact.email}`} className="flex items-center justify-between gap-4 border-b border-paper/20 pb-5 break-all transition hover:border-blue">
            <span className="shrink-0 text-[11px] uppercase tracking-[0.3em] text-blue">Email</span>
            <span className="text-right text-sm md:text-base">{c.contact.email}</span>
          </a>
          <div className="flex items-start justify-between gap-4 border-b border-paper/20 pb-5">
            <span className="pt-1 text-[11px] uppercase tracking-[0.3em] text-blue">Cabinet</span>
            <span className="text-right text-sm leading-relaxed">{c.contact.address}</span>
          </div>
          <a href="#/contact" className="inline-block rounded-xl bg-paper px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-navy transition hover:bg-blue">
            Écrire au cabinet
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- Accueil ------------------------------- */

export function HomePage() {
  const c = useContent();
  return (
    <>
      {/* Hero + présentation Cabinet/Avocat (photo + texte) bien visibles en haut */}
      <Hero />
      <Cabinet />
      {/* Clients / références animés juste sous la présentation */}
      <Clients variant="marquee" />
      <Chiffres />
      <Domaines />
      <Competences />
      <HomeExperiences />
      <HomePublications />
      <HomeGalerie />
      <HomeContact />
      <section className="bg-ink py-20 text-center text-paper">
        <p className="font-serif text-2xl italic md:text-3xl">« {c.cabinet.citation} »</p>
      </section>
    </>
  );
}

/* ------------------------------ Le Cabinet ------------------------------ */

export function CabinetPage() {
  const c = useContent();
  return (
    <>
      <PageHeader kicker="Présentation" titre={c.cabinet.titre} intro={`${c.avocat.nom} — ${c.avocat.l1}`} />
      {/* Présentation unifiée Cabinet + Avocat avec photo en haut */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-start gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <Img
              src={mediaUrl(c.avocat.portrait)}
              alt={c.avocat.nom}
              className="aspect-[4/5] w-full rounded-2xl"
              imgClassName="object-cover object-top"
            />
            <div className="mt-6 space-y-1">
              <p className="font-serif text-2xl">{c.avocat.nom}</p>
              <p className="text-sm font-light text-ink/70">{c.avocat.l1}</p>
              <p className="text-sm font-light text-ink/70">{c.avocat.l2}</p>
              <a
                href={c.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block border-b border-ink pb-1 text-[11px] uppercase tracking-[0.25em]"
              >
                Profil LinkedIn ↗
              </a>
            </div>
          </Reveal>
          <Reveal delay={120} className="space-y-6 text-[15px] font-light leading-[1.95] text-ink/80 md:col-span-7 md:text-base">
            <p>{c.cabinet.p1}</p>
            <p>{c.cabinet.p2}</p>
            <p className="border-l-2 border-navy pl-6 font-serif text-2xl italic leading-snug text-ink">
              « {c.cabinet.citation} »
            </p>
          </Reveal>
        </div>
      </section>
      <Clients variant="marquee" />
      <Chiffres />
      <Valeurs />
      <PageCTA />
    </>
  );
}

/* ----------------------------- Compétences ----------------------------- */

export function CompetencesPage() {
  const c = useContent();
  return (
    <>
      <PageHeader
        kicker="Compétences"
        titre="Un savoir-faire technique au service de votre stratégie."
        intro="Le cabinet intervient en conseil comme en contentieux, pour les entreprises, les professionnels de santé, les particuliers et les organisations."
      />
      <section className="mx-auto max-w-7xl px-6 py-24">
        <ul className="grid gap-px bg-stone sm:grid-cols-2 lg:grid-cols-3">
          {c.competences.map((x, i) => (
            <Reveal key={i} delay={(i % 3) * 80} className="bg-paper">
              <li className="flex h-full items-center gap-4 p-7">
                <span className="text-[11px] tracking-[0.2em] text-navy">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-xl leading-snug">{x}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>
      <Domaines />
      <PageCTA titre="Besoin d'une compétence précise ? Parlons-en." />
    </>
  );
}

/* -------------------------------- Services ------------------------------- */

export function ServicesPage() {
  const c = useContent();
  return (
    <>
      <PageHeader
        kicker="Nos services"
        titre="Domaines d'intervention"
        intro="Cinq pôles d'expertise structurés selon votre vision : droit des affaires, famille, médical, biens et rédaction des contrats."
      />
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="space-y-px bg-stone">
          {c.domaines.map((d, i) => (
            <Reveal key={i} delay={i * 60} className="bg-paper">
              <article className="grid gap-6 p-8 md:grid-cols-12 md:gap-10 md:p-12">
                <p className="text-[11px] tracking-[0.3em] text-navy md:col-span-1">{d.n}</p>
                <div className="md:col-span-4">
                  <h2 className="font-serif text-3xl leading-tight md:text-4xl">{d.title}</h2>
                </div>
                <div className="md:col-span-7">
                  <p className="text-[15px] font-light leading-[1.9] text-ink/75">{d.text}</p>
                  {d.items && d.items.length > 0 && (
                    <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                      {d.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-ink/70">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
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
      </section>
      <Valeurs />
      <PageCTA />
    </>
  );
}

/* ------------------------------ Expériences ------------------------------ */

export function ExperiencesPage() {
  const c = useContent();
  return (
    <>
      <PageHeader
        kicker="Sélection d'expériences"
        titre="Engagements professionnels & missions"
        intro="Une pratique nourrie par le conseil aux entreprises, l'expertise auprès d'organisations internationales et l'enseignement."
      />
      <section className="mx-auto max-w-7xl px-6 py-24">
        <ul className="grid gap-px bg-stone md:grid-cols-2">
          {c.experiences.map((e, i) => (
            <Reveal key={i} delay={(i % 2) * 80} className="bg-paper">
              <li className="flex h-full flex-col p-8 md:p-10">
                <span className="text-[11px] tracking-[0.3em] text-navy">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-6 font-serif text-2xl leading-snug">{e.role}</h2>
                <p className="mt-auto pt-6 text-sm font-light leading-relaxed text-ink/65">{e.org}</p>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>
      <Galerie />
      <PageCTA titre="Vous souhaitez confier une mission au cabinet ?" />
    </>
  );
}

/* -------------------------------- L'Avocat ------------------------------- */

export function AvocatPage() {
  const c = useContent();
  return (
    <>
      <PageHeader kicker="L'avocat" titre={c.avocat.nom} intro={`${c.avocat.l1} — ${c.avocat.l2}`} />
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-14 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <Img src={mediaUrl(c.avocat.portrait)} alt={c.avocat.nom} className="aspect-[4/5] w-full" />
            <a
              href={c.contact.linkedin}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block border-b border-ink pb-1 text-[11px] uppercase tracking-[0.25em]"
            >
              Profil LinkedIn ↗
            </a>
          </Reveal>
          <Reveal delay={150} className="space-y-6 text-[15px] font-light leading-[1.95] text-ink/80 md:col-span-6 md:col-start-7">
            <p>{c.cabinet.p1}</p>
            <p>{c.cabinet.p2}</p>
            <div className="border-t border-stone pt-8">
              <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-navy">Engagements</p>
              <ul className="space-y-4">
                {c.experiences.map((e, i) => (
                  <li key={i}>
                    <p className="font-serif text-lg text-ink">{e.role}</p>
                    <p className="text-sm text-ink/60">{e.org}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
      <Valeurs />
      <PageCTA />
    </>
  );
}

/* ------------------------------- Actualités ------------------------------ */

export function ActualitesPage() {
  return (
    <>
      <PageHeader
        kicker="Publications, prix & contributions"
        titre="Articles & Actualités"
        intro="Ouvrages, articles de doctrine et policy briefs — une pratique du droit nourrie par la recherche."
      />
      <Publications />
      <Galerie />
      <PageCTA titre="Une question sur une publication ? Écrivez-nous." />
    </>
  );
}

/* -------------------------------- Contact -------------------------------- */

export function ContactPage() {
  const c = useContent();
  return (
    <>
      <PageHeader
        kicker="Contact"
        titre="Nous serions fiers de vous accompagner."
        intro={`Cabinet d'Avocat Ajmi — ${c.contact.address}`}
      />
      <Contact />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-px bg-stone md:grid-cols-3">
          {[
            { t: "Horaires", v: "Lundi – Vendredi, 9h – 18h\nSamedi sur rendez-vous" },
            { t: "Premier rendez-vous", v: "Échange préalable afin de cerner vos besoins et définir la stratégie adaptée." },
            { t: "Confidentialité", v: "Tout échange avec le cabinet est couvert par le secret professionnel." },
          ].map((b, i) => (
            <Reveal key={i} delay={i * 80} className="bg-paper">
              <div className="h-full p-8">
                <p className="text-[11px] uppercase tracking-[0.3em] text-navy">{b.t}</p>
                <p className="mt-4 whitespace-pre-line text-sm font-light leading-relaxed text-ink/75">{b.v}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

/* --------------------------------- 404 ----------------------------------- */

export function NotFoundPage() {
  return (
    <>
      <PageHeader kicker="Erreur 404" titre="Cette page n'existe pas." intro="Le lien suivi est peut-être obsolète." />
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-wrap gap-4">
          {PAGES.map((p) => (
            <a key={p.path} href={`#${p.path}`} className="border border-stone px-6 py-3 text-[11px] uppercase tracking-[0.2em] hover:bg-navy hover:text-paper">
              {p.label}
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

import { SuiviPage } from "./SuiviPage";

export const ROUTES: Record<string, () => ReactElement> = {
  "/": HomePage,
  "/cabinet": CabinetPage,
  "/competences": CompetencesPage,
  "/services": ServicesPage,
  "/experiences": ExperiencesPage,
  "/avocat": AvocatPage,
  "/actualites": ActualitesPage,
  "/suivi": SuiviPage,
  "/contact": ContactPage,
};

