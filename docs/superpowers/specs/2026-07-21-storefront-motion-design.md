# La De Noir — Storefront Motion System

**Date:** 2026-07-21
**Status:** Approved design, ready for implementation planning

## Goal

Make the storefront feel like a luxury house site through motion: continuity between pages, spring-based feedback on every interaction, restrained cinematic touches on the hero. Motion must never cost layout stability, accessibility, or meaningful bundle weight.

## Approach

Hybrid. Two systems with a hard boundary between them:

| Concern | Owner | Cost |
|---|---|---|
| Cross-page: shared-element morph, directional routes, Suspense reveals | React `<ViewTransition>` (native, Next 16 `experimental.viewTransition`) | 0 kb |
| In-page interaction: drawers, hover springs, gesture, counters, layout swaps | `motion` behind `LazyMotion` + `m` components | ~17 kb gzip |

Rejected: native-only (no real springs, no interruptible animation on interactive surfaces); motion-library-only (`layoutId` across routes forces client components at every animated boundary, fighting the existing RSC data fetching in `lib/queries`).

Rule: if the animation crosses a route boundary, it is a `ViewTransition`. If it responds to a pointer or to client state, it is `motion`. Nothing does both.

## Scope

In scope: home, shop grid, product detail, cart drawer, site header, route transitions.
Out of scope: admin (`app/admin/**`), checkout, account, help, contact, search. Those keep current styling untouched.

One behavior change, not purely decorative: a cart drawer replaces the current silent `add()` (see §3.2).

---

## 1. Foundation

### 1.1 `lib/motion.ts`

Single source of truth for timing. No component hardcodes a duration or easing.

```ts
export const EASE = {
  out: "cubic-bezier(.22,.7,.3,1)",   // entries, reveals
  // CSS-native spring approximation (~bounce .25) for hover/press on
  // elements that must stay server-rendered and out of the motion bundle
  spring:
    "linear(0, .006, .026, .06, .108, .17, .247, .337, .437, .541, .645, .742, .827, .898, .952, .99, 1.012, 1.021, 1.02, 1.014, 1.007, 1.001, .998, .997, .998, 1)",
} as const;

export const DURATION = {
  exit: 150,    // old content leaves fast
  enter: 210,   // new content arrives gently
  morph: 400,   // shared-element flight
  hover: 450,
} as const;

export const SPRING = {
  soft:   { type: "spring", visualDuration: 0.45, bounce: 0.18 },
  snappy: { type: "spring", visualDuration: 0.3,  bounce: 0.32 },
} as const;
```

CSS mirrors of these values live as custom properties on `:root` in `app/globals.css` — `--duration-exit: 150ms`, `--duration-enter: 210ms`, `--duration-morph: 400ms`, `--duration-hover: 450ms`, `--ease-out`, `--ease-spring` — so `::view-transition-*` rules and non-JS hovers use the same numbers as `lib/motion.ts`.

### 1.2 `next.config.ts`

```ts
experimental: { viewTransition: true }
```

### 1.3 `components/motion/MotionProvider.tsx`

`"use client"`. Wraps children in `<LazyMotion features={domAnimation}>`. Mounted once inside `app/(store)/layout.tsx`, inside the existing `CartProvider`/`WishlistProvider`.

All animated components import `* as m from "motion/react-m"`, never `motion` from `motion/react`. Enforced by an eslint `no-restricted-imports` rule on `motion/react` limited to `motion` and `AnimatePresence`-adjacent full-feature exports, so a stray import fails lint rather than silently doubling the bundle.

### 1.4 `components/motion/Reveal.tsx`

`"use client"`. IntersectionObserver-based scroll reveal. No library.

- Props: `delay` (ms, default 0), `as` (element type, default `div`), `className`.
- Observes once at `threshold: 0.15`, calls `unobserve` on first intersection.
- Reserves final layout space at all times. Animates `opacity` and `translateY(18px)→0` only. CLS contribution is zero by construction.
- Reads `window.matchMedia("(prefers-reduced-motion: reduce)")` at mount; when reduced, renders visible immediately and never observes.
- Skips animation entirely for elements already inside the first viewport at mount, so above-fold content is never hidden waiting for an observer callback.

### 1.5 Reduced motion

