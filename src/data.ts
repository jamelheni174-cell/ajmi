export const contact = {
  phone: "+216 54 311 937",
  phoneHref: "tel:+21654311937",
  email: "contact.anouarajmi@gmail.com",
  address: "Beb Brikcha – Résidence El Mabrouk, Bureau n°9, Monastir",
  linkedin: "https://www.linkedin.com/in/mohamed-anouar-ajmi",
  domain: "avocatmedanouarajmi.com",
};

export const competences = [
  "Création de startups & sociétés",
  "Droit de l'investissement",
  "Droit social",
  "Structuration juridique",
  "Contrats commerciaux",
  "Rédaction des contrats",
  "Régulation",
  "Contentieux commercial",
  "Responsabilité médicale",
  "Litiges liés aux services de santé",
  "Régimes matrimoniaux",
  "Gestion de patrimoine",
  "Droit des biens",
  "Affaires familiales",
  "Droits humains",
  "Politiques publiques",
  "Négociation & médiation",
  "Représentation devant les juridictions",
];

export const domaines = [
  {
    n: "01",
    title: "Droit des affaires",
    text: "Accompagnement global des acteurs économiques : création de sociétés et de startups, droit social, droit de l'investissement, structuration juridique, régulation et contentieux commercial.",
    items: [
      "Création de sociétés & startups",
      "Droit social",
      "Droit de l'investissement",
      "Structuration & gouvernance",
      "Contentieux commercial",
    ],
  },
  {
    n: "02",
    title: "Droit de la famille",
    text: "Conseil et représentation dans les affaires familiales : régimes matrimoniaux, divorce, filiation, successions et protection des intérêts familiaux.",
    items: [
      "Régimes matrimoniaux",
      "Divorce & séparation",
      "Filiation & autorité parentale",
      "Successions",
      "Médiation familiale",
    ],
  },
  {
    n: "03",
    title: "Droit médical",
    text: "Expertise dédiée aux professionnels de santé, aux structures médicales et à la gestion de la responsabilité et des litiges liés aux services de santé (Loi n°32 du 19 juin 2024).",
    items: [
      "Responsabilité médicale",
      "Droits des patients",
      "Indemnisation des préjudices",
      "Structures & établissements de santé",
      "Contentieux sanitaire",
    ],
  },
  {
    n: "04",
    title: "Droit des biens",
    text: "Conseil et contentieux en matière de patrimoine, propriété, copropriété, baux et gestion des biens immobiliers et mobiliers.",
    items: [
      "Propriété & copropriété",
      "Baux civils & commerciaux",
      "Gestion de patrimoine",
      "Transactions immobilières",
      "Litiges relatifs aux biens",
    ],
  },
  {
    n: "05",
    title: "Rédaction des contrats",
    text: "Rédaction, négociation et sécurisation de l'ensemble de vos actes et conventions : contrats commerciaux, conventions d'associés, protocoles et actes authentiques.",
    items: [
      "Contrats commerciaux",
      "Conventions d'associés",
      "Protocoles d'accord",
      "CGV & conditions contractuelles",
      "Négociation & sécurisation",
    ],
  },
];

export const experiences = [
  { role: "Avocat Consultant", org: "Association ATTALAKI" },
  {
    role: "Délégué international de l'Ordre des Avocats de Tunis",
    org: "Séminaire international « Russian Energy Week », Moscou — Fondation Roscongress",
  },
  { role: "Avocat Consultant — Projet VIH-DH", org: "Avocats Sans Frontières (ASF)" },
  { role: "Avocat Consultant", org: "Association Tunisienne des Femmes Démocrates (ATFD)" },
  { role: "Enseignant", org: "Université Centrale de Tunis" },
];

export interface PublicationItem {
  id: string;
  type: string;
  title: string;
  titleAr?: string;
  meta: string;
  publisher?: string;
  year?: string;
  isbn?: string;
  price?: string;
  coverImage?: string;
  summary?: string;
  summaryAr?: string;
  sommaire?: string[];
  featured?: boolean;
}

