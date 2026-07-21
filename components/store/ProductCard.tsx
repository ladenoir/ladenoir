"use client";

import Link from "next/link";
import { useCart } from "./cart-context";
import { formatINR, type Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
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
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative mb-3.5 aspect-[4/5] overflow-hidden border border-gold/12 bg-noir-panel transition-[border-color,transform] duration-500 group-hover:-translate-y-1 group-hover:border-gold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={product.name}
          className="absolute inset-0 size-full object-cover contrast-[1.06] grayscale transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
        />
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
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-serif text-[17px] font-medium text-cream">
          {product.name}
        </div>
        <div className="whitespace-nowrap font-mono text-xs font-medium text-gold">
          {formatINR(product.price_inr)}
        </div>
      </div>
      <div className="mt-[3px] font-mono text-[11px] text-cream/45">{cat}</div>
    </Link>
  );
}
