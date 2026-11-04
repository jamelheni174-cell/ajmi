/**
 * Schema.org factories for Cabinet Ajmi — LegalService + Book + Breadcrumb
 * Used by src/seo/SEO.tsx and php/sitemap.php (via JSON export)
 */
export const SITE_URL = "https://cabinetmaitreajmi.tn";
export const SITE_NAME = "Cabinet d'Avocat Me Mohamed Anouar Ajmi";
export const LOGO = `${SITE_URL}/images/logo-cabinet-dark.png`;
export const HERO = `${SITE_URL}/images/hero.jpg`;

export function legalServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": `${SITE_URL}/#legalservice`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO,
    image: HERO,
    description:
      "Cabinet d'Avocat à Monastir — Droit des affaires, famille, médical, biens et contrats. Fondé par Me Mohamed Anouar Ajmi, Avocat près la Cour d'Appel.",
    foundingDate: "1998",
    founder: {
      "@type": "Person",
      name: "Me Mohamed Anouar Ajmi",
      jobTitle: "Avocat près la Cour d'Appel — Expert Droits Humains",
      sameAs: ["https://www.linkedin.com/"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Beb Brikcha – Résidence El Mabrouk, Bureau n°9",
      addressLocality: "Monastir",
      addressRegion: "Monastir",
      postalCode: "5000",
      addressCountry: "TN",
    },
    geo: { "@type": "GeoCoordinates", latitude: 35.7643, longitude: 10.8113 },
    telephone: "+21654311937",
    email: "contact.anouarajmi@gmail.com",
    areaServed: [
      { "@type": "City", name: "Monastir" },
      { "@type": "City", name: "Sousse" },
      { "@type": "City", name: "Tunis" },
      { "@type": "City", name: "Mahdia" },
    ],
    knowsAbout: [
      "Droit des affaires",
      "Droit de la famille",
      "Droit médical",
      "Droit des biens",
      "Rédaction des contrats",
    ],
    priceRange: "€€",
    openingHours: "Mo-Fr 08:30-17:30",
    sameAs: [SITE_URL],
  };
}

export function bookSchema(pub: {
  id?: string;
  title: string;
  titleAr?: string;
  meta: string;
  isbn?: string;
  publisher?: string;
  coverImage?: string;
  summary?: string;
  price?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${SITE_URL}/publication/${pub.id || "ouvrage-2026"}#book`,
    name: pub.title,
    alternateName: pub.titleAr || undefined,
    author: { "@type": "Person", name: "Me Mohamed Anouar Ajmi" },
    publisher: pub.publisher ? { "@type": "Organization", name: pub.publisher } : undefined,
    isbn: pub.isbn || undefined,
    image: pub.coverImage ? `${SITE_URL}${pub.coverImage}` : HERO,
    description: pub.summary || pub.meta,
    inLanguage: pub.titleAr ? ["fr", "ar"] : "fr",
    url: `${SITE_URL}/publication/${pub.id || "ouvrage-2026"}`,
    offers: pub.price
      ? {
          "@type": "Offer",
          price: pub.price.replace(/[^\d.,]/g, "") || undefined,
          priceCurrency: "TND",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/publication/${pub.id || "ouvrage-2026"}`,
        }
      : undefined,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function faqSchema(qas: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map((x) => ({
      "@type": "Question",
      name: x.q,
      acceptedAnswer: { "@type": "Answer", text: x.a },
    })),
  };
}
