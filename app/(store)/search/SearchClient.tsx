"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product } from "@/lib/types";

const SUGGESTIONS = [
  "Overcoat",
  "Knitwear",
  "Panthère",
  "Bomber",
  "Accessories",
  "New in",
];

export function SearchClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;

  const results = useMemo(() => {
    if (!hasQuery) return [];
    return products.filter((p) =>
      `${p.name} ${p.category?.name ?? ""} ${p.tag ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [products, q, hasQuery]);

  return (
    <>
      {/* search bar */}
      <div className="px-[5vw] pb-8 pt-12">
        <div className="flex max-w-[900px] items-center gap-4 border-b border-gold/40 pb-3.5">
          <span className="text-[22px] text-gold">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the maison…"
            autoFocus
            className="flex-1 bg-transparent font-serif text-2xl text-cream outline-none placeholder:text-cream/35 sm:text-[44px]"
          />
          {hasQuery && (
            <button
              onClick={() => setQuery("")}
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/50 hover:text-gold"
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* empty → suggestions */}
      {!hasQuery && (
        <div className="px-[5vw] pb-20 pt-5">
          <div className="mb-[18px] font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            Popular searches
          </div>
          <div className="flex flex-wrap gap-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="border border-gold/30 px-5 py-2.5 font-mono text-xs font-medium tracking-[0.05em] text-cream/75 transition-all duration-200 hover:border-gold hover:text-gold"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* results */}
      {hasQuery && (
        <div className="px-[5vw] pb-20 pt-3.5">
          <div className="mb-6 font-mono text-xs tracking-[0.1em] text-cream/50">
            {`${results.length} result${results.length === 1 ? "" : "s"} for “${query}”`}
          </div>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-[22px] lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="mb-2.5 font-serif text-[26px] font-medium">
                No pieces for &ldquo;{query}&rdquo;.
              </div>
              <p className="mb-6 text-[13px] text-cream/55">
                Try a category, a fabric, or browse the full collection.
              </p>
              <a
                href="/shop"
                className="inline-block bg-gold px-[30px] py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
              >
                View all →
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
