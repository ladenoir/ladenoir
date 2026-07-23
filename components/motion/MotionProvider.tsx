"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// `features` MUST be a function returning a dynamic `import()`, not an
// imported object. `LazyMotion`'s "lazy" bundling only kicks in for the
// function form — passing `domAnimation` (or `domMax`) directly makes the
// whole feature bundle part of every route's eagerly-loaded first-load JS,
// same as importing `motion` outright. The `import("./motion-features")`
// specifier must point at its own module (not just re-export inline here)
// for bundlers to actually split it into a separate chunk — see that
// file's comment. https://motion.dev/docs/react-lazy-motion
const loadFeatures = () =>
  import("./motion-features").then((mod) => mod.default);

/**
 * Mounted once in app/(store)/layout.tsx. Every animated component imports
 * `* as m from "motion/react-m"` so features are pulled in lazily rather
 * than via the full `motion` bundle (see eslint's no-restricted-imports).
 *
 * `features={loadFeatures}` is Motion's async-loader form: the feature
 * bundle (`domAnimation` — animations + gestures, not `domMax`'s
 * drag/layout) ships as its own chunk and is fetched after first render,
 * not bundled into first-load JS. Until that chunk resolves, `m`
 * components still mount and render normally — any `initial`/static
 * styling is applied immediately, there's no unstyled flash — they just
 * don't animate yet; per Motion's docs, "this animation will run when
 * loadFeatures resolves," i.e. deferred, not dropped. On a fast chunk
 * fetch (same origin, HTTP/2, and usually already warm from the route's
 * own JS) this window is not visually perceptible in practice, but it is
 * real, so anything that must be correct before paint (layout-affecting
 * state, not decorative motion) must not depend on the feature chunk
 * having loaded.
 *
 * `domMax` was tried briefly to power a `layoutId`-based nav underline,
 * eagerly at first (see git history), which cost +13.2 kb gzip / +46.3 kb
 * raw on every route for a decorative underline that never needed
 * `layout`/`drag` in the first place. The underline is reimplemented in
 * SiteHeader.tsx using measured `getBoundingClientRect` positions animated
 * with a plain `m.span` transform, which `domAnimation` supports natively —
 * no `domMax` feature bundle required.
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
      <LazyMotion features={loadFeatures}>{children}</LazyMotion>
    </MotionConfig>
  );
}
