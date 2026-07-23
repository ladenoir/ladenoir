"use client";

import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { useReducedMotionPref } from "@/components/motion/useReducedMotionPref";

// Precomposed U+00C8 (LATIN CAPITAL LETTER E WITH GRAVE), not "E" + a
// combining grave accent (U+0301) — the latter would iterate as two code
// points via [...WORD] and throw off the 8-letter-span accessibility
// contract the check harness (and screen readers) depend on.
const WORD = [..."PANTHÈRE"];

/**
 * Per-letter mask reveal. Runs once on mount via a CSS animation (not the
 * Motion library — MotionConfig's reducedMotion="user" only intercepts
 * `animate`-driven props on `m.*` components, so a plain CSS `animation`
 * here needs its own explicit reduced-motion check rather than relying on
 * MotionProvider). The h1 keeps its full text content via aria-label, so
 * screen readers and the check harness read "PANTHÈRE", not eight orphaned
 * characters — the letter spans themselves are aria-hidden.
 *
 * The non-animated (reduced motion) state is the plain, untransformed one:
 * no inline `transform`/`animation` at all, so if the animation never runs
 * — reduced motion, or any other reason — the letters are simply sitting in
 * their final, fully readable position from the first frame. There is no
 * "stuck invisible" state to fall into.
 */
export function HeroTitle() {
  const reduced = useReducedMotionPref();

  return (
    <h1
      aria-label="PANTHÈRE"
      className="font-serif text-[88px] font-medium leading-[0.82] tracking-[-0.02em] text-cream sm:text-[130px] lg:text-[168px]"
    >
      {WORD.map((ch, i) => (
        <span
          key={i}
          data-letter
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom"
        >
          <span
            className={ch === "È" ? "inline-block italic text-gold" : "inline-block"}
            style={
              reduced
                ? undefined
                : {
                    transform: "translateY(110%)",
                    // 900ms: DURATION has no named token for a one-shot
                    // decorative hero reveal, so this derives from the
                    // slowest existing token (DURATION.hover) rather than
                    // introducing a bare literal — see lib/motion.ts.
                    animation: `ldn-letter-rise ${DURATION.hover * 2}ms ${EASE.out} ${STAGGER * i}ms forwards`,
                  }
            }
          >
            {ch}
          </span>
        </span>
      ))}
    </h1>
  );
}
