"use client";

import Link from "next/link";
import { useCart } from "@/components/store/cart-context";
import { useWishlist } from "@/components/store/wishlist-context";
import { formatINR } from "@/lib/types";

export default function WishlistPage() {
  const { items, remove, ready } = useWishlist();
  const { add } = useCart();

  return (
    <>
      <div className="border-b border-gold/20 px-[5vw] pb-[30px] pt-12">
        <h1 className="font-serif text-[38px] font-medium leading-[0.9] tracking-[-0.01em] sm:text-[64px]">
          Wishlist<span className="text-gold">.</span>
        </h1>
        <p className="mt-3 font-mono text-xs tracking-[0.12em] text-cream/50">
          {items.length} SAVED {items.length === 1 ? "PIECE" : "PIECES"}
        </p>
      </div>

      {ready && items.length === 0 ? (
        <div className="px-[5vw] py-24 text-center">
          <p className="font-mono text-xs tracking-[0.12em] text-cream/50">
            NOTHING SAVED YET
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-block bg-gold px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
          >
            Browse the collection →
          </Link>
        </div>
      ) : (
        <div className="px-[5vw] pb-20 pt-10">
          <div className="grid grid-cols-2 gap-[22px] lg:grid-cols-4">
            {items.map((it) => (
              <div key={it.slug}>
                <Link href={`/product/${it.slug}`} className="group block">
                  <div className="relative mb-3.5 aspect-[4/5] overflow-hidden border border-gold/12 bg-noir-panel transition-[border-color,transform] duration-500 group-hover:-translate-y-1 group-hover:border-gold">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.image}
                      alt={it.name}
                      className="absolute inset-0 size-full object-cover contrast-[1.06] grayscale transition-[filter,transform] duration-700 group-hover:scale-[1.04] group-hover:grayscale-0"
                    />
                  </div>
                </Link>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-serif text-[17px] font-medium">
                    {it.name}
                  </div>
                  <div className="whitespace-nowrap font-mono text-xs font-medium text-gold">
                    {formatINR(it.price)}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      add(
                        {
                          slug: it.slug,
                          name: it.name,
                          price: it.price,
                          image: it.image,
                          size: "M",
                        },
                        1
                      )
                    }
                    className="flex-1 bg-gold py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
                  >
                    Add to bag
                  </button>
                  <button
                    onClick={() => remove(it.slug)}
                    className="border border-gold/40 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-cream/60 hover:text-gold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
