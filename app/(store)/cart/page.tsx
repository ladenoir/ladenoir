"use client";

import Link from "next/link";
import { useCart } from "@/components/store/cart-context";
import { formatINR } from "@/lib/types";

export default function CartPage() {
  const { items, setQty, remove, subtotal, count, ready } = useCart();
  const duties = Math.round(subtotal * 0.02);
  const total = subtotal + duties;

  if (ready && items.length === 0) {
    return (
      <div className="px-[5vw] py-24 text-center">
        <h1 className="font-serif text-[44px] font-medium sm:text-[64px]">
          Your bag<span className="text-gold">.</span>
        </h1>
        <p className="mt-4 font-mono text-xs tracking-[0.12em] text-cream/50">
          YOUR BAG IS EMPTY
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block bg-gold px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
        >
          Discover the collection →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="px-[5vw] pb-5 pt-12">
        <h1 className="font-serif text-[38px] font-medium leading-[0.9] tracking-[-0.01em] sm:text-[72px]">
          Your bag<span className="text-gold">.</span>
        </h1>
        <div className="mt-3 font-mono text-xs tracking-[0.12em] text-cream/50">
          {count} ITEMS · RESERVED FOR 15 MIN
        </div>
      </div>

      <div className="grid items-start border-t border-gold/20 lg:grid-cols-[1.5fr_1fr]">
        {/* items */}
        <div className="px-[5vw] pb-16 pt-3 lg:pr-[3vw]">
          {items.map((it) => (
            <div
              key={`${it.slug}-${it.size}`}
              className="grid grid-cols-[90px_1fr_auto] gap-5 border-b border-gold/12 py-6 sm:grid-cols-[110px_1fr_auto] sm:gap-[22px]"
            >
              <div className="aspect-[4/5] overflow-hidden border border-gold/12 bg-noir-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image}
                  alt={it.name}
                  className="size-full object-cover contrast-[1.05] grayscale-[0.2]"
                />
              </div>
              <div className="flex flex-col justify-between py-0.5">
                <div>
                  <Link
                    href={`/product/${it.slug}`}
                    className="font-serif text-[22px] font-medium hover:text-gold"
                  >
                    {it.name}
                  </Link>
                  <div className="mt-1.5 font-mono text-[11px] tracking-[0.06em] text-cream/50">
                    SIZE {it.size}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gold/30">
                    <button
                      onClick={() => setQty(it.slug, it.size, it.qty - 1)}
                      className="size-[34px] text-base text-gold"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-[34px] text-center font-mono text-[13px] font-medium">
                      {it.qty}
                    </span>
                    <button
                      onClick={() => setQty(it.slug, it.size, it.qty + 1)}
                      className="size-[34px] text-base text-gold"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(it.slug, it.size)}
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-cream/45 hover:text-gold"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="whitespace-nowrap text-right font-mono text-[15px] font-medium text-gold">
                {formatINR(it.price * it.qty)}
              </div>
            </div>
          ))}
          <Link
            href="/shop"
            className="mt-6 inline-block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-gold"
          >
            ← Continue shopping
          </Link>
        </div>

        {/* summary */}
        <div className="border-t border-gold/15 bg-noir-deep px-[5vw] py-9 lg:sticky lg:top-24 lg:border-l lg:border-t-0 lg:pl-[3vw]">
          <div className="mb-6 font-serif text-[26px] font-medium">
            Order summary
          </div>
          <div className="flex flex-col gap-3.5 font-mono text-[13px] text-cream/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-gold">Free</span>
            </div>
            <div className="flex justify-between">
              <span>Est. duties</span>
              <span>{formatINR(duties)}</span>
            </div>
          </div>
          <div className="my-[22px] flex gap-2">
            <input
              placeholder="PROMO CODE"
              className="flex-1 border border-gold/30 bg-transparent px-3.5 py-3 font-mono text-[11px] tracking-[0.1em] text-cream outline-none"
            />
            <button className="border border-gold/30 px-[18px] font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-gold hover:bg-gold/10">
              Apply
            </button>
          </div>
          <div className="mt-1 flex items-baseline justify-between border-t border-gold/20 pt-5">
            <span className="font-serif text-xl font-medium">Total</span>
            <span className="font-mono text-2xl font-medium text-gold">
              {formatINR(total)}
            </span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block bg-gold p-[17px] text-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
          >
            Checkout →
          </Link>
          <div className="mt-4 text-center font-mono text-[10.5px] tracking-[0.08em] text-cream/40">
            SECURE PAYMENT · APPLE PAY · UPI · CARDS
          </div>
        </div>
      </div>
    </>
  );
}
