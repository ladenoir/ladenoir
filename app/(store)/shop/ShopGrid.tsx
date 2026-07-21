"use client";

import { useState, useTransition } from "react";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ShopGrid({
  products,
  categories,
  initial = "All",
}: {
  products: Product[];
  categories: string[];
  initial?: string;
}) {
  const [active, setActive] = useState(initial);
  const [, startTransition] = useTransition();
  const filters = ["All", ...categories];
  const shown =
    active === "All"
      ? products
      : products.filter((p) => p.category?.name === active);

  return (
    <>
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/12 px-[5vw] py-[22px]">
        <div className="flex flex-wrap gap-2.5">
          {filters.map((f) => {
            const on = f === active;
            return (
              <button
                key={f}
                onClick={() => startTransition(() => setActive(f))}
                className={cn(
                  "border px-[18px] py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] transition-all duration-300",
                  on
                    ? "border-gold bg-gold text-noir-deep"
                    : "border-gold/30 bg-transparent text-cream/70 hover:border-gold/60"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/55">
          <span>{shown.length} pieces</span>
          <span className="h-3.5 w-px bg-gold/30" />
          <span className="text-gold">Sort: New in ▾</span>
        </div>
      </div>

      {/* grid */}
      <div className="px-[5vw] pb-20 pt-10">
        <div
          className="grid grid-cols-2 gap-[22px] lg:grid-cols-4"
          style={{ viewTransitionName: "shop-grid" }}
        >
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} morph />
          ))}
        </div>
      </div>
    </>
  );
}
