export const contact = {
  phone: "+216 54 311 937",
  phoneHref: "tel:+21654311937",
  email: "contact.anouarajmi@gmail.com",
  address: "Beb Brikcha – Résidence El Mabrouk, Bureau n°9, Monastir",
  linkedin: "https://www.linkedin.com/in/mohamed-anouar-ajmi",
};

export const competences = [
  "Création de startups & sociétés",
  "Structuration juridique",
  "Contrats commerciaux",
  "Régulation",
  "Contentieux commercial",
  "Responsabilité médicale",
  "Litiges liés aux services de santé",
  "Régimes matrimoniaux",
  "Gestion de patrimoine",
  "Affaires familiales",
  "Droits humains",
  "Politiques publiques",
  "Négociation & médiation",
  "Représentation devant les juridictions",
];

export const domaines = [
  {
    n: "01",
    title: "Droit des Affaires & Startups",
    text: "Accompagnement global des acteurs économiques, de la création d'entreprises et de sociétés jusqu'à la gestion des contrats, de la régulation et du contentieux commercial.",
  },
  {
    n: "02",
    title: "Droit Médical & Santé",
    text: "Une expertise dédiée aux professionnels de la santé, aux structures médicales et à la gestion de la responsabilité et des litiges liés aux services de santé (Loi n°32-2024).",
  },
  {
    n: "03",
    title: "Droit de la Famille & des Biens",
    text: "Conseil et représentation dans la gestion des patrimoines, des régimes matrimoniaux et des affaires familiales.",
  },
  {
    n: "04",
    title: "Droits Humains & Politiques Publiques",
    text: "Un ancrage fort aux côtés d'organisations de référence (Attalaki, Avocats Sans Frontières, ATFD) pour expertiser, concevoir et porter des réformes conformes aux standards internationaux.",
  },
  {
    n: "05",
    title: "Contentieux & Arbitrage",
    text: "Prévention des risques et résolution des différends, tant en phase amiable que devant les juridictions.",
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
      "دراسة قانونية معمقة حول القانون عدد 32 لسنة 2024 المتعلق بحقوق المرضى والمسؤولية الطبية والتحويض عن الأضرار الناجمة عن الخدمات الصحية في تونس.",
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
  { name: "Société Nayssan pour la Création Théâtrale" },
  { name: "Société VIP Clean", logo: "/images/logo-vipclean.jpg" },
];

export const valeurs = ["Disponibilité", "Réactivité", "Rigueur", "Indépendance", "Engagement"];

export const portrait = "/images/486ba859-1ec9-45bd-8e18-8f29f9d98281.jpg";

export interface GalerieItem {
  id: string;
  src: string;
  legende: string;
  category: "moscou" | "tribunaux" | "conferences";
  categoryLabel: string;
  tall?: boolean;
}

export const galerieCategories = [
  { key: "all", label: "Toutes les photos" },
  { key: "moscou", label: "Moscou & Roscongress" },
  { key: "tribunaux", label: "Tribunaux & Droit" },
  { key: "conferences", label: "Conférences & Diplomatie" },
] as const;

export const galerie: GalerieItem[] = [
  {
    id: "g1",
    src: "/images/01855efd-b76a-40ba-9a87-2d6202175b07.jpg",
    legende: "Robe d'avocat officielle — Me Mohamed Anouar Ajmi à la Cour d'Appel",
    category: "tribunaux",
    categoryLabel: "Tribunaux & Droit",
    tall: true,
  },
  {
    id: "g2",
    src: "/images/1332a65d-8162-4a31-8311-680c297db7f0.jpg",
    legende: "Russian Energy Week 2025 — Plénière officielle à Moscou (Fondation Roscongress)",
    category: "moscou",
    categoryLabel: "Moscou & Roscongress",
    tall: true,
  },
  {
    id: "g3",
    src: "/images/2264c80d-f0d3-4f13-bd38-e44c086c1e92.jpg",
    legende: "Conférence Santé Sud — Faculté de Médecine de Sousse",
    category: "conferences",
    categoryLabel: "Conférences & Diplomatie",
    tall: false,
  },
  {
    id: "g4",
    src: "/images/26c15f9d-6601-4550-9761-b0a6620827b1.jpg",
    legende: "Intervention — Forum Droit & Libertés (ATTALAKI / ASF)",
    category: "conferences",
    categoryLabel: "Conférences & Diplomatie",
    tall: false,
  },
  {
    id: "g5",
    src: "/images/2af0ac76-eb64-4f59-ae01-55578ac53f6e.jpg",
    legende: "Session de formation juridique — Droit médical et santé publique",
    category: "conferences",
    categoryLabel: "Conférences & Diplomatie",
    tall: false,
  },
  {
    id: "g6",
    src: "/images/31eed103-c2ad-4397-9df5-4ca243f6fa5d.jpg",
    legende: "Délégation des jeunes juristes — Gostiny Dvor, Moscou",
    category: "moscou",
    categoryLabel: "Moscou & Roscongress",
    tall: false,
  },
  {
    id: "g7",
    src: "/images/37b970a6-491d-4871-a251-dd1c4d31acbe.jpg",
    legende: "Place Rouge & Kremlin — Représentation internationale à Moscou",
    category: "moscou",
    categoryLabel: "Moscou & Roscongress",
    tall: true,
  },
  {
    id: "g8",
    src: "/images/486ba859-1ec9-45bd-8e18-8f29f9d98281.jpg",
    legende: "Portrait institutionnel — Me Mohamed Anouar Ajmi",
    category: "tribunaux",
    categoryLabel: "Tribunaux & Droit",
    tall: true,
  },
  {
    id: "g9",
    src: "/images/4f9ca4fc-3bf1-4a43-b046-48259a473743.jpg",
    legende: "Accréditation et badge officiel — Forum Roscongress Moscou",
    category: "moscou",
    categoryLabel: "Moscou & Roscongress",
    tall: false,
  },
  {
    id: "g10",
    src: "/images/6914297a-890e-410f-a4d8-7ed107f41abc.jpg",
    legende: "Audience et plaidoirie — Palais de Justice de Monastir",
    category: "tribunaux",
    categoryLabel: "Tribunaux & Droit",
    tall: false,
  },
  {
    id: "g11",
    src: "/images/87991c6c-9822-4f69-8ec7-ca907a7393b9.jpg",
    legende: "Table ronde internationale sur le droit de la santé",
    category: "conferences",
    categoryLabel: "Conférences & Diplomatie",
    tall: false,
  },
  {
    id: "g12",
    src: "/images/88dde3ca-ba8b-4ca0-9f56-f16006bc8ed1.jpg",
    legende: "Conférence diplomatique avec la délégation de l'Ordre des Avocats",
    category: "moscou",
    categoryLabel: "Moscou & Roscongress",
    tall: false,
  },
  {
    id: "g13",
    src: "/images/8a3d38db-8d6b-472b-a703-911a8672180c.jpg",
    legende: "Symposium Avocats Sans Frontières — Présentation du Policy Brief",
    category: "conferences",
    categoryLabel: "Conférences & Diplomatie",
    tall: false,
  },
  {
    id: "g14",
    src: "/images/94381ede-6677-4caa-93f9-fba46d6f1732.jpg",
    legende: "Atelier de rédaction juridique pour la révision de la Loi Santé",
    category: "tribunaux",
    categoryLabel: "Tribunaux & Droit",
    tall: false,
  },
  {
    id: "g15",
    src: "/images/b2bc23cd-46d7-445b-b5b4-58a32c766e60.jpg",
    legende: "Rencontre bilatérale avec les représentants de la Fondation Roscongress",
    category: "moscou",
    categoryLabel: "Moscou & Roscongress",
    tall: false,
  },
  {
    id: "g16",
    src: "/images/c2a3136e-dda2-4515-95d1-148a7b1753e5.jpg",
    legende: "Colloque universitaire — Faculté de Droit",
    category: "conferences",
    categoryLabel: "Conférences & Diplomatie",
    tall: false,
  },
  {
    id: "g17",
    src: "/images/c6366b57-1b61-45d4-b71c-c90944f96a9a.jpg",
    legende: "Consultation juridique et signature de convention d'accompagnement",
    category: "tribunaux",
    categoryLabel: "Tribunaux & Droit",
    tall: false,
  },
  {
    id: "g18",
    src: "/images/cacdbc45-029c-45b3-95a8-485e87464d21.jpg",
    legende: "Présentation officielle de l'ouvrage 2026 sur la responsabilité médicale",
    category: "tribunaux",
    categoryLabel: "Tribunaux & Droit",
    tall: false,
  },
  {
    id: "g19",
    src: "/images/d39147cc-5eeb-4844-9c4b-2bd1d0b4e1f2.jpg",
    legende: "Comité d'experts juristes — Élaboration de recommandations de réformes",
    category: "conferences",
    categoryLabel: "Conférences & Diplomatie",
    tall: false,
  },
  {
    id: "g20",
    src: "/images/e61b13a4-f9b7-48fa-88b8-de430d29f602.jpg",
    legende: "Délégation officielle — Ordre des Avocats de Tunis",
    category: "moscou",
    categoryLabel: "Moscou & Roscongress",
    tall: false,
  },
];
