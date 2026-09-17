import { useEffect, useState } from "react";

export const PAGES = [
  { path: "/", label: "Accueil" },
  { path: "/cabinet", label: "Le Cabinet" },
  { path: "/services", label: "Domaines" },
  { path: "/competences", label: "Compétences" },
  { path: "/experiences", label: "Expériences" },
  { path: "/avocat", label: "L'Avocat" },
  { path: "/actualites", label: "Actualités" },
  { path: "/suivi", label: "Suivi de Commande" },
  { path: "/contact", label: "Contact" },
] as const;

export function currentPath() {
  const h = window.location.hash.replace(/^#/, "");
  return h.startsWith("/") ? h : "/";
}

export function useRoute() {
  const [route, setRoute] = useState(currentPath());
  useEffect(() => {
    const f = () => {
      setRoute(currentPath());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return route;
}

export const go = (path: string) => {
  window.location.hash = path;
};

export function getPublicationIdFromRoute(route: string): string | null {
  if (route.startsWith("/publication/")) {
    return route.replace("/publication/", "").trim();
  }
  return null;
}
