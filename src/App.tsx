import { useEffect, useState } from "react";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Sections";
import { Admin } from "./admin/Admin";
import { Setup } from "./admin/Setup";
import { ContentCtx, loadContent, saveContent, type Content } from "./store";
import { fetchContent, ping } from "./backend";
import { NotFoundPage, ROUTES } from "./pages/Pages";
import { getPublicationIdFromRoute, useRoute } from "./router";
import { PublicationDetail } from "./pages/PublicationDetail";

export default function App() {
  const [content, setContent] = useState<Content>(() => loadContent());
  const route = useRoute();

  useEffect(() => {
    void (async () => {
      if (!(await ping())) return;
      const c = await fetchContent();
      if (c) {
        setContent(c);
        saveContent(c);
      }
    })();
  }, []);

  useEffect(() => {
    const page = ROUTES[route] ? route : "/";
    const titres: Record<string, string> = {
      "/": "Cabinet d'Avocat Ajmi | Affaires · Médical · Famille · Contentieux",
      "/cabinet": "Le Cabinet | Cabinet d'Avocat Ajmi",
      "/competences": "Compétences | Cabinet d'Avocat Ajmi",
      "/services": "Domaines d'intervention | Cabinet d'Avocat Ajmi",
      "/experiences": "Expériences | Cabinet d'Avocat Ajmi",
      "/avocat": "Maître Mohamed Anouar Ajmi | Avocat à Monastir",
      "/actualites": "Publications & Actualités | Cabinet d'Avocat Ajmi",
      "/suivi": "Suivi de Commande | Cabinet d'Avocat Ajmi",
      "/contact": "Contact | Cabinet d'Avocat Ajmi",
    };
    if (route.startsWith("/publication/")) {
      document.title = "Publication & Ouvrage | Cabinet d'Avocat Ajmi";
    } else {
      document.title = titres[page] ?? titres["/"];
    }
  }, [route]);

  if (route.startsWith("/admin/setup")) return <Setup />;
  if (route.startsWith("/admin")) return <Admin content={content} setContent={setContent} />;

  const pubId = getPublicationIdFromRoute(route);

  return (
    <ContentCtx.Provider value={content}>
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
