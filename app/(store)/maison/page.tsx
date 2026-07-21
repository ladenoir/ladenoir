import Link from "next/link";

export const metadata = {
  title: "Maison · La De Noir",
  description: "The House of Noir — menswear cut for people who move after dark.",
};

const HERO =
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=80";
const CRAFT =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80";

const PILLARS = [
  { no: "01", title: "Made to last", body: "Full-canvas construction, natural fibres, and hardware that ages instead of failing. Repairs are free for life." },
  { no: "02", title: "Limited by design", body: "Every drop is a finite run — most between 40 and 120 pieces. When it's gone, it stays gone." },
  { no: "03", title: "Cut for the night", body: "Deep tones, considered proportions, and details that read close-up. Clothing that rewards a second look." },
];

const STATS = [
  { n: "2019", label: "Established" },
  { n: "60", label: "Avg. run size" },
  { n: "14", label: "Partner mills" },
  { n: "∞", label: "Repairs, free" },
];

export default function MaisonPage() {
  return (
    <>
      {/* hero */}
      <section className="relative h-[min(64vh,620px)] overflow-hidden bg-noir-deep">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO}
          alt="Atelier"
          className="absolute inset-0 size-full animate-[ldn-kb_24s_ease-in-out_infinite_alternate] object-cover brightness-[0.7] contrast-[1.1] grayscale"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,15,19,0.3),rgba(14,15,19,0.85))]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw] text-center">
          <div className="mb-5 font-mono text-xs tracking-[0.34em] text-sand">
            THE HOUSE OF NOIR
          </div>
          <h1 className="font-serif text-[48px] font-medium leading-[0.9] tracking-[-0.01em] sm:text-[90px] lg:text-[130px]">
            Maison
          </h1>
          <p className="mt-[22px] max-w-[560px] font-serif text-[15px] italic leading-relaxed text-cream/75 sm:text-[19px]">
            Founded in the small hours. Menswear cut for people who move after
            dark.
          </p>
        </div>
      </section>

      {/* story */}
      <section className="grid border-b border-gold/20 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-[5vw] py-[72px] lg:pr-[4vw]">
          <div className="mb-5 font-mono text-[11px] tracking-[0.2em] text-gold">
            01 · ORIGIN
          </div>
          <h2 className="mb-5 font-serif text-[30px] font-medium leading-tight sm:text-[46px]">
            We don&rsquo;t make clothes for the daylight.
          </h2>
          <p className="mb-4 max-w-[460px] text-sm leading-[1.8] text-cream/65">
            La De Noir began with a single overcoat and a refusal to compromise.
            Every piece is developed in limited runs, cut from wool and leather
            sourced from mills that have supplied European houses for a century.
          </p>
          <p className="max-w-[460px] text-sm leading-[1.8] text-cream/65">
            The panther is our mark — patient, precise, and most itself at night.
          </p>
        </div>
        <div className="relative min-h-[420px] overflow-hidden border-gold/15 bg-noir-panel lg:border-l">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CRAFT}
            alt="Craft"
            className="absolute inset-0 size-full object-cover brightness-[0.85] contrast-[1.05] grayscale"
          />
        </div>
      </section>

      {/* pillars */}
      <section className="border-b border-gold/20 px-[5vw] py-[72px]">
        <div className="grid gap-11 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.no}>
              <div className="mb-4 font-mono text-[11px] tracking-[0.2em] text-gold">
                {p.no}
              </div>
              <div className="mb-3 font-serif text-2xl font-medium">
                {p.title}
              </div>
              <p className="text-[13px] leading-[1.7] text-cream/60">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* stats */}
      <section className="grid grid-cols-2 border-b border-gold/20 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="border-r border-gold/12 px-6 py-[52px] text-center"
          >
            <div className="font-serif text-[38px] leading-none text-gold sm:text-[58px]">
              {s.n}
            </div>
            <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-cream/55">
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* quote */}
      <section className="border-b border-gold/20 px-[5vw] py-[88px] text-center">
        <div className="mx-auto max-w-[800px] font-serif text-[28px] italic leading-tight sm:text-[46px]">
          &ldquo;Luxury isn&rsquo;t loud. It waits for the room to quiet, then
          it&rsquo;s the only thing you notice.&rdquo;
        </div>
        <div className="mt-6 font-mono text-[11px] tracking-[0.2em] text-gold">
          — ARJUN NOIR, FOUNDER
        </div>
      </section>

      {/* cta */}
      <section className="bg-noir-deep px-[5vw] py-[72px] text-center">
        <h2 className="mb-[22px] font-serif text-[30px] font-medium sm:text-[48px]">
          Step into the house.
        </h2>
        <Link
          href="/shop"
          className="inline-block bg-gold px-9 py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-noir-deep transition-colors hover:bg-cream"
        >
          Shop the collection →
        </Link>
      </section>
    </>
  );
}