export const publications: PublicationItem[] = [
  {
    id: "ouvrage-2026",
    type: "Ouvrage Majeur 2026",
    title: "L'indemnisation des préjudices liés aux services de santé",
    titleAr: "التعويض عن الأضرار المرتبطة بالخدمات الصحية",
    meta: "Latrach Édition / مجمع الأطرش – Tunis, 2026 (Loi n°32 du 19 juin 2024)",
    publisher: "Latrach Édition / مجمع الأطرش",
    year: "2026",
    isbn: "978-9938-20-976-1",
    price: "12 TND (12 د.ت)",
    coverImage: "/images/book-cover.jpg",
    featured: true,
    summary:
      "Une analyse juridique approfondie de la Loi n°32 du 19 juin 2024 relative aux droits des patients et à la responsabilité médicale et sanitaire en Tunisie. Cet ouvrage décortique les mécanismes d'indemnisation des préjudices corporels, moraux et matériels subis dans le cadre des prestations de soin public et privé.",
    summaryAr:
      "دراسة قانونية معمقة حول القانون عدد 32 لسنة 2024 المتعلق بحقوق المرضى والمسؤولية الطبية والتعويض عن الأضرار الناجمة عن الخدمات الصحية في تونس.",
    sommaire: [
      "Chapitre 1 : Le cadre juridique réformé de la responsabilité médicale en Tunisie",
      "Chapitre 2 : Distinction entre faute médicale, aléa thérapeutique et défaut de sécurité",
      "Chapitre 3 : Les procédures d'expertise et d'évaluation des préjudices corporels",
      "Chapitre 4 : La réparation financière et le fonds de garantie indemnitaire",
      "Chapitre 5 : Jurisprudence comparée et recommandations pour les professionnels de santé",
    ],
  },
  {
    id: "devoir-obeissance",
    type: "Article de Doctrine",
    title: "Le devoir d'obéissance : un devoir légalement abrogé, socialement perpétué",
    meta: "Revue Tunisienne – Infos Juridiques",
    coverImage: "/images/article-devoir-obeissance.jpg",
    summary:
      "Étude sociologique et juridique sur l'évolution de la législation familiale tunisienne et l'écart entre le texte de loi et les pratiques juridictionnelles relatives au devoir d'obéissance.",
    sommaire: [
      "1. L'abrogation formelle du devoir d'obéissance dans le Code du Statut Personnel",
      "2. La persistance culturelle et l'interprétation des juges du fond",
      "3. Perspectives d'harmonisation avec la Constitution et les traités internationaux",
    ],
  },
  {
    id: "prix-asf-2024",
    type: "Prix Scientifique & Distinctions",
    title: "Premier prix du meilleur policy brief — « Le régime juridique des pratiques sexuelles en Tunisie »",
    meta: "Décerné par Avocats Sans Frontières (ASF)",
    summary:
      "Recherche primée analysant la conformité de l'article 230 du Code Pénal tunisien avec les engagements internationaux de la Tunisie en matière de droits fondamentaux.",
  },
  {
    id: "travailleuses-domestiques",
    type: "Policy Brief",
    title: "Les travailleuses domestiques en droit tunisien",
    meta: "Houloul.org",
    summary:
      "Analyse d'impact du cadre juridique régissant le travail domestique et propositions de réformes législatives pour garantir une couverture sociale et juridique adéquate.",
  },
  {
    id: "pratiques-sexuelles-droit",
    type: "Policy Brief",
    title: "Le régime juridique des pratiques sexuelles en Tunisie",
    meta: "Houloul.org",
    summary:
      "Étude critique du droit pénal tunisien et des atteintes aux libertés individuelles au prisme de la jurisprudence récente.",
  },
];

export interface ClientItem {
  name: string;
  logo?: string;
}