`app/globals.css` gains:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}
```

Motion components additionally respect `useReducedMotion()` so springs resolve instantly rather than being clipped mid-flight.

---

## 2. Cross-page motion — `<ViewTransition>`

### 2.1 Shared-element morph

`ProductCard` image and `ProductDetail` hero image both wrap in:

```tsx
<ViewTransition name={`product-${product.slug}`} share="morph">
```

Card title/price wrap in `name={`ptitle-${slug}`}`.

CSS softens the flight with a mid-transition blur:

```css
::view-transition-group(.morph) { animation-duration: var(--duration-morph); }
::view-transition-image-pair(.morph) { animation-name: via-blur; }
@keyframes via-blur { 30% { filter: blur(3px); } }
```

**Duplicate-name hazard.** A `viewTransitionName` must be unique in the document. The home page renders featured products that can also appear in other grids, and shop filtering can re-render the same product. `ProductCard` therefore takes a `morph?: boolean` prop, default `false`. Only one call site per page passes `morph`: the shop grid on `/shop`, and the "Just dropped" grid on `/`. Any future grid that could render a duplicate slug on the same page must leave `morph` off. Implementation includes a dev-only assertion that warns when two mounted cards claim the same name.

### 2.2 Directional route transitions

- `<Link transitionTypes={['nav-forward']}>` on: product card → PDP, category tile → shop, "View all" → shop.
- `<Link transitionTypes={['nav-back']}>` on: PDP back link, drawer "continue shopping".

`app/(store)/layout.tsx` wraps `<main>`:

```tsx
<ViewTransition
  enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
  exit={{  'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
  default="none"
>
```

CSS uses a 60px slide plus blur-fade, exit 150ms / enter 210ms delayed by the exit duration, per the pattern in `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`.

### 2.3 Anchored chrome

`Marquee`, `SiteHeader`, and `SiteFooter` get stable names (`site-marquee`, `site-header`, `site-footer`) via inline `style={{ viewTransitionName: ... }}`, each suppressed:

```css
::view-transition-group(site-header) { animation: none; z-index: 100; }
::view-transition-old(site-header)   { display: none; }
::view-transition-new(site-header)   { animation: none; }
```

Content slides; chrome does not move. Prevents the double-header flash.

### 2.4 Suspense reveals

`app/(store)/shop/loading.tsx` and `app/(store)/product/[slug]/loading.tsx` render skeletons matching the real grid/PDP geometry. Fallback wraps in `<ViewTransition exit="slide-down">`, real content in `<ViewTransition enter="slide-up" default="none">`. Replaces the current blank flash.

### 2.5 Same-route crossfade

`ShopGrid` filter/sort state updates run inside `startTransition`, so the grid crossfades rather than snapping. Grid container carries a stable `viewTransitionName` so the browser has an old/new pair to interpolate.

---

## 3. Interactive motion — `motion`

### 3.1 Product card

`ProductCard`'s outer wrapper becomes `m.div` with `whileHover={{ y: -6, scale: 1.03 }}`, `whileTap={{ scale: 0.98 }}`, `transition={SPRING.snappy}`. Image zoom and grayscale→color stay CSS transitions (cheaper, already correct). "Quick add" slide-up stays CSS. `will-change: transform` applied on hover start, removed on hover end.

### 3.2 Cart drawer — `components/store/CartDrawer.tsx`

Today `add()` mutates cart state with no visible confirmation. The drawer is that confirmation.

- Built on the existing `components/ui/sheet.tsx` primitive.
- `AnimatePresence` + spring `x: '100%' → 0` on `SPRING.soft`; scrim fades 0→0.6 opacity.
- Line items stagger in at 60ms intervals.
- Opens automatically whenever `add()` fires (subscribed via `cart-context`); closes on scrim click, Escape, or route change.
- Contains: line items, subtotal, "View bag" → `/cart`, "Checkout" → `/checkout`.
- `/cart` page is unchanged and remains the canonical full bag view.
- Focus is trapped while open and restored to the trigger on close; `aria-modal` and a labelled heading are required.

`cart-context` gains an event/subscription hook for "an item was added" so the drawer opens without prop drilling from every call site.

### 3.3 Bag counter

`SiteHeader` bag count renders inside `AnimatePresence` keyed on `count`: old digit exits `y: -12, opacity: 0`, new digit enters `y: 12 → 0`. Wrapper gets a one-shot gold scale-pulse (`1 → 1.18 → 1`) on increment. No pulse on decrement.

### 3.4 Wishlist heart

Fill plus scale overshoot spring on toggle. On add only, six small gold particles animate outward on transform+opacity and unmount. Particles are absolutely positioned, never affect layout.

### 3.5 Header on scroll

`useScroll` → past 80px: vertical padding 22px → 12px, logo `scale: 0.86`, spring `SPRING.soft`. `Marquee` translates up out of view over the same threshold with hysteresis (re-shows below 40px) so it cannot flicker at the boundary. Animated via transform only; the header keeps its existing `sticky` + `backdrop-blur`.

### 3.6 Product detail

- Gallery: thumbnail → main image swap via `layoutId={`pdp-img-${index}`}`.
- Size chips: `whileTap` press feedback plus a shared `layoutId="size-pill"` gold selection bar that slides between chips.
- Add-to-bag button: idle → loading → ✓ check morph, then returns to idle after 1.2s.

### 3.7 Nav underline

Left and right nav links share a `layoutId="nav-underline"` gold bar that slides to the active route. Driven by the existing `usePathname()` check in `SiteHeader`.

---

## 4. Home page

### 4.1 Hero

- Keeps the existing `ldn-kb` Ken Burns keyframe on the background image.
- `PANTHÈRE` becomes per-character spans inside `overflow: hidden` masks, each `translateY(110%) → 0`, 60ms stagger, easing `EASE.out`. Runs once on mount, never on re-render. The `È` keeps its gold color and italic.
- Kicker and CTA follow via `Reveal` with 250ms / 400ms delays.
- Parallax on the hero image only: `useScroll` + `useTransform` driving `y`. Transform-only, no scroll position held in React state.
- Existing overlay gradients and the `ldn-grain` status dot are unchanged.

### 4.2 Sections

Category strip tiles, "Just dropped" cards, and the statement section wrap in `Reveal` with a 90ms per-index stagger. Category tiles adopt the §3.1 spring hover.

---

## 5. Performance budget

- Animate `transform`, `opacity`, and `filter` only. No animated `width`, `height`, `top`, `left`, or `margin` anywhere in this work.
- Added JS ≤ 20 kb gzip total, measured against the current build output.
- CLS stays 0. `Reveal` reserves final space; the drawer is `position: fixed`; particles are absolutely positioned.
- `will-change` is applied on interaction start and removed on end, never left standing.
- Hero image keeps `priority`. No new above-fold network requests.

---

## 6. Verification

Every claim below must be backed by command output before the work is called done.

1. `npm run build` completes with no errors and no new warnings.
2. `npm run lint` clean, including the new `no-restricted-imports` rule.
3. Bundle check: first-load JS for `/`, `/shop`, `/product/[slug]` grows by ≤ 20 kb gzip versus the pre-change build.
4. Playwright run over `/`, `/shop`, `/product/[slug]`, cart drawer open, at 1440×900 and 390×844:
   - before/after screenshots captured,
   - `document.documentElement.scrollWidth <= clientWidth` (no horizontal scroll),
   - CLS measured via `PerformanceObserver` on `layout-shift` equals 0,
   - drawer open traps focus and Escape closes it.
5. Manual checks: card → PDP morph and browser-back reverse; `prefers-reduced-motion: reduce` enabled shows a fully static, fully functional site; Safari loads and navigates correctly (ViewTransitions may degrade to plain navigation — acceptable).

---

## 7. Rollout order

Each step builds, lints, and ships independently.

0. Commit the existing uncommitted `app/(store)/page.tsx` and `public/hero-panthere.png` so motion diffs stay clean.
1. Foundation — §1.
2. Cross-page ViewTransitions — §2.
3. Product card and grid — §3.1, §4.2.
4. Cart drawer and header — §3.2, §3.3, §3.5, §3.7.
5. Product detail — §3.6, plus §3.4 wishlist.
6. Hero — §4.1.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Duplicate `viewTransitionName` breaks a transition | Opt-in `morph` prop, one owning grid per page, dev-only duplicate assertion (§2.1) |
| Safari ViewTransition differences | Degrades to plain navigation; no functional dependency on the animation |
| `motion` bundle creep via a full `motion/react` import | eslint `no-restricted-imports` + bundle check in §6 |
| Drawer changes purchase flow behavior | `/cart` page untouched; drawer is additive confirmation with a direct link to it |
| Scroll-driven header flickers at threshold | Hysteresis band 40–80px (§3.5) |
