"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Mounted once in app/(store)/layout.tsx. Every animated component imports
 * `* as m from "motion/react-m"` so only domAnimation features ship.
 *
 * reducedMotion="user" makes Motion honor the OS-level
 * `prefers-reduced-motion: reduce` setting for every current and future
 * `motion`/`m` component: transform and layout animations (the
 * whileHover/whileTap springs on ProductCard, etc.) are disabled, while
 * non-transform animations like opacity are preserved. Motion's own default
 * is "never" (ignore OS preference), so this must be set explicitly — see
 * https://motion.dev/docs/react-accessibility. This is separate from, and
 * does not replace, the CSS `@media (prefers-reduced-motion: reduce)` block
 * in app/globals.css, which only covers plain CSS transitions/animations.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  );
}