export const clients: ClientItem[] = [
  { name: "Avocats Sans Frontières (ASF)", logo: "/images/logo-asf.jpg" },
  { name: "Clinique Essouani Monastir", logo: "/images/logo-essouani.jpg" },
  { name: "ATTALAKI Organization", logo: "/images/logo-attalaki.jpg" },
  { name: "Association Tunisienne des Femmes Démocrates (ATFD)", logo: "/images/logo-atfd.jpg" },
  { name: "Société Up Views", logo: "/images/logo-upviews.jpg" },
  { name: "Santé Sud — Groupe SOS", logo: "/images/logo-santesud.jpg" },
  { name: "Société Nayssan pour la Création Théâtrale" },
  { name: "Société VIP Clean", logo: "/images/logo-vipclean.jpg" },
];

export const valeurs = ["Disponibilité", "Réactivité", "Rigueur", "Indépendance", "Engagement"];

/** Portrait institutionnel (robe d'avocat) — photo réelle portrait-avocat-2026.jpg */
export const portrait = "/images/portrait-avocat-2026.jpg";
/** Logo cabinet — PNG dark (teal) pour fonds clairs */
export const logoCabinet = "/images/logo-cabinet-dark.png";
/** Logo cabinet — PNG light (blanc) pour fonds sombres */
export const logoCabinetLight = "/images/logo-cabinet-light.png";

export interface GalerieItem {
  id: string;
  src: string;
  legende: string;
  category: "tribunal" | "conference" | "russie";
  categoryLabel: string;
  tall?: boolean;
}

export const galerieCategories = [
  { key: "all", label: "Toutes les photos" },
  { key: "tribunal", label: "Tribunal et expertise" },
  { key: "conference", label: "Conférence et diplomatie" },
  { key: "russie", label: "Russie et roscongress" },
] as const;

export const galerie: GalerieItem[] = [
  {
    id: "g1",
    src: "/images/da5e5897-bfbf-486e-a6eb-5716fd0d385a.jpg",
    legende: "",
    category: "russie",
    categoryLabel: "Russie et roscongress",
    tall: true,
  },
  {
    id: "g2",
    src: "/images/0c441d39-f461-4865-bc5b-dddfb4d9f2c0.jpg",
    legende: "",
    category: "conference",
    categoryLabel: "Conférence et diplomatie",
  },
  {
    id: "g3",
    src: "/images/bc541bcd-7950-4111-9cb7-c047691f682a.jpg",
    legende: "",
    category: "tribunal",
    categoryLabel: "Tribunal et expertise",
    tall: true,
  },
  {
    id: "g4",
    src: "/images/759709cc-6634-4f01-b055-3fb05b906838.jpg",
    legende: "",
    category: "russie",
    categoryLabel: "Russie et roscongress",
    tall: true,
  },
  {
    id: "g5",
    src: "/images/82f1ccdd-f76b-487e-957d-9736166c7fb8.jpg",
    legende: "",
    category: "tribunal",
    categoryLabel: "Tribunal et expertise",
  },
  {
    id: "g6",
    src: "/images/d8c38825-453a-48de-9728-b1803cead316.jpg",
    legende: "",
    category: "conference",
    categoryLabel: "Conférence et diplomatie",
  },
  {
    id: "g7",
    src: "/images/1e040771-b9c5-4aa8-a32f-2ed376a81166.jpg",
    legende: "",
    category: "russie",
    categoryLabel: "Russie et roscongress",
    tall: true,
  },
  {
    id: "g8",
    src: "/images/2a7f28e5-87e9-4a1f-831a-7f87822e8bcc.jpg",
    legende: "",
    category: "tribunal",
    categoryLabel: "Tribunal et expertise",
    tall: true,
  },
  {
    id: "g9",
    src: "/images/a85cd2cc-0663-48b6-b09e-2059ef7263aa.jpg",
    legende: "",
    category: "russie",
    categoryLabel: "Russie et roscongress",
    tall: true,
  },
  {
    id: "g10",
    src: "/images/b0bde2f1-f9a2-480a-8a0a-22527183da9a.jpg",
    legende: "",
    category: "tribunal",
    categoryLabel: "Tribunal et expertise",
  },
];
