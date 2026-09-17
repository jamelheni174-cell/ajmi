import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { PAGES } from "../router";
import { useContent } from "../store";

const LOGO_DARK = "/images/logo-cabinet-dark.png";
const LOGO_LIGHT = "/images/logo-cabinet-light.png";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Logo PNG dark/light — bascule au scroll (et version claire sur fond sombre) */
function BrandLogo({
  variant = "dark",
  compact,
}: {
  variant?: "dark" | "light";
  compact?: boolean;
}) {
  const size = compact ? "h-10 w-10 md:h-12 md:w-12" : "h-11 w-11 md:h-14 md:w-14";
  return (
    <span className={cn("relative shrink-0", size)}>
      <img
        src={LOGO_DARK}
        alt=""
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full object-contain transition-opacity duration-500",
          variant === "dark" ? "opacity-100" : "opacity-0",
        )}
      />
      <img
        src={LOGO_LIGHT}
        alt=""
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full object-contain transition-opacity duration-500",
          variant === "light" ? "opacity-100" : "opacity-0",
        )}
      />
      <img
        src={variant === "light" ? LOGO_LIGHT : LOGO_DARK}
        alt="Logo Cabinet Ajmi"
        className="h-full w-full object-contain opacity-0"
      />
    </span>
  );
}

function Brand({
  compact,
  variant = "dark",
  inverted,
}: {
  compact?: boolean;
  variant?: "dark" | "light";
  inverted?: boolean;
}) {
  return (
    <a href="#/" className="flex items-center gap-3 leading-none">
      <BrandLogo variant={variant} compact={compact} />
      <span>
        <span
          className={cn(
            "block text-[9px] uppercase tracking-[0.32em]",
            inverted ? "text-paper/60" : "text-ink/60",
          )}
        >
          Cabinet d'Avocat
        </span>
        <span
          className={cn(
            "mt-0.5 block font-serif leading-none tracking-wide transition-colors duration-500",
            compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl",
            inverted ? "text-paper" : "text-ink",
          )}
        >
          Ajmi
        </span>
      </span>
    </a>
  );
}

export function Nav({ route }: { route: string }) {
  const c = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
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
          scrolled
            ? "border-b border-stone/80 bg-paper/95 py-0 shadow-[0_8px_30px_rgba(30,39,102,0.06)] backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 transition-all duration-500",
            scrolled ? "py-2.5 md:py-3" : "py-3 md:py-4",
          )}
        >
          {/* Logo PNG dark sur fonds clairs — se compacte au scroll */}
          <div
            className={cn(
              "rounded-2xl transition-all duration-500",
              scrolled ? "bg-stone/40 px-2 py-1 ring-1 ring-stone/60" : "bg-transparent px-0 py-0",
            )}
          >
            <Brand variant="dark" compact={scrolled} />
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <a
              href={c.contact.phoneHref}
              className={cn(
                "hidden rounded-full border px-6 py-3 text-sm tracking-wide transition md:inline-block",
                scrolled
                  ? "border-ink/20 hover:border-ink hover:bg-ink hover:text-paper"
                  : "border-ink hover:bg-ink hover:text-paper",
              )}
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

      {open && (
        <div className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-paper text-ink">
          <div className="flex shrink-0 items-center justify-between border-b border-stone/30 px-6 py-4">
            <Brand compact variant="dark" />
            <button
              onClick={() => setOpen(false)}
              className="text-[13px] font-medium uppercase tracking-[0.2em] hover:text-navy"
            >
              Fermer <span className="font-serif text-xl">×</span>
            </button>
          </div>
          <nav className="flex flex-1 flex-col justify-center px-6 py-4 md:px-16">
            {PAGES.map((p, i) => (
              <a
                key={p.path}
                href={`#${p.path}`}
                className={cn(
                  "group flex items-baseline gap-5 border-b border-stone/60 py-2.5 transition md:py-3.5",
                  route === p.path ? "font-semibold text-navy" : "hover:text-navy",
                )}
              >
                <span className="font-mono text-[11px] tracking-[0.3em] text-ink/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-3xl leading-tight md:text-5xl">{p.label}</span>
              </a>
            ))}
          </nav>
          <div className="shrink-0 px-6 py-6 md:px-16">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-stone pt-4 text-xs text-ink/70">
              <a href={c.contact.phoneHref} className="hover:text-navy">
                {c.contact.phone}
              </a>
              <a href={`mailto:${c.contact.email}`} className="break-all hover:text-navy">
                {c.contact.email}
              </a>
              <span>{c.contact.address}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
