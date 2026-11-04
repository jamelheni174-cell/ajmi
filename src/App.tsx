import { useEffect, useState } from "react";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Sections";
import { Admin } from "./admin/Admin";
import { Setup } from "./admin/Setup";
import { ContentCtx, loadContent, mergeContent, saveContent, type Content } from "./store";
import { fetchContent, ping } from "./backend";
import { NotFoundPage, ROUTES } from "./pages/Pages";
import { getPublicationIdFromRoute, useRoute } from "./router";
import { PublicationDetail } from "./pages/PublicationDetail";
import { SEO } from "./seo/SEO";

export default function App() {
  const [content, setContent] = useState<Content>(() => loadContent());
  const route = useRoute();

  useEffect(() => {
    // Purge anciens caches locaux pour forcer logos / portrait / domaines à jour
    try {
      localStorage.removeItem("ajmi-content-v1");
      localStorage.removeItem("ajmi-content-v2");
      localStorage.removeItem("ajmi-content-v3");
      localStorage.removeItem("ajmi-content-v4");
    } catch {
      /* ignore */
    }
    void (async () => {
      if (!(await ping())) return;
      const c = await fetchContent();
      if (c) {
        // Un contenu incomplet (import, ancienne version) ne doit jamais
        // empêcher l'affichage : on complète avec les valeurs par défaut.
        const merged = mergeContent(c);
        setContent(merged);
        saveContent(merged);
      }
    })();
  }, []);

  // SEO par route (clean URLs)
  const seoMap: Record<string, { title: string; description: string; ogImage?: string }> = {
    "/": {
      title: "Cabinet d'Avocat Ajmi — Avocat Monastir",
      description:
        "Me Mohamed Anouar Ajmi, Avocat près la Cour d'Appel à Monastir. Droit des affaires, famille, médical, biens et contrats. 5 domaines, 25 ans d'expertise. Devis gratuit au +216 54 311 937.",
      ogImage: "/images/hero.jpg",
    },
    "/services": {
      title: "Domaines d'intervention",
      description:
        "Les 5 domaines du Cabinet Ajmi : droit des affaires, famille, médical, biens et contrats. Conseil & contentieux à Monastir, Sousse et Tunis.",
    },
    "/competences": {
      title: "Compétences",
      description: "Expertises du Cabinet Ajmi : structuration juridique, contentieux commercial, arbitrage, droit social et accompagnement startups.",
    },
    "/experiences": {
      title: "Expériences & Parcours",
      description: "Parcours de Me Anouar Ajmi — engagements, distinctions et références associatives et institutionnelles.",
    },
    "/actualites": {
      title: "Publications & Ouvrage 2026",
      description: "Publications de Me Ajmi : ouvrage 2026 sur l'indemnisation du préjudice médical (ISBN 978-9938-20-976-1), articles et prix ASF.",
      ogImage: "/images/book-cover.jpg",
    },
    "/contact": {
      title: "Contact — Cabinet Ajmi Monastir",
      description: "Contactez le Cabinet Ajmi à Monastir : Beb Brikcha – Résidence El Mabrouk, +216 54 311 937, contact.anouarajmi@gmail.com. Devis sous 24h.",
    },
    "/suivi": {
      title: "Suivi de commande",
      description: "Suivez votre commande d'ouvrage avec votre code RES-#. Livraison à Monastir et partout en Tunisie.",
    },
  };

  if (route.startsWith("/admin/setup")) return <Setup />;
  if (route.startsWith("/admin")) return <Admin content={content} setContent={setContent} />;

  const pubId = getPublicationIdFromRoute(route);
  const seo = pubId ? null : seoMap[route] || seoMap["/"];
  const is404 = !pubId && !ROUTES[route as keyof typeof ROUTES] && route !== "/";

  return (
    <ContentCtx.Provider value={content}>
      {/* SEO global — override sur PublicationDetail */}
      {!pubId && (
        <SEO
          title={seo?.title}
          description={seo?.description}
          canonicalPath={route}
          ogImage={seo?.ogImage}
          ogType="website"
          noindex={is404}
          breadcrumbs={
            route !== "/"
              ? [
                  { name: "Accueil", url: "https://cabinetmaitreajmi.tn/" },
                  { name: seo?.title || route, url: `https://cabinetmaitreajmi.tn${route}` },
                ]
              : undefined
          }
        />
      )}
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-sage" />
      <Nav route={route} />
      <main>
        {pubId ? <PublicationDetail publicationId={pubId} /> : (() => {
          const Page = ROUTES[route] ?? NotFoundPage;
          return <Page />;
        })()}
      </main>
      <Footer />
    </ContentCtx.Provider>
  );
}
