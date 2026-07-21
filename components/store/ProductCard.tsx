"use client";

import { useEffect, ViewTransition } from "react";
import Link from "next/link";
import { useCart } from "./cart-context";
import { formatINR, type Product } from "@/lib/types";

const claimed = new Set<string>();

/**
 * A viewTransitionName must be unique per document. Two cards claiming the
 * same product silently breaks the morph, so shout about it in development.
 */
function useMorphNameGuard(slug: string, active: boolean) {
  useEffect(() => {
    if (!active || process.env.NODE_ENV === "production") return;
    if (claimed.has(slug)) {
      console.error(
        `[ldn/motion] Two ProductCards claim morph name "product-${slug}". ` +
          `Only one grid per page may pass morph.`
      );
    }
    claimed.add(slug);
    return () => {
      claimed.delete(slug);
    };
  }, [slug, active]);
}

export function ProductCard({
  product,
  morph = false,
}: {
  product: Product;
  /**
   * Claim the shared-element view-transition name for this product.
   * A viewTransitionName must be unique per document, so exactly one grid
   * per page may pass this. Home passes it on "Just dropped"; /shop passes
   * it on the main grid.
   */
  morph?: boolean;
}) {
  useMorphNameGuard(product.slug, morph);

  const { add } = useCart();
  const img = product.image_url ?? "";
  const cat = product.category?.name ?? "";

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(
      {
        slug: product.slug,
        name: product.name,
        price: product.price_inr,
        image: img,
        size: product.sizes[1] ?? product.sizes[0] ?? "M",
      },
      1
    );
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      transitionTypes={["nav-forward"]}
      className="group block"
    >
      <div className="relative mb-3.5 aspect-[4/5] overflow-hidden border border-gold/12 bg-noir-panel transition-[border-color,transform] duration-500 group-hover:-translate-y-1 group-hover:border-gold">
        {morph ? (
          <ViewTransition name={`product-${product.slug}`} share="morph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={product.name}
              className="absolute inset-0 size-full object-cover contrast-[1.06] grayscale transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
            />
          </ViewTransition>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={img}
            alt={product.name}
            className="absolute inset-0 size-full object-cover contrast-[1.06] grayscale transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
          />
        )}
        {product.tag && (
          <div className="absolute left-3 top-3 bg-gold px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-noir-deep">
            {product.tag}
          </div>
        )}
        <button
          onClick={quickAdd}
          className="absolute inset-x-0 bottom-0 translate-y-full bg-gold py-2.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-noir-deep transition-transform duration-300 group-hover:translate-y-0"
        >
          Quick add +
        </button>
      </div>
      {morph ? (
        <ViewTransition name={`ptitle-${product.slug}`} share="morph">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-serif text-[17px] font-medium text-cream">
              {product.name}
            </div>
            <div className="whitespace-nowrap font-mono text-xs font-medium text-gold">
              {formatINR(product.price_inr)}
            </div>
          </div>
        </ViewTransition>
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-serif text-[17px] font-medium text-cream">
            {product.name}
          </div>
          <div className="whitespace-nowrap font-mono text-xs font-medium text-gold">
            {formatINR(product.price_inr)}
          </div>
        </div>
      )}
      <div className="mt-[3px] font-mono text-[11px] text-cream/45">{cat}</div>
    </Link>
  );
}
