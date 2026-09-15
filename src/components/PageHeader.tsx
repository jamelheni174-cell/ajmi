import { Reveal } from "./Reveal";

export function PageHeader({ kicker, titre, intro }: { kicker: string; titre: string; intro?: string }) {
  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-40 md:pb-28 md:pt-48">
        <Reveal>
          <p className="mb-6 text-[11px] uppercase tracking-[0.35em] text-blue">{kicker}</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] md:text-7xl">{titre}</h1>
          {intro && <p className="mt-8 max-w-2xl text-base font-light leading-relaxed text-stone md:text-lg">{intro}</p>}
        </Reveal>
      </div>
    </section>
  );
}

export function PageCTA({ titre = "Un projet, un litige, une question ?" }: { titre?: string }) {
  return (
    <section className="border-t border-stone bg-stone/25">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between">
        <h2 className="max-w-xl font-serif text-3xl leading-snug md:text-4xl">{titre}</h2>
        <a
          href="#/contact"
          className="rounded-xl bg-navy px-8 py-4 text-[11px] uppercase tracking-[0.25em] text-paper transition hover:bg-ink"
        >
          Prendre contact
        </a>
      </div>
    </section>
  );
}
