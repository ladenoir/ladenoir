"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import {
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import * as m from "motion/react-m";
import { useCart } from "./cart-context";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const LEFT_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/maison", label: "Maison" },
  { href: "/help", label: "Help" },
];

const RIGHT_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/account", label: "Account" },
];

// Header row shrinks to this fraction of its expanded height once condensed.
const CONDENSE_SCALE = 0.72;

/**
 * Sliding gold underline for a nav group. Replaces a shared `layoutId`
 * (which required the `domMax` feature bundle — see MotionProvider.tsx for
 * the bundle-size writeup) with a manually measured indicator: one absolute
 * `m.span` per group, positioned via each active link's own layout box
 * (`offsetLeft`/`offsetWidth`, not `getBoundingClientRect`) so the header's
 * `scaleY` condense transform on ancestors can never skew the measurement —
 * `offsetLeft`/`offsetWidth` read the untransformed layout box, whereas a
 * transform only repaints the visual box.
 *
 * One indicator per nav group (left, right), not one shared across both:
 * the two groups sit on opposite sides of the logo, so a single indicator
 * sliding from a left link to a right link would have to cross the entire
 * header — a distracting, illegible motion for a decorative underline. Two
 * independent indicators, each local to its own group, is both simpler and
 * the more sensible reading of "a bar that slides between active links in
 * the same group."
 *
 * Handles the `hidden md:inline` right-hand links: a link that's display:
 * none reports `offsetWidth === 0`, which this treats the same as "no match
 * in this group" — the indicator never renders pointing at a hidden link.
 *
 * `x`/`width` are both Motion "positional" keys
 * (node_modules/motion-dom/dist/es/render/utils/keys-position.mjs), so
 * `MotionConfig reducedMotion="user"` already forces them instant under
 * `prefers-reduced-motion: reduce` with no extra work. The explicit
 * `reduceMotion` transition override below is there anyway so the intent is
 * visible in this file rather than resting on that internal Motion detail.
 *
 * The measurement lives in a hook called from `SiteHeader` itself — not in
 * a child component's own effect. React attaches a host node's ref and runs
 * a component's layout effects bottom-up (children before parents), so a
 * *child* component's `useLayoutEffect` would run before the `<nav>` ref
 * one level up ever gets attached, reading `containerRef.current` as still
 * null on first mount. Hoisting the effect into the ancestor (`SiteHeader`)
 * guarantees every descendant ref, including `<nav>`'s, is already attached
 * by the time it runs.
 */
function useNavIndicatorRect(
  containerRef: React.RefObject<HTMLElement | null>,
  links: { href: string }[],
  pathname: string
) {
  const [rect, setRect] = useState<{ left: number; width: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    const activeHref = links.find((l) => l.href === pathname)?.href;
    if (!container || !activeHref) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = container.querySelector<HTMLElement>(
        `a[href="${activeHref}"]`
      );
      // offsetWidth is 0 for a `hidden` (display: none) link — the
      // right-hand links collapse below `md`, and the indicator must never
      // point at one that isn't actually visible.
      if (!el || el.offsetWidth === 0) {
        setRect(null);
        return;
      }
      setRect({ left: el.offsetLeft, width: el.offsetWidth });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [containerRef, pathname, links]);

  return rect;
}

