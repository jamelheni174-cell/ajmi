import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { PAGES } from "../router";
import { useContent } from "../store";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Nav({ route }: { route: string }) {
  const c = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 text-ink transition-all duration-500",
          scrolled ? "border-b border-stone bg-paper/95 backdrop-blur" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <a href="#/" className="leading-none">
            <span className="block text-[9px] uppercase tracking-[0.32em] text-ink/60">Cabinet d'Avocat</span>
            <span className="mt-0.5 block font-serif text-3xl leading-none tracking-wide md:text-4xl">Ajmi</span>
          </a>

          <div className="flex items-center gap-3 md:gap-4">
            <a
              href={c.contact.phoneHref}
              className="hidden rounded-full border border-ink px-6 py-3 text-sm tracking-wide transition hover:bg-ink hover:text-paper md:inline-block"
            >
              {c.contact.phone}
            </a>
            <a
              href="#/contact"
              className="rounded-xl bg-navy px-7 py-3 text-[11px] uppercase tracking-[0.2em] text-paper transition hover:bg-ink"
            >
              RDV
            </a>
            <a
              href={c.contact.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hidden h-12 w-12 items-center justify-center rounded-full bg-stone text-ink transition hover:bg-navy hover:text-paper md:flex"
            >
              <Icon d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.2 8h4.6v14H.2V8zm7.5 0h4.4v1.9h.06c.62-1.16 2.12-2.4 4.36-2.4 4.66 0 5.52 3.07 5.52 7.06V22h-4.6v-6.6c0-1.58-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.48V22H7.7V8z" />
            </a>
            <a
              href={`mailto:${c.contact.email}`}
              aria-label="Email"
              className="hidden h-12 w-12 items-center justify-center rounded-full bg-stone text-ink transition hover:bg-navy hover:text-paper md:flex"
            >
              <Icon d="M2 5h20v14H2zM2 7l10 6 10-6" />
            </a>
            <button
              onClick={() => setOpen(true)}
              className="ml-1 text-[13px] uppercase tracking-[0.2em] underline-offset-4 hover:underline"
            >
              Menu <span className="font-serif text-xl">+</span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu plein écran avec défilement sécurisé */}
      {open && (
        <div className="fixed inset-0 z-[55] flex flex-col bg-paper text-ink overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone/30 shrink-0">
            <span className="leading-none">
              <span className="block text-[9px] uppercase tracking-[0.32em] text-ink/60">Cabinet d'Avocat</span>
              <span className="mt-0.5 block font-serif text-3xl">Ajmi</span>
            </span>
            <button onClick={() => setOpen(false)} className="text-[13px] font-medium uppercase tracking-[0.2em] hover:text-navy">
              Fermer <span className="font-serif text-xl">×</span>
            </button>
          </div>
          <nav className="flex flex-1 flex-col justify-center px-6 py-4 md:px-16">
            {PAGES.map((p, i) => (
              <a
                key={p.path}
                href={`#${p.path}`}
                className={cn(
                  "group flex items-baseline gap-5 border-b border-stone/60 py-2.5 md:py-3.5 transition",
                  route === p.path ? "text-navy font-semibold" : "hover:text-navy",
                )}
              >
                <span className="text-[11px] font-mono tracking-[0.3em] text-ink/40">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-3xl md:text-5xl leading-tight">{p.label}</span>
              </a>
            ))}
          </nav>
          <div className="px-6 py-6 md:px-16 shrink-0">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-stone pt-4 text-xs text-ink/70">
              <a href={c.contact.phoneHref} className="hover:text-navy">{c.contact.phone}</a>
              <a href={`mailto:${c.contact.email}`} className="break-all hover:text-navy">{c.contact.email}</a>
              <span>{c.contact.address}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
