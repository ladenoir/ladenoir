"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { X } from "lucide-react";
import { useCart } from "./cart-context";
import { SPRING, DURATION } from "@/lib/motion";
import { formatINR } from "@/lib/types";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Marks every sibling subtree between `root` and `document.body` as inert
 * (or clears that marking) — i.e. the whole rest of the page, at every
 * level, excluding only the ancestor chain that leads to `root`. `inert`
 * both removes those elements from the Tab order and hides them from
 * assistive tech, which is what actually backs the drawer's
 * `aria-modal="true"` claim (previously nothing did — Tab could still
 * escape into the page behind it). Walking the live ancestor chain rather
 * than assuming a fixed DOM shape means this keeps working even if
 * StoreLayout's tree around <CartDrawer /> changes later.
 */
function setBackgroundInert(root: HTMLElement | null, inert: boolean) {
  let node: HTMLElement | null = root;
  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (parent) {
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== node && sibling instanceof HTMLElement) {
          sibling.toggleAttribute("inert", inert);
        }
      }
    }
    node = parent;
  }
}

/**
 * Confirmation surface for cart additions. Previously `add()` mutated state
 * with no visible feedback. /cart remains the canonical full bag view.
 *
 * Accessibility: `role="dialog"` + `aria-modal` + a labelled `<h2>` give it a
 * name ("Your bag") for the getByRole("dialog", { name: /your bag/i }) check.
 * Focus moves onto the panel on open (panelRef.current.focus()), Escape
 * closes it, and focus is restored to whatever triggered the open (the
 * "Quick add" button) via restoreTo.current — captured at the moment the
 * add-event fires, before setOpen(true) runs, so it always points at the
 * element the user actually interacted with.
 *
 * `aria-modal="true"` is only true if something actually backs it: while
 * open, `setBackgroundInert` marks the rest of the page `inert` (removes it
 * from both the Tab order and the accessibility tree), and the Tab handler
 * below additionally wraps focus from the panel's last focusable element
 * back to its first (and Shift+Tab from first to last) — belt-and-braces,
 * since `inert` alone doesn't guarantee wraparound when, as here, the
 * drawer happens to be the last element in DOM order and there's nothing
 * after it for the browser to hand focus to natively.
 */
export function CartDrawer() {
  const { items, subtotal, onAdd, remove } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  // MotionConfig's reducedMotion="user" (see MotionProvider.tsx) only forces
  // *positional* keys (x, y, scale, width, …) instant under
  // prefers-reduced-motion: reduce — `opacity` is not positional and would
  // otherwise keep its full fade/stagger here. The drawer must still open
  // and be usable under reduced motion, just without animating, so every
  // opacity transition below is gated on this flag rather than removed.
  const shouldReduceMotion = useReducedMotion();

  const close = useCallback(() => setOpen(false), []);

  // open on any add
  useEffect(() => {
    return onAdd(() => {
      restoreTo.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    });
  }, [onAdd]);

  // Close on navigation. Adjusting state during render (not inside an
  // effect) per https://react.dev/learn/you-might-not-need-an-effect —
  // "Adjusting some state when a prop changes" — is what the repo's
  // react-hooks/set-state-in-effect rule requires instead of the
  // setState-inside-effect pattern the brief's own snippet used, which
  // fails that lint rule (see cart-context.tsx's `ready` flag for the
  // established alternative, useSyncExternalStore, used for a different
  // kind of "sync to the outside world" problem than this one).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  // escape, focus move-in, focus trap (Tab wraparound + inert background),
  // focus restore, scroll lock
  useEffect(() => {
    if (!open) {
      restoreTo.current?.focus?.();
      return;
    }
    // Snapshot now, not read fresh inside the cleanup: by the time cleanup
    // runs (open -> false), rootRef.current may already differ (React can
    // clear the ref before the effect teardown for an AnimatePresence exit),
    // so the node this effect actually marked inert must be captured here.
    const root = rootRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) {
        // Nothing to wrap between — keep focus pinned on the panel itself
        // rather than letting Tab fall through to the (inert) background.
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setBackgroundInert(root, true);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      setBackgroundInert(root, false);
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <div ref={rootRef} className="fixed inset-0 z-50">
          <m.div
            className="absolute inset-0 bg-noir-deep"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{
              opacity: 0.6,
              transition: shouldReduceMotion
                ? { duration: 0 }
                : { duration: DURATION.enter / 1000 },
            }}
            exit={{
              opacity: 0,
              transition: shouldReduceMotion
                ? { duration: 0 }
                : { duration: DURATION.exit / 1000 },
            }}
            onClick={close}
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-gold/30 bg-noir p-6 outline-none"
            initial={{ x: "100%" }}
            animate={{ x: 0, transition: SPRING.soft }}
            // Exit uses a fast plain tween (DURATION.exit), not SPRING.soft:
            // a bouncy spring's settle time (oscillation below its rest
            // threshold) runs well past its own visualDuration, so
            // AnimatePresence wouldn't unmount the panel — and Playwright's
            // dialog.isVisible() wouldn't go false — inside the 700ms window
            // scripts/motion-check.mjs's "Escape closes the cart drawer"
            // check allows. DURATION.exit ("old content leaves fast", see
            // lib/motion.ts) both fixes that and matches the rest of the
            // codebase's asymmetric exit-fast/enter-gentle motion language.
            exit={{ x: "100%", transition: { duration: DURATION.exit / 1000 } }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-medium text-cream">
                Your bag
              </h2>
              <button
                onClick={close}
                aria-label="Close bag"
                className="text-gold hover:text-cream"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-cream/50">
                  Your bag is empty.
                </p>
              ) : (
                items.map((i, idx) => (
                  <m.div
                    key={`${i.slug}::${i.size}`}
                    initial={
                      shouldReduceMotion ? false : { opacity: 0, x: 24 }
                    }
                    animate={{ opacity: 1, x: 0 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { ...SPRING.soft, delay: 0.06 * idx }
                    }
                    className="mb-4 flex gap-3 border-b border-gold/12 pb-4"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={i.image}
                      alt={i.name}
                      className="size-20 shrink-0 object-cover grayscale"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-serif text-base text-cream">
                        {i.name}
                      </div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-cream/50">
                        {i.size} · ×{i.qty}
                      </div>
                      <div className="mt-1 font-mono text-xs text-gold">
                        {formatINR(i.price * i.qty)}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(i.slug, i.size)}
                      aria-label={`Remove ${i.name}`}
                      className="self-start font-mono text-[10px] uppercase tracking-[0.1em] text-cream/40 hover:text-gold"
                    >
                      Remove
                    </button>
                  </m.div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-gold/20 pt-4">
              <div className="mb-4 flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.1em]">
                <span className="text-cream/60">Subtotal</span>
                <span className="text-gold">{formatINR(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="mb-2.5 block bg-gold p-4 text-center font-mono text-xs font-bold uppercase tracking-[0.12em] text-noir-deep hover:bg-cream"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                className="block p-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/60 hover:text-gold"
              >
                View bag →
              </Link>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
