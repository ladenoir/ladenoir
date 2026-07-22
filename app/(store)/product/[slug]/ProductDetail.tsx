"use client";

import { useLayoutEffect, useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useCart } from "@/components/store/cart-context";
import { useWishlist } from "@/components/store/wishlist-context";
import { SPRING, DURATION } from "@/lib/motion";
import { formatINR, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPECS = [
  { k: "MATERIAL", v: "100% Virgin Wool" },
  { k: "MADE IN", v: "Portugal" },
  { k: "EDITION", v: "Limited run" },
  { k: "SHIPPING", v: "Free, 2–4 days" },
];

/**
 * Measured active-thumbnail indicator. `layoutId` is unavailable (MotionProvider
 * uses `domAnimation`, not `domMax` — see MotionProvider.tsx), so this reads
 * `offsetTop`/`offsetHeight` off the active thumbnail button (its untransformed
 * layout box) the same way SiteHeader.tsx's `useNavIndicatorRect` measures the
 * active nav link, and drives a single absolutely positioned `m.span` with a
 * transform instead of relying on a shared layout animation. `top`/`height`
 * are both Motion "positional" keys, so `MotionConfig reducedMotion="user"`
 * already forces them instant under reduced motion with no extra gating.
 */
function useThumbIndicatorRect(
  containerRef: React.RefObject<HTMLElement | null>,
  activeIndex: number,
  count: number
) {
  const [rect, setRect] = useState<{ top: number; height: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = container.querySelector<HTMLElement>(
        `button[data-idx="${activeIndex}"]`
      );
      if (!el) {
        setRect(null);
        return;
      }
      setRect({ top: el.offsetTop, height: el.offsetHeight });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [containerRef, activeIndex, count]);

  return rect;
}

/**
 * Measured sliding size-pill indicator. Same `layoutId`-replacement approach
 * as the thumbnail indicator above, extended to two dimensions: the size
 * chips sit in a `flex flex-wrap` row and can wrap onto a second line (and
 * chip width varies with label length — "XXL" vs "S"), so the indicator
 * needs `left`/`top`/`width`/`height` off the active chip, not just an x
 * offset like SiteHeader's single-row nav underline. A wrapped layout is
 * exactly what a plain x-only slide can't handle (the pill would cut a
 * diagonal through unrelated rows), so this measures both axes and slides
 * however the active chip actually moved — reading as intentional motion on
 * a single row, and as a clean cross-row relocation when it wraps, rather
 * than a blink either way.
 */
function useSizePillRect(
  containerRef: React.RefObject<HTMLElement | null>,
  activeSize: string,
  count: number
) {
  const [rect, setRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = container.querySelector<HTMLElement>(
        `button[data-size="${activeSize}"]`
      );
      if (!el) {
        setRect(null);
        return;
      }
      setRect({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [containerRef, activeSize, count]);

  return rect;
}

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

  // MotionConfig's reducedMotion="user" (see MotionProvider.tsx) only forces
  // *positional* keys instant under prefers-reduced-motion: reduce — opacity
  // is not positional and keeps its full transition. The gallery crossfade,
  // button label morph, and wishlist particle burst below are all
  // opacity-driven, so every one of them is gated on this flag, following
  // the ProductCard.tsx / CartDrawer.tsx pattern.
  const shouldReduceMotion = useReducedMotion();

  const thumbColRef = useRef<HTMLDivElement>(null);
  const thumbRect = useThumbIndicatorRect(thumbColRef, imgIdx, gallery.length);

  const sizeRowRef = useRef<HTMLDivElement>(null);
  const sizePillRect = useSizePillRect(sizeRowRef, size, sizes.length);

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
          <div ref={thumbColRef} className="relative flex flex-col gap-3">
            {thumbRect && (
              <m.span
                className="pointer-events-none absolute left-0 z-10 w-16 border-2 border-gold"
                style={{ height: thumbRect.height }}
                initial={false}
                animate={{ y: thumbRect.top }}
                transition={shouldReduceMotion ? { duration: 0 } : SPRING.snappy}
              />
            )}
            {gallery.map((g, i) => (
              <button
                key={i}
                data-idx={i}
                onClick={() => setImgIdx(i)}
                aria-pressed={i === imgIdx}
                aria-label={`View image ${i + 1}`}
                className="relative aspect-[1/1.1] overflow-hidden border border-gold/20 bg-noir-panel"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g}
                  alt=""
                  className="size-full object-cover contrast-[1.05] grayscale"
                />
              </button>
            ))}
          </div>
          <div className="relative aspect-[4/5] overflow-hidden border border-gold/15 bg-noir-panel">
            <ViewTransition name={`product-${product.slug}`} share="morph">
              <AnimatePresence initial={false}>
                <m.img
                  key={gallery[imgIdx]}
                  src={gallery[imgIdx]}
                  alt={product.name}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.02 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: DURATION.enter / 1000 },
                  }}
                  exit={{
                    opacity: shouldReduceMotion ? 1 : 0,
                    transition: shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: DURATION.exit / 1000 },
                  }}
                  className="absolute inset-0 size-full object-cover contrast-[1.04] grayscale-[0.15]"
                />
              </AnimatePresence>
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
          <div
            ref={sizeRowRef}
            className="relative mb-[26px] flex flex-wrap gap-2.5"
          >
            {sizePillRect && (
              <m.span
                className="pointer-events-none absolute left-0 top-0 z-0 bg-gold"
                style={{ width: sizePillRect.width, height: sizePillRect.height }}
                initial={false}
                animate={{ x: sizePillRect.left, y: sizePillRect.top }}
                transition={shouldReduceMotion ? { duration: 0 } : SPRING.snappy}
              />
            )}
            {sizes.map((s) => {
              const on = s === size;
              return (
                <m.button
                  key={s}
                  data-size={s}
                  onClick={() => setSize(s)}
                  aria-pressed={on}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                  transition={SPRING.snappy}
                  className={cn(
                    "relative z-10 min-w-[52px] border py-3.5 font-mono text-xs font-semibold transition-colors duration-200",
                    on
                      ? "border-gold text-noir-deep"
                      : "border-gold/30 text-cream/70 hover:border-gold/60"
                  )}
                >
                  {s}
                </m.button>
              );
            })}
          </div>

          <div className="mb-[18px] flex gap-3">
            <m.button
              onClick={addToBag}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              transition={SPRING.snappy}
              className="flex-1 overflow-hidden bg-gold p-[17px] font-mono text-xs font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={added ? "added" : "idle"}
                  initial={shouldReduceMotion ? false : { y: 10, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: DURATION.enter / 1000 },
                  }}
                  exit={{
                    y: shouldReduceMotion ? 0 : -10,
                    opacity: shouldReduceMotion ? 1 : 0,
                    transition: shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: DURATION.exit / 1000 },
                  }}
                  className="block"
                >
                  {added ? "Added to bag ✓" : `Add to bag — ${size}`}
                </m.span>
              </AnimatePresence>
            </m.button>
            <m.button
              onClick={() =>
                toggle({
                  slug: product.slug,
                  name: product.name,
                  price: product.price_inr,
                  image: product.image_url ?? "",
                  category: cat,
                })
              }
              aria-pressed={wished}
              aria-label="Toggle wishlist"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
              transition={SPRING.snappy}
              className={cn(
                "relative w-14 border text-lg transition-colors",
                wished
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-gold/40 text-gold hover:bg-gold/10"
              )}
            >
              <m.span
                key={wished ? "on" : "off"}
                initial={shouldReduceMotion ? false : { scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={shouldReduceMotion ? { duration: 0 } : SPRING.snappy}
                className="inline-block"
              >
                {wished ? "♥" : "♡"}
              </m.span>
              {/* Particle burst is purely decorative flourish riding on
                  opacity/translate — under reduced motion it is skipped
                  entirely (not just made instant) so the wishlist toggle
                  stays fully static, matching the project-wide "fully
                  static under reduced motion" bar rather than resting on
                  MotionConfig's positional-key instant-snap alone. */}
              <AnimatePresence>
                {!shouldReduceMotion &&
                  wished &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <m.span
                      key={i}
                      className="wishlist-particle pointer-events-none absolute left-1/2 top-1/2 size-1 rounded-full bg-gold"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos((i / 6) * Math.PI * 2) * 26,
                        y: Math.sin((i / 6) * Math.PI * 2) * 26,
                        opacity: 0,
                        scale: 0.4,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: DURATION.hover / 1000, ease: "easeOut" }}
                    />
                  ))}
              </AnimatePresence>
            </m.button>
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
