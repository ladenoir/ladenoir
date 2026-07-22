"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

  const linkCls = (href: string) =>
    cn(
      "relative transition-colors hover:text-gold",
      pathname === href ? "text-gold" : "text-cream/65"
    );

  const underline = (href: string) =>
    pathname === href && (
      <m.span
        layoutId="nav-underline"
        className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
        transition={SPRING.snappy}
      />
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
          <nav className="flex items-center gap-[26px] font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em]">
            {LEFT_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)}>
                {l.label}
                {underline(l.href)}
              </Link>
            ))}
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
          <div className="flex items-center gap-[22px] font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em]">
            {RIGHT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn("hidden md:inline", linkCls(l.href))}
              >
                {l.label}
                {underline(l.href)}
              </Link>
            ))}
            <Link href="/cart" className="text-gold">
              Bag (
              <span className="inline-block overflow-hidden align-bottom">
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.span
                    key={bag}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={SPRING.snappy}
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
