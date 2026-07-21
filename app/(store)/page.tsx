import Link from "next/link";
import { getCategories, getFeaturedProducts, getProducts } from "@/lib/queries";
import { ProductCard } from "@/components/store/ProductCard";

const HERO =
  "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=1500&q=80";

const CATEGORY_IMG: Record<string, string> = {
  Outerwear:
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80",
  Knitwear:
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80",
  Bottoms:
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
  Accessories:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
  Tees: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80",
};

export default async function HomePage() {
  const [featured, categories, all] = await Promise.all([
    getFeaturedProducts(6),
    getCategories(),
    getProducts(),
  ]);

  const countByCat = (name: string) =>
    all.filter((p) => p.category?.name === name).length;

  const strip = categories
    .filter((c) => CATEGORY_IMG[c.name])
    .slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="relative h-[560px] overflow-hidden bg-burgundy-deep sm:h-[660px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO}
          alt="AW26 campaign"
          className="absolute inset-0 size-full animate-[ldn-kb_18s_ease-in-out_infinite_alternate] object-cover brightness-[0.8] contrast-[1.05] grayscale"
        />
        <div className="absolute inset-0 bg-burgundy mix-blend-multiply opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(61,10,13,0.55)_0%,rgba(61,10,13,0.25)_40%,rgba(61,10,13,0.75)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_20%,rgba(198,160,76,0.15)_0%,rgba(61,10,13,0)_55%)]" />
        <div className="absolute left-[5vw] top-6 flex items-center gap-2.5 font-mono text-[10px] tracking-[0.24em] text-sand">
          <span className="size-1.5 animate-[ldn-grain_2.4s_ease-in-out_infinite] rounded-full bg-gold" />
          NOW STREAMING · AW26 FILM
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <div className="mb-5 font-mono text-[11px] tracking-[0.36em] text-sand sm:text-[13px]">
            HEIR TO THE NIGHT
          </div>
          <h1 className="font-serif text-[88px] font-medium leading-[0.82] tracking-[-0.02em] text-cream sm:text-[130px] lg:text-[168px]">
            PANTH<span className="italic text-gold">È</span>RE
          </h1>
          <Link
            href="/shop"
            className="mt-8 bg-gold px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-burgundy-deep transition-colors hover:bg-cream"
          >
            Shop the collection →
          </Link>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section className="grid grid-cols-2 border-t border-gold/20 lg:grid-cols-4">
        {strip.map((c) => (
          <Link
            key={c.id}
            href={`/shop?c=${encodeURIComponent(c.name)}`}
            className="group relative aspect-[1/1.15] overflow-hidden border-b border-r border-gold/20 bg-burgundy"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CATEGORY_IMG[c.name]}
              alt={c.name}
              className="absolute inset-0 size-full object-cover brightness-[0.72] transition-[transform,filter] duration-[600ms] group-hover:scale-[1.06] group-hover:brightness-90"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(61,10,13,0)_40%,rgba(61,10,13,0.8)_100%)]" />
            <div className="absolute inset-0 flex items-end p-5">
              <div>
                <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-sand/70">
                  {String(countByCat(c.name)).padStart(2, "0")} pieces
                </div>
                <div className="font-serif text-[26px] font-medium text-cream">
                  {c.name}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* JUST DROPPED */}
      <section className="px-[5vw] py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-serif text-4xl font-medium text-cream sm:text-[40px]">
            Just dropped<span className="text-gold">.</span>
          </h2>
          <Link
            href="/shop"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-gold"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* STATEMENT */}
      <section className="border-t border-gold/20 px-[5vw] py-20 text-center">
        <p className="mx-auto max-w-[760px] font-serif text-3xl font-normal italic leading-tight text-cream sm:text-[44px]">
          &ldquo;We don&rsquo;t make clothes for the daylight.&rdquo;
        </p>
        <div className="mt-6 font-mono text-[11px] tracking-[0.2em] text-gold">
          — THE HOUSE OF NOIR
        </div>
      </section>
    </>
  );
}
