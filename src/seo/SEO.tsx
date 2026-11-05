import { useEffect } from "react";
import { SITE_URL, legalServiceSchema, bookSchema, breadcrumbSchema } from "./schema";
import type { Publication } from "../store";

/**
 * SEO — lightweight head manager (no extra dep).
 * - Sets <title>, meta description, canonical, OG, Twitter, json-ld.
 * - Works with hash router today; will work identically after migration to history routing.
 * - Call inside each page component.
 */
type SEOProps = {
  title?: string;
  description?: string;
  canonicalPath?: string; // e.g. "/services" or "/publication/ouvrage-2026"
  ogImage?: string; // absolute or /images/...
  ogType?: "website" | "article" | "book";
  publication?: Publication; // if set, emits Book schema
  breadcrumbs?: { name: string; url: string }[];
  noindex?: boolean;
};

function upsertMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function SEO({
  title,
  description,
  canonicalPath = "/",
  ogImage,
  ogType = "website",
  publication,
  breadcrumbs,
  noindex,
}: SEOProps) {
  const fullTitle = title ? `${title} | Cabinet Ajmi — Avocat Monastir` : "Cabinet d'Avocat Ajmi | Affaires · Famille · Médical · Biens · Contrats — Monastir";
  const desc =
    description ||
    "Cabinet d'Avocat Ajmi — Me Mohamed Anouar Ajmi, Avocat près la Cour d'Appel à Monastir. Droit des affaires, famille, médical, biens et contrats. +216 54 311 937.";
  const canonical = `${SITE_URL}${canonicalPath}`;
  const image = ogImage?.startsWith("http") ? ogImage : `${SITE_URL}${ogImage || "/images/og-image.jpg"}`;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta("description", desc);
    upsertLink("canonical", canonical);

    // Open Graph
    upsertMeta("og:title", fullTitle, "property");
    upsertMeta("og:description", desc, "property");
    upsertMeta("og:url", canonical, "property");
    upsertMeta("og:type", ogType, "property");
    upsertMeta("og:image", image, "property");
    // Dimensions and MIME type below apply only to our default share image.
    // Publication covers can have different sizes and formats.
    for (const property of ["og:image:secure_url", "og:image:width", "og:image:height", "og:image:type"]) {
      document.querySelector(`meta[property="${property}"]`)?.remove();
    }
    if (image === `${SITE_URL}/images/og-image.jpg`) {
      upsertMeta("og:image:secure_url", image, "property");
      upsertMeta("og:image:width", "1200", "property");
      upsertMeta("og:image:height", "630", "property");
      upsertMeta("og:image:type", "image/jpeg", "property");
    }
    upsertMeta("og:image:alt", fullTitle, "property");
    upsertMeta("og:site_name", "Cabinet Ajmi", "property");
    upsertMeta("og:locale", "fr_TN", "property");

    // Twitter
    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", fullTitle);
    upsertMeta("twitter:description", desc);
    upsertMeta("twitter:image", image);
    upsertMeta("twitter:image:alt", fullTitle);

    // Robots
    if (noindex) upsertMeta("robots", "noindex, nofollow");
    else {
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }

    // JSON-LD — LegalService on home, Book on publication, Breadcrumbs everywhere
    if (canonicalPath === "/") {
      upsertJsonLd("ld-legalservice", legalServiceSchema());
    }
    if (publication) {
      upsertJsonLd("ld-book", bookSchema(publication as unknown as Parameters<typeof bookSchema>[0]));
    }
    if (breadcrumbs && breadcrumbs.length) {
      upsertJsonLd("ld-breadcrumb", breadcrumbSchema(breadcrumbs));
    }

    return () => {
      // keep tags — next page will overwrite
    };
  }, [fullTitle, desc, canonical, image, ogType, canonicalPath, publication, breadcrumbs, noindex]);

  return null;
}
