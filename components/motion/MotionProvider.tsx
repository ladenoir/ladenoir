"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";
import type { ReactNode } from "react";

/**
 * Mounted once in app/(store)/layout.tsx. Every animated component imports
 * `* as m from "motion/react-m"` so features are pulled in lazily rather
 * than via the full `motion` bundle (see eslint's no-restricted-imports).
 *
 * Uses `domMax` (animations + gestures + drag + layout), not the smaller
 * `domAnimation`. The sliding nav underline in SiteHeader uses a shared
 * `layoutId` so the indicator FLIP-animates between whichever link is
 * active across navigations — that projection/measurement system lives in
 * Motion's "layout" feature, which `domAnimation` does not include (see
 * node_modules/framer-motion/dist/es/render/dom/features-{animation,max}.mjs).
 * `domMax` also pulls in `drag`, unused today, as the two ship together;
 * both remain behind LazyMotion so this doesn't touch the initial bundle.
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
      <LazyMotion features={domMax}>{children}</LazyMotion>
    </MotionConfig>
  );
}
