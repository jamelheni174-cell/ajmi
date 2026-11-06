import { useEffect, useState } from "react";

export const PAGES = [
  { path: "/", label: "Accueil" },
  { path: "/services", label: "Domaines" },
  { path: "/competences", label: "Compétences" },
  { path: "/experiences", label: "Expériences" },
  { path: "/actualites", label: "Actualités" },
  { path: "/suivi", label: "Suivi de Commande" },
  { path: "/contact", label: "Contact" },
] as const;

/**
 * Support history routing with hash fallback:
 * - Prefer pathname (clean URLs for SEO)
 * - Fallback to hash for old links / bookmarks (#/services)
 * - Normalize /index.html → /
 */
export function currentPath(): string {
  // Hash fallback (old links): #/services → /services
  const hash = window.location.hash.replace(/^#/, "");
  if (hash.startsWith("/")) return normalizePath(hash.split("?")[0] || "/");

  // Clean URL: /services, /publication/xxx
  const raw = window.location.pathname;
  // Vite dev serves from /, InfinityFree serves from / as well
  return normalizePath(raw);
}

function normalizePath(p: string): string {
  if (!p) return "/";
  // Remove trailing slash except root
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  // /index.html → /
  if (p.endsWith("/index.html")) p = p.slice(0, -10) || "/";
  return p.startsWith("/") ? p : "/" + p;
}

export function useRoute() {
  const [route, setRoute] = useState(currentPath());
  useEffect(() => {
    const sync = () => {
      // If old hash link, redirect to clean URL (SEO 301-like)
      const hash = window.location.hash.replace(/^#/, "");
      if (hash.startsWith("/")) {
        const clean = normalizePath(hash.split("?")[0] || "/");
        // Replace hash URL with clean URL without reload
        const search = window.location.search;
        window.history.replaceState(null, "", clean + search + window.location.hash.replace(/^#[^?]*/, "").replace(/^#\//, "?")[0]?.replace("?","") ? "" : "");
        // Actually just replace to clean path
        window.history.replaceState(null, "", clean + window.location.search);
        setRoute(clean);
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        return;
      }
      setRoute(normalizePath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    const onPop = () => sync();
    const onHash = () => sync();
    // Intercept clicks on internal links for SPA navigation
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      // Only handle internal paths starting with / and not external/proto
      if (href.startsWith("/") && !href.startsWith("//") && !href.includes("://") && anchor.target !== "_blank") {
        // Let browser handle new tab / modifier keys
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        go(href);
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    sync();
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return route;
}

export const go = (path: string) => {
  // Normalize: allow "#/services" or "/services" or "services"
  if (path.startsWith("#")) path = path.replace(/^#/, "");
  if (!path.startsWith("/")) path = "/" + path;
  const clean = normalizePath(path.split("?")[0] || "/");
  const search = path.includes("?") ? "?" + path.split("?").slice(1).join("?") : "";
  // Handle query string like /suivi?code=xxx
  const full = clean + search;
  if (window.location.pathname === clean && window.location.search === search) return;
  window.history.pushState(null, "", full);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export function getPublicationIdFromRoute(route: string): string | null {
  if (route.startsWith("/publication/")) {
    return route.replace("/publication/", "").trim();
  }
  return null;
}