function NavIndicator({
  rect,
  reduceMotion,
}: {
  rect: { left: number; width: number } | null;
  reduceMotion: boolean;
}) {
  if (!rect) return null;

  return (
    <m.span
      className="pointer-events-none absolute bottom-[-4px] left-0 h-px bg-gold"
      initial={false}
      animate={{ x: rect.left, width: rect.width }}
      transition={reduceMotion ? { duration: 0 } : SPRING.snappy}
    />
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const bag = ready ? count : 0;

  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);

  // Hysteresis band: condense past 80px, expand again below 40px, so the
  // header cannot flicker when the user hovers the threshold.
  useMotionValueEvent(scrollY, "change", (y) => {
    setCondensed((prev) => (prev ? y > 40 : y > 80));
  });

  // The condense/shrink is a decorative scroll-driven flourish, not
  // information — exactly the ProductCard.tsx hover-lift case. MotionConfig's
  // reducedMotion="user" only strips the *animation*, the scaleY target
  // still gets applied instantly, which would still make the header visibly
  // jump in size the moment scroll crosses the threshold. So under reduced
  // motion we never request the condensed target at all: the header stays
  // fully static at its expanded size regardless of scroll position.
  const isCondensed = !shouldReduceMotion && condensed;

  const leftNavRef = useRef<HTMLElement>(null);
  const rightNavRef = useRef<HTMLDivElement>(null);
  const leftIndicatorRect = useNavIndicatorRect(leftNavRef, LEFT_LINKS, pathname);
  const rightIndicatorRect = useNavIndicatorRect(rightNavRef, RIGHT_LINKS, pathname);

  const linkCls = (href: string) =>
    cn(
      "transition-colors hover:text-gold",
      pathname === href ? "text-gold" : "text-cream/65"
    );

  return (
    <header
      className="sticky top-0 z-30 border-b border-gold/20 bg-noir/90 backdrop-blur-md"
      style={{ viewTransitionName: "site-header" }}
    >
      <m.div
        className="flex origin-top items-center justify-between px-[5vw] py-[22px]"
        animate={{ scaleY: isCondensed ? CONDENSE_SCALE : 1 }}
        transition={SPRING.soft}
      >
        {/* left nav (desktop) */}
        <m.div
          animate={{ scaleY: isCondensed ? 1 / CONDENSE_SCALE : 1 }}
          transition={SPRING.soft}
          className="hidden flex-1 origin-top md:block"
        >
          <nav
            ref={leftNavRef}
            className="relative flex items-center gap-[26px] font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em]"
          >
            {LEFT_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)}>
                {l.label}
              </Link>
            ))}
            <NavIndicator rect={leftIndicatorRect} reduceMotion={!!shouldReduceMotion} />
          </nav>
        </m.div>

        {/* mobile menu button */}
        <m.div
          animate={{ scaleY: isCondensed ? 1 / CONDENSE_SCALE : 1 }}
          transition={SPRING.soft}
          className="flex-1 origin-top md:hidden"
        >
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-gold"
            aria-label="Toggle menu"
          >
            {open ? <Menu className="size-5" /> : <Menu className="size-5" />}
          </button>
        </m.div>

        {/* logo */}
        <m.div
          animate={{ scaleY: isCondensed ? 1 / CONDENSE_SCALE : 1 }}
          transition={SPRING.soft}
          className="flex-1 origin-top text-center leading-none"
        >
          <Link href="/" className="inline-block leading-none">
            <m.div
              animate={{ scale: isCondensed ? 0.86 : 1 }}
              transition={SPRING.soft}
              style={{ transformOrigin: "center" }}
            >
              <div className="mb-[3px] font-mono text-[9px] tracking-[0.42em] text-cream/55">
                LA DE
              </div>
              <div className="font-serif text-2xl font-semibold tracking-[0.28em] text-gold">
                NOIR
              </div>
            </m.div>
          </Link>
        </m.div>

        {/* right nav */}
        <m.div
          animate={{ scaleY: isCondensed ? 1 / CONDENSE_SCALE : 1 }}
          transition={SPRING.soft}
          className="flex flex-1 origin-top items-center justify-end"
        >
          <div
            ref={rightNavRef}
            className="relative flex items-center gap-[22px] font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em]"
          >
            {RIGHT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn("hidden md:inline", linkCls(l.href))}
              >
                {l.label}
              </Link>
            ))}
            <NavIndicator rect={rightIndicatorRect} reduceMotion={!!shouldReduceMotion} />
            <Link href="/cart" className="text-gold">
              Bag (
              <span className="inline-block overflow-hidden align-bottom">
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.span
                    key={bag}
                    // `y` (positional/transform) is already forced instant by
                    // MotionConfig's reducedMotion="user", but `opacity` is
                    // not a positional key (see MotionProvider.tsx) and would
                    // keep fading under prefers-reduced-motion: reduce unless
                    // gated here — so under reduced motion the entering digit
                    // starts and stays at its final {y:0, opacity:1}, and the
                    // exiting digit's target is its own current values (no
                    // visible fade) before AnimatePresence removes it.
                    initial={shouldReduceMotion ? false : { y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={
                      shouldReduceMotion
                        ? { y: 0, opacity: 1 }
                        : { y: -12, opacity: 0 }
                    }
                    transition={shouldReduceMotion ? { duration: 0 } : SPRING.snappy}
                    className="inline-block"
                  >
                    {bag}
                  </m.span>
                </AnimatePresence>
              </span>
              )
            </Link>
          </div>
        </m.div>
      </m.div>

      {/* mobile drawer */}
      {open && (
        <div className="border-t border-gold/15 px-[5vw] py-4 md:hidden">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/45">
              Menu
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="size-4 text-cream/60" />
            </button>
          </div>
          <nav className="flex flex-col gap-3 font-mono text-sm uppercase tracking-[0.08em]">
            {[...LEFT_LINKS, ...RIGHT_LINKS].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={linkCls(l.href)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
