import { Reveal } from "./Reveal";

export function PageHeader({ kicker, titre, intro }: { kicker: string; titre: string; intro?: string }) {
  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-14 pt-28 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
        <Reveal>
          <p className="mb-4 sm:mb-6 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.35em] text-blue font-semibold">{kicker}</p>
          <h1 className="max-w-4xl font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] sm:leading-[1.05] break-words">{titre}</h1>
          {intro && <p className="mt-5 sm:mt-8 max-w-2xl text-sm sm:text-base font-light leading-relaxed text-stone md:text-lg">{intro}</p>}
        </Reveal>
      </div>
    </section>
  );
}

export function PageCTA({ titre = "Un projet, un litige, une question ?" }: { titre?: string }) {
  return (
    <section className="border-t border-stone bg-stone/25">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 sm:gap-8 px-4 sm:px-6 py-14 sm:py-20 md:flex-row md:items-center md:justify-between">
        <h2 className="max-w-xl font-serif text-2xl sm:text-3xl md:text-4xl leading-snug">{titre}</h2>
        <a
          href="#/contact"
          className="w-full sm:w-auto text-center rounded-xl bg-navy px-8 py-3.5 sm:py-4 text-[11px] uppercase tracking-[0.25em] text-paper transition hover:bg-ink font-semibold shadow-sm"
        >
          Prendre contact
        </a>
      </div>
    </section>
  );
}
