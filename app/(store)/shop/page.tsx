import { getCategories, getProducts } from "@/lib/queries";
import { ShopGrid } from "./ShopGrid";

export const metadata = {
  title: "Shop · La De Noir",
  description: "The Collection — AW26, Heir to the Night.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const catNames = categories.map((cat) => cat.name);
  const initial = c && catNames.includes(c) ? c : "All";

  return (
    <>
      <div className="border-b border-gold/20 px-[5vw] pb-[30px] pt-14">
        <div className="mb-3.5 font-mono text-[11px] tracking-[0.2em] text-cream/50">
          HOME / SHOP
        </div>
        <h1 className="font-serif text-[44px] font-medium leading-[0.9] tracking-[-0.01em] sm:text-[68px] lg:text-[88px]">
          The Collection<span className="text-gold">.</span>
        </h1>
        <p className="mt-4 max-w-[420px] text-[13px] leading-relaxed text-cream/55">
          AW26 — Heir to the Night. Limited runs, cut for the after-hours.
        </p>
      </div>
      <ShopGrid products={products} categories={catNames} initial={initial} />
    </>
  );
}
