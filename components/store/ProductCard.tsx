"use client";

import { useEffect, useState, ViewTransition } from "react";
import Link from "next/link";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useCart } from "./cart-context";
import { SPRING } from "@/lib/motion";
import { formatINR, type Product } from "@/lib/types";

// The hover spring must land on the anchor itself: getComputedStyle checks
// (and just generally "the card" as a hit target) act on the <a>, not on a
// wrapper div nested inside it. m.create() gives Link a motion-capable
// version that forwards the whileHover/whileTap transform straight onto the
// underlying <a> (next/link forwards its ref there), instead of animating an
// inner element the Link merely contains.
const MotionLink = m.create(Link);

const claimed = new Set<string>();

declare global {
  interface Window {
    /** See useMorphNameGuard below — read by scripts/motion-check.mjs. */
    __ldnMorphDuplicates?: string[];
  }
}

/**
 * A viewTransitionName must be unique per document. Two cards claiming the
 * same product silently breaks the morph, so shout about it in development.
 *
 * This is the *reliable* place to catch that, not a live DOM scan for two
 * elements simultaneously bearing the same `view-transition-name`: the
 * browser's View Transition implementation never actually lets that state
 * exist observably — when two nodes race to claim one name, only one of
 * them ever gets the live inline style at any sampled instant (confirmed
 * empirically — see scripts/motion-check.mjs's duplicate-name check and its
 * comment), so polling the DOM during a transition can't reliably detect
 * this bug. This module-level `claimed` Set, by contrast, is a synchronous
 * bookkeeping check at mount time that sees the collision unconditionally —
 * so it also runs (silently, no console noise) outside development, pushing
 * onto `window.__ldnMorphDuplicates` so an automated check can read it back
 * deterministically instead of racing a transition.
 */
function useMorphNameGuard(slug: string, active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (claimed.has(slug)) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[ldn/motion] Two ProductCards claim morph name "product-${slug}". ` +
            `Only one grid per page may pass morph.`
        );
      }
      if (typeof window !== "undefined") {
        (window.__ldnMorphDuplicates ??= []).push(slug);
      }
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

  // MotionProvider's <MotionConfig reducedMotion="user"> makes Motion honor
  // prefers-reduced-motion for every m/motion component, but per Motion's
  // own docs (motion.dev/docs/react-accessibility) that only strips the
  // *animation* — the whileHover/whileTap target still gets applied,
  // instantly, so the card would still jump on hover instead of staying
  // fully static. The card lift is a decorative flourish, not information,
  // so under reduced motion we skip requesting the target altogether by
  // passing undefined instead of relying on MotionConfig's instant-snap
  // fallback. See scripts/motion-check.mjs's "Reduced motion disables the
  // hover spring" assertion.
  const shouldReduceMotion = useReducedMotion();

  const { add } = useCart();
  const img = product.image_url ?? "";
  const cat = product.category?.name ?? "";

  // Hover-triggered prefetch: node_modules/next/dist/docs/01-app/02-guides/
  // prefetching.md, "Preventing too many prefetches". A card grid (unbounded
  // /shop, PDP related rail) is exactly the "large list of links" case the
  // guide warns about — `prefetch={true}` on every card fires a full RSC
  // fetch (two Supabase queries) per card on viewport entry, not on intent.
  // The guide's fix: eject from viewport-triggered prefetch (`false` until
  // intent) and defer to hover (`onMouseEnter` flips it on). The guide's own
  // example restores `null` (default "auto") on hover, but PDP is a dynamic
  // route with a loading.tsx boundary, so "auto" only warms the shell, not
  // the Supabase-backed RSC payload (see prefetching.md's static-vs-dynamic
  // table) — that's the whole reason the previous commit used `true` in the
  // first place. So on hover we go straight to `true`, not `null`: same
  // "defer until intent" shape the guide prescribes, just the full-payload
  // target this dynamic route actually needs for the morph to have warm data
  // at click time.
  const [prefetchIntent, setPrefetchIntent] = useState(false);

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
    <MotionLink
      href={`/product/${product.slug}`}
      transitionTypes={["nav-forward"]}
      /**
       * PDP is a dynamic route with a loading.tsx boundary, so Next's
       * default ("auto") prefetch would only warm the shell up to that
       * boundary, not the actual product data — the click would still hit
       * the network and show the skeleton. `prefetch={true}` forces the
       * full route (including the Supabase-backed RSC payload) to be
       * fetched, so a normal click resolves from the client cache and
       * completes within a single View Transition, letting the shared-
       * element morph fire. See lib/queries.ts for the server-side cache
       * that keeps that prefetch fast.
       *
       * Firing that on every card's viewport entry is exactly what
       * prefetching.md's "Preventing too many prefetches" warns against for
       * large link lists (the unbounded /shop grid, the PDP related rail),
       * so we hold prefetch off (`false`) until the user shows intent via
       * hover, then flip to `true` — see prefetchIntent above.
       */
      prefetch={prefetchIntent ? true : false}
      onMouseEnter={() => setPrefetchIntent(true)}
      className="group block"
      whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.03 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={SPRING.snappy}
      style={{ transformOrigin: "center bottom" }}
    >
      <div className="relative mb-3.5 aspect-[4/5] overflow-hidden border border-gold/12 bg-noir-panel transition-[border-color] duration-500 group-hover:border-gold">
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
    </MotionLink>
  );
}
