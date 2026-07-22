"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Mounted once in app/(store)/layout.tsx. Every animated component imports
 * `* as m from "motion/react-m"` so features are pulled in lazily rather
 * than via the full `motion` bundle (see eslint's no-restricted-imports).
 *
 * Uses `domAnimation` (animations + gestures only), not `domMax`.
 * `domMax` was tried briefly to power a `layoutId`-based nav underline, but
 * `features={domMax}` here is a plain imported object, not an async loader —
 * `LazyMotion`'s "lazy" bundling only applies when `features` is a function
 * returning a dynamic `import()`, so passing the object directly makes the
 * whole domMax bundle (animations + gestures + drag + layout) part of every
 * route's eagerly-loaded JS, not an actually-deferred chunk. Measured cost:
 * +13.2 kb gzip / +46.3 kb raw on every route, for a decorative underline
 * that never needed `layout`/`drag` in the first place. The underline is
 * reimplemented in SiteHeader.tsx using measured `getBoundingClientRect`
 * positions animated with a plain `m.span` transform, which `domAnimation`
 * supports natively — no shared feature bundle required.
 *
 * reducedMotion="user" makes Motion honor the OS-level
 * `prefers-reduced-motion: reduce` setting for every current and future
 * `motion`/`m` component — but only for *positional* keys (x, y, scale,
 * width, height, top/left/right/bottom, …), which are forced to resolve
 * instantly. Non-positional keys, most notably `opacity`, are NOT affected
 * and keep their full transition (see
 * node_modules/motion-dom/dist/es/animation/interfaces/visual-element-target.mjs
 * and .../render/utils/keys-position.mjs). Any component that fades under
 * reduced motion must gate that fade itself via `useReducedMotion()` — see
 * ProductCard.tsx, CartDrawer.tsx, and SiteHeader.tsx's bag-counter crossfade
 * for the established pattern. Motion's own default for `reducedMotion` is
 * "never" (ignore OS preference), so this must be set explicitly — see
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
