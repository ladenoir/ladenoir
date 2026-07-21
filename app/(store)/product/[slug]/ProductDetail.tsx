"use client";

import { useState, ViewTransition } from "react";
import Link from "next/link";
import { useCart } from "@/components/store/cart-context";
import { useWishlist } from "@/components/store/wishlist-context";
import { formatINR, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPECS = [
  { k: "MATERIAL", v: "100% Virgin Wool" },
  { k: "MADE IN", v: "Portugal" },
  { k: "EDITION", v: "Limited run" },
  { k: "SHIPPING", v: "Free, 2–4 days" },
];

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const gallery = product.images.length ? product.images : [product.image_url ?? ""];
  const sizes = product.sizes.length ? product.sizes : ["S", "M", "L", "XL"];

  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState(sizes[Math.min(1, sizes.length - 1)]);
  const [added, setAdded] = useState(false);

  const wished = has(product.slug);
  const cat = product.category?.name ?? "";

  const addToBag = () => {
    add(
      {
        slug: product.slug,
        name: product.name,
        price: product.price_inr,
        image: product.image_url ?? "",
        size,
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      {/* breadcrumb */}
      <div className="px-[5vw] pt-5 font-mono text-[11px] tracking-[0.15em] text-cream/45">
        <Link href="/shop" transitionTypes={["nav-back"]} className="hover:text-gold">
          SHOP
        </Link>{" "}
        / {cat.toUpperCase()} /{" "}
        <span className="text-gold">{product.name.toUpperCase()}</span>
      </div>

      <div className="grid items-stretch lg:grid-cols-[1.35fr_1fr]">
        {/* gallery */}
        <div className="grid grid-cols-[64px_1fr] gap-4 px-[5vw] py-7 lg:pr-[2vw]">
          <div className="flex flex-col gap-3">
            {gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={cn(
                  "aspect-[1/1.1] overflow-hidden border bg-noir-panel",
                  i === imgIdx ? "border-gold" : "border-gold/20"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g}
                  alt="view"
                  className="size-full object-cover contrast-[1.05] grayscale"
                />
              </button>
            ))}
          </div>
          <div className="relative aspect-[4/5] overflow-hidden border border-gold/15 bg-noir-panel">
            <ViewTransition name={`product-${product.slug}`} share="morph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[imgIdx]}
                alt={product.name}
                className="absolute inset-0 size-full object-cover contrast-[1.04] grayscale-[0.15]"
              />
            </ViewTransition>
            {product.tag && (
              <div className="absolute left-4 top-4 bg-gold px-2.5 py-[5px] font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-noir-deep">
                {product.tag}
              </div>
            )}
          </div>
        </div>

        {/* info */}
        <div className="flex flex-col justify-center border-t border-gold/15 px-[5vw] py-10 lg:border-l lg:border-t-0 lg:pl-[3vw]">
          <div className="mb-3.5 font-mono text-[11px] tracking-[0.2em] text-cream/50">
            {cat.toUpperCase()} · AW26
          </div>
          <ViewTransition name={`ptitle-${product.slug}`} share="morph">
            <div>
              <h1 className="font-serif text-[38px] font-medium leading-[0.95] tracking-[-0.01em] sm:text-[58px]">
                {product.name}
              </h1>
              <div className="mb-2 mt-[18px] flex items-center gap-4">
                <div className="font-mono text-[22px] font-medium text-gold">
                  {formatINR(product.price_inr)}
                </div>
                <div className="font-mono text-[11px] tracking-[0.05em] text-cream/45">
                  ★★★★★ ({product.sold_count})
                </div>
              </div>
            </div>
          </ViewTransition>
          <p className="my-3.5 mb-7 max-w-[440px] text-sm leading-relaxed text-cream/65">
            {product.description}
          </p>

          <div className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/55">
            Size
          </div>
          <div className="mb-[26px] flex flex-wrap gap-2.5">
            {sizes.map((s) => {
              const on = s === size;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-w-[52px] border py-3.5 font-mono text-xs font-semibold transition-all duration-200",
                    on
                      ? "border-gold bg-gold text-noir-deep"
                      : "border-gold/30 text-cream/70 hover:border-gold/60"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="mb-[18px] flex gap-3">
            <button
              onClick={addToBag}
              className="flex-1 bg-gold p-[17px] font-mono text-xs font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
            >
              {added ? "Added to bag ✓" : `Add to bag — ${size}`}
            </button>
            <button
              onClick={() =>
                toggle({
                  slug: product.slug,
                  name: product.name,
                  price: product.price_inr,
                  image: product.image_url ?? "",
                  category: cat,
                })
              }
              className={cn(
                "w-14 border text-lg transition-colors",
                wished
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-gold/40 text-gold hover:bg-gold/10"
              )}
              aria-label="Toggle wishlist"
            >
              {wished ? "♥" : "♡"}
            </button>
          </div>
          <Link
            href="/cart"
            className="p-1.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/60 hover:text-gold"
          >
            View bag & checkout →
          </Link>

          <div className="mt-7 flex flex-col gap-3.5 border-t border-gold/15 pt-[22px]">
            {SPECS.map((sp) => (
              <div
                key={sp.k}
                className="flex justify-between font-mono text-xs text-cream/55"
              >
                <span className="tracking-[0.08em] text-gold">{sp.k}</span>
                <span>{sp.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
