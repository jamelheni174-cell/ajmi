import { createContext, useContext } from "react";
import * as d from "./data";
import type { ClientItem } from "./data";

export type Domaine = { n: string; title: string; text: string; items?: string[] };
export type Experience = { role: string; org: string };
export type Publication = {
  type: string;
  title: string;
  meta: string;
  id?: string;
  featured?: boolean;
  titleAr?: string;
  isbn?: string;
  price?: string;
  publisher?: string;
  coverImage?: string;
  summary?: string;
  summaryAr?: string;
  sommaire?: string[];
  year?: string;
};
export type Photo = {
  src: string;
  legende: string;
  tall?: boolean;
  category?: string;
  categoryLabel?: string;
  id?: string;
};

export type Content = {
  hero: { kicker: string; titre: string; titreItalic: string; sous: string };
  contact: typeof d.contact;
  cabinet: { titre: string; p1: string; p2: string; citation: string };
  chiffres: { v: string; l: string }[];
  domaines: Domaine[];
  competences: string[];
  avocat: { nom: string; l1: string; l2: string; portrait: string };
  experiences: Experience[];
  publications: Publication[];
  galerie: Photo[];
  galerieIntro: { titre: string; texte: string };
  valeurs: string[];
  valeursTexte: string;
  clients: ClientItem[];
  citationFooter: { texte: string; auteur: string };
  logo: string;
  logoLight: string;
};

export const defaultContent: Content = {
  hero: {
    kicker: "Avocat près la Cour d'Appel — Monastir",
    titre: "Rigueur",
    titreItalic: "Engagement",
    sous: "Le partenaire stratégique des entrepreneurs, des professionnels de santé et des organisations.",
  },
  contact: d.contact,
  cabinet: {
    titre: "Le Cabinet & Maître Mohamed Anouar Ajmi",
    p1: "Le Cabinet d'Avocat Ajmi, fondé par Maître Mohamed Anouar Ajmi, Avocat près la Cour d'Appel et expert en droits humains et politiques publiques, propose une approche juridique rigoureuse, moderne et personnalisée. Véritable partenaire stratégique des entrepreneurs, des investisseurs et des entreprises, le cabinet vous accompagne dès la genèse de vos projets : création de startups, structuration, choix de la forme sociale et sécurisation juridique de vos implantations.",
    p2: "Fort d'une double expertise en conseil et en contentieux, Maître Ajmi accompagne également les particuliers et les organisations nationales et internationales. Ses domaines d'intervention privilégiés couvrent le droit des affaires, le droit de la famille, le droit médical, le droit des biens et la rédaction des contrats — en combinant une solide maîtrise technique du droit positif avec une vision stratégique ancrée dans la défense des droits humains et des politiques publiques.",
    citation:
      "En nous plaçant au cœur de votre stratégie, nous faisons de la disponibilité, de la réactivité et de la rigueur analytique les maîtres-mots de notre engagement.",
  },
  chiffres: [
    { v: "5", l: "domaines d'expertise" },
    { v: "3", l: "ONG de référence accompagnées" },
    { v: "5", l: "publications & contributions" },
    { v: "1", l: "ouvrage de référence, 2026" },
  ],
  domaines: d.domaines,
  competences: d.competences,
  avocat: {
    nom: "Maître Mohamed Anouar Ajmi",
    l1: "Avocat près la Cour d'Appel",
    l2: "Expert en Droits Humains et Politiques Publiques",
    portrait: d.portrait,
  },
  experiences: d.experiences,
  publications: d.publications,
  galerie: d.galerie,
  galerieIntro: {
    titre: "Engagements & rencontres internationales",
    texte:
      "Délégué international de l'Ordre des Avocats de Tunis, Maître Ajmi représente le barreau tunisien dans les forums internationaux et intervient régulièrement auprès des organisations de la société civile.",
  },
  valeurs: d.valeurs,
  valeursTexte:
    "Au travers du cabinet, nous sommes engagés aux côtés d'organisations de la société civile, pour porter des réformes conformes aux standards internationaux des droits humains.",
  clients: d.clients,
  citationFooter: { texte: "La justice est la vérité en action.", auteur: "Joseph Joubert" },
  logo: d.logoCabinet,
  logoLight: d.logoCabinetLight,
};

/** Bump key to invalidate stale localStorage after structure / assets changes */
const KEY = "ajmi-content-v5";

export function loadContent(): Content {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultContent;
    const parsed = JSON.parse(raw) as Partial<Content>;
    return {
      ...defaultContent,
      ...parsed,
      // Always prefer fresh domaines / clients / assets from code defaults when merging
      domaines: parsed.domaines?.length ? parsed.domaines : defaultContent.domaines,
      clients: defaultContent.clients,
      logo: defaultContent.logo,
      logoLight: defaultContent.logoLight,
      avocat: {
        ...defaultContent.avocat,
        ...(parsed.avocat ?? {}),
        // Keep the real portrait unless admin uploaded a custom one (data:/http)
        portrait:
          parsed.avocat?.portrait &&
          (parsed.avocat.portrait.startsWith("data:") ||
            parsed.avocat.portrait.startsWith("http"))
            ? parsed.avocat.portrait
            : defaultContent.avocat.portrait,
      },
      publications: defaultContent.publications,
      cabinet: { ...defaultContent.cabinet, ...(parsed.cabinet ?? {}) },
      contact: { ...defaultContent.contact, ...(parsed.contact ?? {}) },
    };
  } catch {
    return defaultContent;
  }
}

export function saveContent(c: Content) {
  localStorage.setItem(KEY, JSON.stringify(c));
}

export function resetContent() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("ajmi-content-v1");
}

export const ContentCtx = createContext<Content>(defaultContent);
export const useContent = () => useContext(ContentCtx);

export const ADMIN_PASSWORD = "ajmi2026";
