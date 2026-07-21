# Storefront Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the La De Noir storefront a coherent motion system — shared-element morphs and directional route transitions across pages, spring feedback on every interactive surface, and a restrained cinematic hero.

**Architecture:** Two systems with a hard boundary. Anything crossing a route boundary uses React's native `<ViewTransition>` (Next 16 `experimental.viewTransition`, 0 kb). Anything responding to a pointer or client state uses `motion` behind `LazyMotion` + `m` components (~17 kb gzip). Nothing does both. Shared timing constants live in one file so nothing drifts.

**Tech Stack:** Next.js 16.2.10 (App Router), React 19.2.4, Tailwind CSS v4, `motion` (React), Playwright (verification only), Supabase (existing data layer, untouched).

**Spec:** `docs/superpowers/specs/2026-07-21-storefront-motion-design.md`

## Global Constraints

- Animate `transform`, `opacity`, and `filter` **only**. No animated `width`, `height`, `top`, `left`, or `margin` anywhere in this work.
- Import `* as m from "motion/react-m"` — **never** `motion` from `motion/react`. Enforced by eslint in Task 1.
- Added first-load JS across `/`, `/shop`, `/product/[slug]` must be **≤ 20 kb gzip** versus the Task 0 baseline.
- CLS must remain **0** on every page.
- Every animated surface must be fully functional and fully static under `prefers-reduced-motion: reduce`.
- Timing values come from `lib/motion.ts` / the `:root` CSS custom properties. No component hardcodes a duration or easing.
- Exact timing values: exit `150ms`, enter `210ms`, morph `400ms`, hover `450ms`.
- Out of scope, do not modify: `app/admin/**`, `app/(store)/checkout`, `app/(store)/account`, `app/(store)/help`, `app/(store)/contact`, `app/(store)/search`.
- `npm run build` and `npm run lint` must pass clean at the end of every task.
- Windows dev gotcha: if dev server wedges with "Could not parse module" or ".next write batch already active", run `Get-Process node | Stop-Process -Force`, delete `.next`, restart one dev server.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `lib/motion.ts` | Timing/easing/spring constants. Single source of truth. No React. |
| `components/motion/MotionProvider.tsx` | Mounts `LazyMotion features={domAnimation}` once. |
| `components/motion/Reveal.tsx` | IntersectionObserver scroll-reveal wrapper. No library. |
| `components/motion/useReducedMotionPref.ts` | Shared reduced-motion media-query hook. |
| `components/store/CartDrawer.tsx` | Spring cart drawer; opens on add. |
| `components/store/HeroTitle.tsx` | Per-letter mask reveal for `PANTHÈRE`. |
| `components/store/HeroImage.tsx` | Parallax hero image (client, transform-only). |
| `app/(store)/shop/loading.tsx` | Shop skeleton, exits `slide-down`. |
| `app/(store)/product/[slug]/loading.tsx` | PDP skeleton, exits `slide-down`. |
| `scripts/motion-check.mjs` | Playwright harness: CLS, horizontal scroll, drawer focus, screenshots. |

**Modified:**

| File | Change |
|---|---|
| `next.config.ts` | Enable `experimental.viewTransition`. |
| `eslint.config.mjs` | `no-restricted-imports` guarding the motion bundle. |
| `app/globals.css` | Timing custom properties, `::view-transition-*` rules, reduced-motion block, hero letter keyframes. |
| `app/(store)/layout.tsx` | `MotionProvider`, `<ViewTransition>` around `<main>`, `CartDrawer` mount. |
| `components/store/cart-context.tsx` | Add-event subscription so the drawer can open. |
| `components/store/ProductCard.tsx` | `morph` prop, spring hover, ViewTransition names. |
| `components/store/SiteHeader.tsx` | Anchoring name, scroll shrink, animated bag count, nav underline. |
| `components/store/Marquee.tsx` | Anchoring name, scroll hide. |
| `components/store/SiteFooter.tsx` | Anchoring name. |
| `app/(store)/shop/ShopGrid.tsx` | `startTransition` filtering, `morph` cards. |
| `app/(store)/page.tsx` | Hero components, `Reveal` staggers, `transitionTypes` links. |
| `app/(store)/product/[slug]/ProductDetail.tsx` | Morph target, gallery `layoutId`, size pill, button morph, wishlist heart. |

---

## Task 0: Baseline

**Files:**
- Modify: `next.config.ts`
- Commit: existing untracked `public/hero-panthere.png` and modified `app/(store)/page.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `docs/superpowers/plans/baseline-bundle.txt` — the pre-change first-load JS numbers every later task measures against.

- [ ] **Step 1: Commit the pre-existing working-tree changes so motion diffs stay clean**

```bash
git add "app/(store)/page.tsx" public/hero-panthere.png
git commit -m "feat: hero campaign image on home page"
```

- [ ] **Step 2: Record the bundle baseline**

```bash
npm run build 2>&1 | tee docs/superpowers/plans/baseline-bundle.txt
```

Expected: build completes with "Compiled successfully". The file now contains the route table with First Load JS per route. Confirm rows for `/`, `/shop`, and `/product/[slug]` are present:

```bash
grep -E "^[├└│ ]*[○ƒ●] /" docs/superpowers/plans/baseline-bundle.txt
```

- [ ] **Step 3: Enable view transitions**

Replace the whole of `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
```

- [ ] **Step 4: Verify the flag is accepted**

Run: `npm run build`
Expected: "Compiled successfully", and **no** warning containing "Invalid next.config.ts options" or "Unrecognized key". If such a warning appears, stop — the installed Next version does not expose this flag and the plan needs revisiting.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts docs/superpowers/plans/baseline-bundle.txt
git commit -m "chore: enable experimental viewTransition, record bundle baseline"
```

---

## Task 1: Motion foundation

**Files:**
- Create: `lib/motion.ts`, `components/motion/useReducedMotionPref.ts`, `components/motion/MotionProvider.tsx`, `components/motion/Reveal.tsx`, `scripts/motion-check.mjs`
- Modify: `app/globals.css`, `app/(store)/layout.tsx`, `eslint.config.mjs`, `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - From `@/lib/motion`: `EASE: { out: string; spring: string }`, `DURATION: { exit: 150; enter: 210; morph: 400; hover: 450 }`, `SPRING: { soft, snappy }`, `STAGGER: 90`
  - `useReducedMotionPref(): boolean` from `@/components/motion/useReducedMotionPref`
  - `<MotionProvider>{children}</MotionProvider>` from `@/components/motion/MotionProvider`
  - `<Reveal delay?: number; as?: React.ElementType; className?: string>` from `@/components/motion/Reveal`
  - `node scripts/motion-check.mjs` — the check harness every later task extends
  - CSS custom properties `--duration-exit|enter|morph|hover`, `--ease-out`, `--ease-spring` on `:root`

- [ ] **Step 1: Install dependencies**

```bash
npm install motion
npm install -D playwright
npx playwright install chromium
```

Note: prior work in this repo installed Playwright temporarily and removed it before committing. This plan keeps it as a permanent devDependency — motion work needs a repeatable visual/CLS check, and reinstalling per session defeats that. It is a devDependency, so it does not reach the production bundle.

- [ ] **Step 2: Write the failing check harness**

Create `scripts/motion-check.mjs`:

```js
// Motion verification harness. Run against a dev or prod server:
//   node scripts/motion-check.mjs
// Env: BASE_URL (default http://localhost:3000)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", ".screens");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const ROUTES = ["/", "/shop"];

const failures = [];
const fail = (msg) => {
  failures.push(msg);
  console.error("FAIL:", msg);
};
const pass = (msg) => console.log("pass:", msg);

// Collects layout shifts that happen after load, which is what our
// animations could plausibly cause.
async function measureCLS(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) cls += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(cls), 2500);
      })
  );
}

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  const page = await ctx.newPage();

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(800); // localStorage hydration for cart/wishlist

    const cls = await measureCLS(page);
    if (cls > 0) fail(`CLS ${cls.toFixed(4)} on ${route} @ ${vp.name} (must be 0)`);
    else pass(`CLS 0 on ${route} @ ${vp.name}`);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    if (overflows) fail(`horizontal scroll on ${route} @ ${vp.name}`);
    else pass(`no horizontal scroll on ${route} @ ${vp.name}`);

    await page.screenshot({
      path: join(OUT, `${vp.name}${route.replace(/\//g, "_") || "_home"}.png`),
      fullPage: true,
    });
  }
  await ctx.close();
}

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks passed");
```

- [ ] **Step 3: Run the harness to confirm it works against the current site**

In one terminal: `npm run dev`
In another: `node scripts/motion-check.mjs`

Expected: exits 0, prints "all checks passed", writes PNGs into `.screens/`. These PNGs are the visual "before". If CLS fails here, the site already has a shift — record it and treat that number, not 0, as the ceiling for later tasks.

- [ ] **Step 4: Create the timing constants**

Create `lib/motion.ts`:

```ts
/**
 * Single source of truth for storefront motion timing.
 * CSS mirrors these values as custom properties on :root in app/globals.css.
 * Nothing else may hardcode a duration or easing.
 */

export const EASE = {
  /** entries, reveals, view transitions */
  out: "cubic-bezier(.22,.7,.3,1)",
  /**
   * CSS-native spring approximation (~bounce .25), for hover/press on
   * elements that must stay out of the motion bundle.
   */
  spring:
    "linear(0, .006, .026, .06, .108, .17, .247, .337, .437, .541, .645, .742, .827, .898, .952, .99, 1.012, 1.021, 1.02, 1.014, 1.007, 1.001, .998, .997, .998, 1)",
} as const;

/** milliseconds */
export const DURATION = {
  /** old content leaves fast so it stops competing for attention */
  exit: 150,
  /** new content arrives gently, delayed until the exit finishes */
  enter: 210,
  /** shared-element flight */
  morph: 400,
  hover: 450,
} as const;

export const SPRING = {
  soft: { type: "spring", visualDuration: 0.45, bounce: 0.18 },
  snappy: { type: "spring", visualDuration: 0.3, bounce: 0.32 },
} as const;

/** per-index stagger for scroll reveals, ms */
export const STAGGER = 90;
```

- [ ] **Step 5: Create the reduced-motion hook**

Create `components/motion/useReducedMotionPref.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

/**
 * True when the user asked for reduced motion. Starts false so server and
 * first client render agree; the effect corrects it before paint work matters.
 */
export function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 6: Create the motion provider**

Create `components/motion/MotionProvider.tsx`:

```tsx
"use client";

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Mounted once in app/(store)/layout.tsx. Every animated component imports
 * `* as m from "motion/react-m"` so only domAnimation features ship.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
```

- [ ] **Step 7: Create the Reveal component**

Create `components/motion/Reveal.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { DURATION, EASE } from "@/lib/motion";
import { useReducedMotionPref } from "./useReducedMotionPref";

/**
 * Scroll reveal. Reserves final layout space at all times and animates only
 * opacity + translateY, so it contributes zero CLS. Observes once.
 *
 * Elements already inside the first viewport at mount render visible
 * immediately — above-fold content never waits on an observer callback.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div" as ElementType,
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotionPref();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      setShown(true);
      return;
    }

    // Above the fold at mount: show now, never observe.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(18px)",
        transition: reduced
          ? "none"
          : `opacity ${DURATION.enter}ms ${EASE.out} ${delay}ms, transform ${DURATION.hover}ms ${EASE.out} ${delay}ms`,
        willChange: shown ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 8: Add CSS custom properties and the reduced-motion block**

Append to `app/globals.css`:

```css
/* ── Motion system ────────────────────────────────────────────────
   Mirrors lib/motion.ts. Keep the two in sync. */
:root {
  --duration-exit: 150ms;
  --duration-enter: 210ms;
  --duration-morph: 400ms;
  --duration-hover: 450ms;
  --ease-out: cubic-bezier(0.22, 0.7, 0.3, 1);
  --ease-spring: linear(
    0, .006, .026, .06, .108, .17, .247, .337, .437, .541, .645, .742,
    .827, .898, .952, .99, 1.012, 1.021, 1.02, 1.014, 1.007, 1.001,
    .998, .997, .998, 1
  );
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

- [ ] **Step 9: Mount the provider**

In `app/(store)/layout.tsx`, add the import and wrap the tree. The full file becomes:

```tsx
import { CartProvider } from "@/components/store/cart-context";
import { WishlistProvider } from "@/components/store/wishlist-context";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Marquee } from "@/components/store/Marquee";
import { SiteHeader } from "@/components/store/SiteHeader";
import { SiteFooter } from "@/components/store/SiteFooter";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <MotionProvider>
          <div className="flex min-h-screen flex-col bg-noir text-cream">
            <Marquee />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </MotionProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
```

- [ ] **Step 10: Add the eslint bundle guard**

Replace `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Importing `motion` pulls the full feature bundle and defeats
      // LazyMotion. Use `* as m from "motion/react-m"` instead.
      // AnimatePresence / LazyMotion / hooks stay importable from motion/react.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "motion/react",
              importNames: ["motion"],
              message:
                'Import `* as m from "motion/react-m"` instead — `motion` defeats LazyMotion and doubles the bundle.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

- [ ] **Step 11: Prove the eslint rule actually fires**

Temporarily append to `components/motion/MotionProvider.tsx`:

```tsx
// TEMP: rule check
import { motion } from "motion/react";
```

Run: `npm run lint`
Expected: error on that line — `Import \`* as m from "motion/react-m"\` instead`.

Now delete those two temp lines and run `npm run lint` again.
Expected: clean, no errors.

- [ ] **Step 12: Verify build and checks**

```bash
npm run build
```
Expected: "Compiled successfully".

Restart dev, then:
```bash
node scripts/motion-check.mjs
```
Expected: "all checks passed", exit 0. Nothing visible changed yet — this confirms the foundation is inert.

- [ ] **Step 13: Commit**

```bash
git add lib/motion.ts components/motion scripts/motion-check.mjs \
  app/globals.css "app/(store)/layout.tsx" eslint.config.mjs \
  package.json package-lock.json
git commit -m "feat: motion foundation — timing constants, LazyMotion provider, Reveal, checks"
```

---

## Task 2: Cross-page view transitions

**Files:**
- Modify: `app/(store)/layout.tsx`, `app/globals.css`, `components/store/Marquee.tsx`, `components/store/SiteHeader.tsx`, `components/store/SiteFooter.tsx`, `components/store/ProductCard.tsx`, `app/(store)/product/[slug]/ProductDetail.tsx`, `app/(store)/shop/ShopGrid.tsx`, `app/(store)/page.tsx`
- Create: `app/(store)/shop/loading.tsx`, `app/(store)/product/[slug]/loading.tsx`

**Interfaces:**
- Consumes: `DURATION` from `@/lib/motion` (CSS mirrors only; no JS import needed here).
- Produces:
  - `ProductCard` gains `morph?: boolean` (default `false`). When true the card claims view-transition names `product-<slug>` and `ptitle-<slug>`.
  - Transition type strings `"nav-forward"` and `"nav-back"`, consumed by `<Link transitionTypes={[...]}>`.
  - Anchored chrome names `site-marquee`, `site-header`, `site-footer`.

- [ ] **Step 1: Write the failing navigation check**

Append to `scripts/motion-check.mjs`, immediately before `await browser.close();`:

```js
// ── Cross-page transitions ───────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Exactly one element may claim each product's morph name.
  const dupes = await page.evaluate(() => {
    const names = [...document.querySelectorAll("[style*='view-transition-name']")]
      .map((el) => el.style.viewTransitionName)
      .filter(Boolean);
    const seen = new Set();
    const dup = new Set();
    for (const n of names) {
      if (seen.has(n)) dup.add(n);
      seen.add(n);
    }
    return [...dup];
  });
  if (dupes.length) fail(`duplicate view-transition-name on /shop: ${dupes.join(", ")}`);
  else pass("no duplicate view-transition-name on /shop");

  // Header must be anchored so it cannot slide during navigation.
  const anchored = await page.evaluate(() => {
    const h = document.querySelector("header");
    return h ? getComputedStyle(h).viewTransitionName : null;
  });
  if (anchored !== "site-header") fail(`header viewTransitionName is ${anchored}, expected site-header`);
  else pass("header anchored as site-header");

  // Navigating card -> PDP must land on a product page without error.
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForURL(/\/product\//, { timeout: 5000 });
  await page.waitForTimeout(1000);
  const pdpMorph = await page.evaluate(() =>
    [...document.querySelectorAll("[style*='view-transition-name']")].some((el) =>
      el.style.viewTransitionName.startsWith("product-")
    )
  );
  if (!pdpMorph) fail("PDP has no product-* view-transition-name to morph into");
  else pass("PDP claims a product-* morph name");

  await page.screenshot({ path: join(OUT, "desktop_pdp.png"), fullPage: true });
  await ctx.close();
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node scripts/motion-check.mjs
```
Expected: FAIL — `header viewTransitionName is none, expected site-header` and `PDP has no product-* view-transition-name to morph into`.

- [ ] **Step 3: Anchor the chrome**

In `components/store/Marquee.tsx`, add the style to the outer `div`:

```tsx
    <div
      className={`overflow-hidden bg-gold py-2.5 text-noir-deep ${className}`}
      style={{ viewTransitionName: "site-marquee" }}
    >
```

In `components/store/SiteHeader.tsx`, add the style to the `<header>`:

```tsx
    <header
      className="sticky top-0 z-30 border-b border-gold/20 bg-noir/90 backdrop-blur-md"
      style={{ viewTransitionName: "site-header" }}
    >
```

In `components/store/SiteFooter.tsx`, add `style={{ viewTransitionName: "site-footer" }}` to the outermost `<footer>` element.

- [ ] **Step 4: Add the view-transition CSS**

Append to `app/globals.css`:

```css
/* ── View transitions ─────────────────────────────────────────────
   Shared-element morph: blur mid-flight hides interpolation artifacts. */
::view-transition-group(.morph) {
  animation-duration: var(--duration-morph);
}
::view-transition-image-pair(.morph) {
  animation-name: ldn-via-blur;
}
@keyframes ldn-via-blur {
  30% {
    filter: blur(3px);
  }
}

/* Directional route slides. Old leaves fast, new arrives after it. */
::view-transition-old(.nav-forward) {
  --slide-offset: -60px;
  animation:
    var(--duration-exit) ease-in both ldn-vt-fade reverse,
    var(--duration-morph) ease-in-out both ldn-vt-slide reverse;
}
::view-transition-new(.nav-forward) {
  --slide-offset: 60px;
  animation:
    var(--duration-enter) ease-out var(--duration-exit) both ldn-vt-fade,
    var(--duration-morph) ease-in-out both ldn-vt-slide;
}
::view-transition-old(.nav-back) {
  --slide-offset: 60px;
  animation:
    var(--duration-exit) ease-in both ldn-vt-fade reverse,
    var(--duration-morph) ease-in-out both ldn-vt-slide reverse;
}
::view-transition-new(.nav-back) {
  --slide-offset: -60px;
  animation:
    var(--duration-enter) ease-out var(--duration-exit) both ldn-vt-fade,
    var(--duration-morph) ease-in-out both ldn-vt-slide;
}
@keyframes ldn-vt-fade {
  from {
    filter: blur(3px);
    opacity: 0;
  }
  to {
    filter: blur(0);
    opacity: 1;
  }
}
@keyframes ldn-vt-slide {
  from {
    translate: var(--slide-offset);
  }
  to {
    translate: 0;
  }
}

/* Suspense reveal: skeleton yields to content. */
::view-transition-old(.slide-down) {
  animation:
    var(--duration-exit) ease-out both ldn-vt-fade reverse,
    var(--duration-exit) ease-out both ldn-vt-slide-y reverse;
}
::view-transition-new(.slide-up) {
  animation:
    var(--duration-enter) ease-in var(--duration-exit) both ldn-vt-fade,
    var(--duration-morph) ease-in both ldn-vt-slide-y;
}
@keyframes ldn-vt-slide-y {
  from {
    transform: translateY(10px);
  }
  to {
    transform: translateY(0);
  }
}

/* Chrome must not move while content slides. */
::view-transition-group(site-marquee),
::view-transition-group(site-header),
::view-transition-group(site-footer) {
  animation: none;
  z-index: 100;
}
::view-transition-old(site-marquee),
::view-transition-old(site-header),
::view-transition-old(site-footer) {
  display: none;
}
::view-transition-new(site-marquee),
::view-transition-new(site-header),
::view-transition-new(site-footer) {
  animation: none;
}
```

- [ ] **Step 5: Wrap `<main>` in a directional ViewTransition**

`app/(store)/layout.tsx` becomes:

```tsx
import { ViewTransition } from "react";
import { CartProvider } from "@/components/store/cart-context";
import { WishlistProvider } from "@/components/store/wishlist-context";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Marquee } from "@/components/store/Marquee";
import { SiteHeader } from "@/components/store/SiteHeader";
import { SiteFooter } from "@/components/store/SiteFooter";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <MotionProvider>
          <div className="flex min-h-screen flex-col bg-noir text-cream">
            <Marquee />
            <SiteHeader />
            <ViewTransition
              enter={{
                "nav-forward": "nav-forward",
                "nav-back": "nav-back",
                default: "none",
              }}
              exit={{
                "nav-forward": "nav-forward",
                "nav-back": "nav-back",
                default: "none",
              }}
              default="none"
            >
              <main className="flex-1">{children}</main>
            </ViewTransition>
            <SiteFooter />
          </div>
        </MotionProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
```

- [ ] **Step 6: Give ProductCard an opt-in morph**

In `components/store/ProductCard.tsx`: add `ViewTransition` to the React import, add the `morph` prop, wrap the image and the title/price block.

Change the import line and signature:

```tsx
import { ViewTransition } from "react";
import Link from "next/link";
import { useCart } from "./cart-context";
import { formatINR, type Product } from "@/lib/types";

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
```

Add `transitionTypes` to the `Link` and wrap the image:

```tsx
    <Link
      href={`/product/${product.slug}`}
      transitionTypes={["nav-forward"]}
      className="group block"
    >
      <div className="relative mb-3.5 aspect-[4/5] overflow-hidden border border-gold/12 bg-noir-panel transition-[border-color,transform] duration-500 group-hover:-translate-y-1 group-hover:border-gold">
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
```

The rest of the image container (tag badge, quick-add button) is unchanged. Then wrap the title row — replace the existing title/price `div` with:

```tsx
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
```

- [ ] **Step 7: Add the dev-only duplicate-name assertion**

Add to `components/store/ProductCard.tsx`, after the imports:

```tsx
const claimed = new Set<string>();

/**
 * A viewTransitionName must be unique per document. Two cards claiming the
 * same product silently breaks the morph, so shout about it in development.
 */
function useMorphNameGuard(slug: string, active: boolean) {
  useEffect(() => {
    if (!active || process.env.NODE_ENV === "production") return;
    if (claimed.has(slug)) {
      console.error(
        `[ldn/motion] Two ProductCards claim morph name "product-${slug}". ` +
          `Only one grid per page may pass morph.`
      );
    }
    claimed.add(slug);
    return () => {
      claimed.delete(slug);
    };
  }, [slug, active]);
}
```

Add `useEffect` to the React import (`import { useEffect, ViewTransition } from "react";`) and call the guard as the first line of the component body:

```tsx
  useMorphNameGuard(product.slug, morph);
```

- [ ] **Step 8: Claim the morph on the shop grid, with crossfade filtering**

In `app/(store)/shop/ShopGrid.tsx`, change the import and the filter handler, and pass `morph`:

```tsx
import { useState, useTransition } from "react";
```

Inside the component, after `const [active, setActive] = useState(initial);`:

```tsx
  const [, startTransition] = useTransition();
```

Change the filter button handler:

```tsx
                onClick={() => startTransition(() => setActive(f))}
```

Give the grid container a stable transition name and pass `morph` to the cards:

```tsx
        <div
          className="grid grid-cols-2 gap-[22px] lg:grid-cols-4"
          style={{ viewTransitionName: "shop-grid" }}
        >
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} morph />
          ))}
        </div>
```

- [ ] **Step 9: Claim the morph on the home "Just dropped" grid**

In `app/(store)/page.tsx`, in the JUST DROPPED section, change the card render to:

```tsx
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} morph />
          ))}
```

Also add `transitionTypes` to the category tiles and the "View all" link:

```tsx
          <Link
            key={c.id}
            href={`/shop?c=${encodeURIComponent(c.name)}`}
            transitionTypes={["nav-forward"]}
            className="group relative aspect-[1/1.15] overflow-hidden border-b border-r border-gold/20 bg-burgundy"
          >
```

```tsx
          <Link
            href="/shop"
            transitionTypes={["nav-forward"]}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-gold"
          >
            View all →
          </Link>
```

And the hero CTA:

```tsx
          <Link
            href="/shop"
            transitionTypes={["nav-forward"]}
            className="mt-8 bg-gold px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-burgundy-deep transition-colors hover:bg-cream"
          >
            Shop the collection →
          </Link>
```

- [ ] **Step 10: Receive the morph on the PDP**

In `app/(store)/product/[slug]/ProductDetail.tsx`, add `ViewTransition` to the React import:

```tsx
import { useState, ViewTransition } from "react";
```

Wrap the main gallery image (the `<img>` inside the `aspect-[4/5]` container):

```tsx
            <ViewTransition name={`product-${product.slug}`} share="morph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[imgIdx]}
                alt={product.name}
                className="absolute inset-0 size-full object-cover contrast-[1.04] grayscale-[0.15]"
              />
            </ViewTransition>
```

Wrap the `<h1>` + price row so the title morphs too:

```tsx
          <ViewTransition name={`ptitle-${product.slug}`} share="morph">
            <div>
              <h1 className="font-serif text-[38px] font-medium leading-[0.95] tracking-[-0.01em] sm:text-[58px]">
                {product.name}
              </h1>
              <div className="mb-2 mt-[18px] flex items-center gap-4">
                <div className="font-mono text-[22px] font-medium text-gold">
                  {formatINR(product.price_inr)}
                </div>
                <div className="font-mono text-[11px] tracking-[0.05em] text-cream/45">
                  ★★★★★ ({product.sold_count})
                </div>
              </div>
            </div>
          </ViewTransition>
```

Tag the breadcrumb "SHOP" link as a back navigation:

```tsx
        <Link href="/shop" transitionTypes={["nav-back"]} className="hover:text-gold">
          SHOP
        </Link>
```

- [ ] **Step 11: Add the Suspense skeletons**

Create `app/(store)/shop/loading.tsx`:

```tsx
import { ViewTransition } from "react";

export default function ShopLoading() {
  return (
    <ViewTransition exit="slide-down">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/12 px-[5vw] py-[22px]">
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[38px] w-24 animate-pulse border border-gold/20 bg-noir-panel"
              />
            ))}
          </div>
        </div>
        <div className="px-[5vw] pb-20 pt-10">
          <div className="grid grid-cols-2 gap-[22px] lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="mb-3.5 aspect-[4/5] animate-pulse border border-gold/12 bg-noir-panel" />
                <div className="h-4 w-2/3 animate-pulse bg-noir-panel" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
```

Create `app/(store)/product/[slug]/loading.tsx`:

```tsx
import { ViewTransition } from "react";

export default function ProductLoading() {
  return (
    <ViewTransition exit="slide-down">
      <div className="grid items-stretch lg:grid-cols-[1.35fr_1fr]">
        <div className="grid grid-cols-[64px_1fr] gap-4 px-[5vw] py-7 lg:pr-[2vw]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[1/1.1] animate-pulse border border-gold/20 bg-noir-panel"
              />
            ))}
          </div>
          <div className="aspect-[4/5] animate-pulse border border-gold/15 bg-noir-panel" />
        </div>
        <div className="flex flex-col justify-center gap-4 border-t border-gold/15 px-[5vw] py-10 lg:border-l lg:border-t-0 lg:pl-[3vw]">
          <div className="h-12 w-3/4 animate-pulse bg-noir-panel" />
          <div className="h-6 w-1/3 animate-pulse bg-noir-panel" />
          <div className="h-24 w-full animate-pulse bg-noir-panel" />
          <div className="h-14 w-full animate-pulse bg-noir-panel" />
        </div>
      </div>
    </ViewTransition>
  );
}
```

Wrap the PDP content in `app/(store)/product/[slug]/page.tsx` so the enter side is animated. Add to the imports:

```tsx
import { ViewTransition } from "react";
```

and wrap the rendered `<ProductDetail ... />` element:

```tsx
      <ViewTransition enter="slide-up" default="none">
        <ProductDetail product={product} />
      </ViewTransition>
```

Do the same in `app/(store)/shop/page.tsx` around `<ShopGrid ... />`.

- [ ] **Step 12: Run the checks**

```bash
npm run lint && npm run build
```
Expected: both clean.

Restart dev, then:
```bash
node scripts/motion-check.mjs
```
Expected: "all checks passed" — including "no duplicate view-transition-name on /shop", "header anchored as site-header", "PDP claims a product-* morph name". CLS still 0.

- [ ] **Step 13: Manual confirmation**

In a Chromium browser at `http://localhost:3000/shop`: click a product card. The card image should visibly fly and scale into the PDP hero rather than cutting. Press browser Back — the morph reverses. The header and gold marquee must not move at any point during either navigation.

- [ ] **Step 14: Commit**

```bash
git add "app/(store)" app/globals.css components/store scripts/motion-check.mjs
git commit -m "feat: shared-element morphs and directional route transitions"
```

---

## Task 3: Product card springs and section reveals

**Files:**
- Modify: `components/store/ProductCard.tsx`, `app/(store)/page.tsx`

**Interfaces:**
- Consumes: `SPRING`, `STAGGER` from `@/lib/motion`; `Reveal` from `@/components/motion/Reveal`; `morph` prop from Task 2.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Add the failing hover check**

Append to `scripts/motion-check.mjs`, before `await browser.close();`:

```js
// ── Card hover spring ────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const card = page.locator("a[href^='/product/']").first();
  const before = await card.evaluate((el) => getComputedStyle(el).transform);
  await card.hover();
  await page.waitForTimeout(400);
  const after = await card.evaluate((el) => getComputedStyle(el).transform);

  if (before === after) fail("product card does not transform on hover");
  else pass("product card transforms on hover");

  await ctx.close();
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node scripts/motion-check.mjs
```
Expected: FAIL — `product card does not transform on hover` (the current hover transform lives on an inner div, not the link).

- [ ] **Step 3: Replace the card's CSS hover with a spring**

In `components/store/ProductCard.tsx`, add to the imports:

```tsx
import * as m from "motion/react-m";
import { SPRING } from "@/lib/motion";
```

Wrap the `Link` contents in an `m.div`. Replace the opening of the returned JSX so the link's child is a motion element, and drop `group-hover:-translate-y-1` from the image container (the spring owns Y now):

```tsx
    <Link
      href={`/product/${product.slug}`}
      transitionTypes={["nav-forward"]}
      className="group block"
    >
      <m.div
        whileHover={{ y: -6, scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING.snappy}
        style={{ transformOrigin: "center bottom" }}
      >
        <div className="relative mb-3.5 aspect-[4/5] overflow-hidden border border-gold/12 bg-noir-panel transition-[border-color] duration-500 group-hover:border-gold">
```

Close the `m.div` immediately before the closing `</Link>`. Everything between (image/ViewTransition block, tag badge, quick-add button, title row) is unchanged from Task 2.

- [ ] **Step 4: Verify the hover check passes**

```bash
node scripts/motion-check.mjs
```
Expected: "product card transforms on hover" passes, CLS still 0 on all routes.

- [ ] **Step 5: Add reveals to the home sections**

In `app/(store)/page.tsx`, add the imports:

```tsx
import { Reveal } from "@/components/motion/Reveal";
import { STAGGER } from "@/lib/motion";
```

Wrap each category tile — inside the `strip.map`, wrap the `<Link>` in a `Reveal` carrying the stagger:

```tsx
        {strip.map((c, i) => (
          <Reveal key={c.id} delay={i * STAGGER}>
            <Link
              href={`/shop?c=${encodeURIComponent(c.name)}`}
              transitionTypes={["nav-forward"]}
              className="group relative block aspect-[1/1.15] overflow-hidden border-b border-r border-gold/20 bg-burgundy"
            >
```

(close with `</Link></Reveal>` and drop the now-duplicated `key` from the `Link`).

Wrap each featured card:

```tsx
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * STAGGER}>
              <ProductCard product={p} morph />
            </Reveal>
          ))}
```

Wrap the statement `<p>`:

```tsx
        <Reveal>
          <p className="mx-auto max-w-[760px] font-serif text-3xl font-normal italic leading-tight text-cream sm:text-[44px]">
```

- [ ] **Step 6: Verify no layout shift was introduced**

```bash
npm run lint && npm run build
```
Expected: both clean.

```bash
node scripts/motion-check.mjs
```
Expected: all pass, **CLS 0 on `/` at both viewports**. If CLS is non-zero, a `Reveal` is wrapping an element whose layout it changes — check that no `Reveal` was placed as a direct grid child where the original element carried grid-affecting classes.

- [ ] **Step 7: Commit**

```bash
git add components/store/ProductCard.tsx "app/(store)/page.tsx" scripts/motion-check.mjs
git commit -m "feat: spring hover on product cards, staggered home section reveals"
```

---

## Task 4: Cart drawer, bag counter, header scroll, nav underline

**Files:**
- Create: `components/store/CartDrawer.tsx`
- Modify: `components/store/cart-context.tsx`, `components/store/SiteHeader.tsx`, `components/store/Marquee.tsx`, `app/(store)/layout.tsx`

**Interfaces:**
- Consumes: `SPRING` from `@/lib/motion`; `useCart` from `@/components/store/cart-context`.
- Produces:
  - `useCart()` gains `onAdd: (fn: () => void) => () => void` — subscribe to add events, returns an unsubscribe function.
  - `<CartDrawer />` — self-mounting, no props, placed once in the store layout.

- [ ] **Step 1: Write the failing drawer check**

Append to `scripts/motion-check.mjs`, before `await browser.close();`:

```js
// ── Cart drawer ──────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.locator("a[href^='/product/']").first().hover();
  await page.getByRole("button", { name: /quick add/i }).first().click();
  await page.waitForTimeout(700);

  const drawer = page.getByRole("dialog", { name: /your bag/i });
  if (!(await drawer.isVisible())) fail("cart drawer did not open on quick add");
  else pass("cart drawer opens on quick add");

  const focusInside = await page.evaluate(() => {
    const d = document.querySelector("[role='dialog']");
    return !!d && d.contains(document.activeElement);
  });
  if (!focusInside) fail("focus is not inside the open drawer");
  else pass("focus moves into the drawer");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  if (await drawer.isVisible()) fail("Escape did not close the cart drawer");
  else pass("Escape closes the cart drawer");

  const cls = await measureCLS(page);
  if (cls > 0) fail(`drawer caused CLS ${cls.toFixed(4)}`);
  else pass("drawer causes no layout shift");

  await ctx.close();
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node scripts/motion-check.mjs
```
Expected: FAIL — `cart drawer did not open on quick add`.

- [ ] **Step 3: Add the add-event subscription to the cart context**

In `components/store/cart-context.tsx`, add `useRef` and `useCallback` to the React import, extend the `CartState` type, and emit on add.

Type change:

```ts
type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  ready: boolean;
  /** Subscribe to "an item was added". Returns an unsubscribe function. */
  onAdd: (fn: () => void) => () => void;
};
```

Inside `CartProvider`, above the `useMemo`:

```tsx
  const addListeners = useRef(new Set<() => void>());

  const onAdd = useCallback((fn: () => void) => {
    addListeners.current.add(fn);
    return () => {
      addListeners.current.delete(fn);
    };
  }, []);
```

In the `add` implementation inside `useMemo`, after the `setItems(...)` call:

```tsx
      for (const fn of addListeners.current) fn();
```

And extend the returned object and the dependency array:

```tsx
    return { items, add, remove, setQty, clear, count, subtotal, ready, onAdd };
  }, [items, ready, onAdd]);
```

- [ ] **Step 4: Create the drawer**

Create `components/store/CartDrawer.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { X } from "lucide-react";
import { useCart } from "./cart-context";
import { SPRING } from "@/lib/motion";
import { formatINR } from "@/lib/types";

/**
 * Confirmation surface for cart additions. Previously `add()` mutated state
 * with no visible feedback. /cart remains the canonical full bag view.
 */
export function CartDrawer() {
  const { items, subtotal, onAdd, remove } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  // open on any add
  useEffect(() => {
    return onAdd(() => {
      restoreTo.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    });
  }, [onAdd]);

  // close on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // escape, focus move-in, focus restore, scroll lock
  useEffect(() => {
    if (!open) {
      restoreTo.current?.focus?.();
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <m.div
            className="absolute inset-0 bg-noir-deep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
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
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING.soft}
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
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING.soft, delay: 0.06 * idx }}
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
```

- [ ] **Step 5: Mount the drawer**

In `app/(store)/layout.tsx`, add the import and place it as the last child inside `MotionProvider`, after `<SiteFooter />`:

```tsx
import { CartDrawer } from "@/components/store/CartDrawer";
```

```tsx
            <SiteFooter />
            <CartDrawer />
```

- [ ] **Step 6: Verify the drawer checks pass**

```bash
node scripts/motion-check.mjs
```
Expected: "cart drawer opens on quick add", "focus moves into the drawer", "Escape closes the cart drawer", "drawer causes no layout shift" all pass.

- [ ] **Step 7: Commit the drawer**

```bash
git add components/store/CartDrawer.tsx components/store/cart-context.tsx \
  "app/(store)/layout.tsx" scripts/motion-check.mjs
git commit -m "feat: spring cart drawer with add-event subscription"
```

- [ ] **Step 8: Animate the bag counter, header shrink, and nav underline**

In `components/store/SiteHeader.tsx`, add the imports:

```tsx
import { AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import * as m from "motion/react-m";
import { SPRING } from "@/lib/motion";
```

Add scroll state inside the component, after the existing hooks:

```tsx
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);

  // Hysteresis band: condense past 80px, expand again below 40px, so the
  // header cannot flicker when the user hovers the threshold.
  useMotionValueEvent(scrollY, "change", (y) => {
    setCondensed((prev) => (prev ? y > 40 : y > 80));
  });
```

Replace the inner container `div` with a motion element. Padding is a layout
property and the global constraints forbid animating it, so the header
condenses by scaling a fixed-height wrapper on the Y axis from its top edge:

```tsx
      <m.div
        className="flex origin-top items-center justify-between px-[5vw] py-[22px]"
        animate={{ scaleY: condensed ? 0.72 : 1 }}
        transition={SPRING.soft}
      >
```

(close it as `</m.div>`.)

Because `scaleY` squashes the contents too, counter-scale the three direct
children (left nav, logo link, right nav) so text stays undistorted. Wrap each
of the three in:

```tsx
        <m.div
          animate={{ scaleY: condensed ? 1 / 0.72 : 1 }}
          transition={SPRING.soft}
          className="origin-top"
        >
```

**Documented fallback:** if counter-scaling reads as visually unstable during
review (text shimmer at the midpoint of the spring is the usual tell), swap to
toggling the Tailwind padding class `py-[22px]` ↔ `py-3` with a plain CSS
`transition: padding var(--duration-hover) var(--ease-out)` scoped to this one
element. That is a deliberate, single-element exception to the transform-only
rule. If you take it, say so explicitly in the commit message.

Scale the logo:

```tsx
        <Link href="/" className="flex-1 text-center leading-none">
          <m.div
            animate={{ scale: condensed ? 0.86 : 1 }}
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
```

Animate the bag count:

```tsx
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
```

Add the shared nav underline — inside each nav `Link`, wrap the label:

```tsx
            <Link key={l.href} href={l.href} className={`relative ${linkCls(l.href)}`}>
              {l.label}
              {pathname === l.href && (
                <m.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
                  transition={SPRING.snappy}
                />
              )}
            </Link>
```

Apply the same wrapper to the `RIGHT_LINKS` map.

- [ ] **Step 9: Hide the marquee on scroll**

`components/store/Marquee.tsx` is currently a server component. Add `"use client";` at the top, then add the scroll-driven translate to the outer div:

```tsx
"use client";

import { useState } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import * as m from "motion/react-m";
import { SPRING } from "@/lib/motion";
```

```tsx
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    setHidden((prev) => (prev ? y > 40 : y > 80));
  });
```

```tsx
    <m.div
      className={`overflow-hidden bg-gold py-2.5 text-noir-deep ${className}`}
      style={{ viewTransitionName: "site-marquee" }}
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={SPRING.soft}
    >
```

- [ ] **Step 10: Verify**

```bash
npm run lint && npm run build
```
Expected: both clean.

```bash
node scripts/motion-check.mjs
```
Expected: all pass, CLS 0 everywhere.

Manual: scroll `/shop` past 100px — header condenses, logo shrinks, marquee slides up. Scroll back to top — both restore, with no flicker while hovering ~60px. Navigate between Shop and Maison — the gold underline slides between links.

- [ ] **Step 11: Commit**

```bash
git add components/store/SiteHeader.tsx components/store/Marquee.tsx
git commit -m "feat: animated bag counter, scroll-condensed header, sliding nav underline"
```

---

## Task 5: Product detail interactions

**Files:**
- Modify: `app/(store)/product/[slug]/ProductDetail.tsx`

**Interfaces:**
- Consumes: `SPRING` from `@/lib/motion`; `useWishlist` from `@/components/store/wishlist-context`; the ViewTransition wrappers added in Task 2.
- Produces: nothing for later tasks.

- [ ] **Step 1: Write the failing PDP check**

Append to `scripts/motion-check.mjs`, before `await browser.close();`:

```js
// ── PDP interactions ─────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForURL(/\/product\//);
  await page.waitForTimeout(900);

  // Selected size must be marked for assistive tech, not colour alone.
  const sizeBtn = page.locator("button[aria-pressed]").first();
  if ((await sizeBtn.count()) === 0) fail("size chips have no aria-pressed state");
  else pass("size chips expose aria-pressed");

  // Wishlist toggle must report its state.
  const heart = page.getByRole("button", { name: /wishlist/i });
  const pressedBefore = await heart.getAttribute("aria-pressed");
  await heart.click();
  await page.waitForTimeout(500);
  const pressedAfter = await heart.getAttribute("aria-pressed");
  if (pressedBefore === pressedAfter) fail("wishlist button aria-pressed does not change");
  else pass("wishlist button toggles aria-pressed");

  const cls = await measureCLS(page);
  if (cls > 0) fail(`PDP CLS ${cls.toFixed(4)}`);
  else pass("PDP CLS 0");

  await page.screenshot({ path: join(OUT, "desktop_pdp_interactions.png"), fullPage: true });
  await ctx.close();
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node scripts/motion-check.mjs
```
Expected: FAIL — `size chips have no aria-pressed state`.

- [ ] **Step 3: Add motion imports**

In `app/(store)/product/[slug]/ProductDetail.tsx`:

```tsx
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { SPRING } from "@/lib/motion";
```

- [ ] **Step 4: Animate the gallery swap**

Replace the thumbnail buttons so the active one is marked, and the main image cross-swaps:

```tsx
            {gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                aria-pressed={i === imgIdx}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "relative aspect-[1/1.1] overflow-hidden border bg-noir-panel",
                  i === imgIdx ? "border-gold" : "border-gold/20"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g}
                  alt=""
                  className="size-full object-cover contrast-[1.05] grayscale"
                />
                {i === imgIdx && (
                  <m.span
                    layoutId="pdp-thumb-active"
                    transition={SPRING.snappy}
                    className="pointer-events-none absolute inset-0 border-2 border-gold"
                  />
                )}
              </button>
            ))}
```

For the main image, keep the Task 2 `ViewTransition` wrapper and add a keyed crossfade inside it:

```tsx
            <ViewTransition name={`product-${product.slug}`} share="morph">
              <AnimatePresence initial={false} mode="popLayout">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <m.img
                  key={gallery[imgIdx]}
                  src={gallery[imgIdx]}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 size-full object-cover contrast-[1.04] grayscale-[0.15]"
                />
              </AnimatePresence>
            </ViewTransition>
```

- [ ] **Step 5: Add the sliding size pill**

Replace the size button block:

```tsx
            {sizes.map((s) => {
              const on = s === size;
              return (
                <m.button
                  key={s}
                  onClick={() => setSize(s)}
                  aria-pressed={on}
                  whileTap={{ scale: 0.94 }}
                  transition={SPRING.snappy}
                  className={cn(
                    "relative min-w-[52px] border py-3.5 font-mono text-xs font-semibold transition-colors duration-200",
                    on ? "border-gold text-noir-deep" : "border-gold/30 text-cream/70 hover:border-gold/60"
                  )}
                >
                  {on && (
                    <m.span
                      layoutId="size-pill"
                      transition={SPRING.snappy}
                      className="absolute inset-0 -z-10 bg-gold"
                    />
                  )}
                  {s}
                </m.button>
              );
            })}
```

- [ ] **Step 6: Morph the add-to-bag button label**

Replace the add-to-bag button:

```tsx
            <m.button
              onClick={addToBag}
              whileTap={{ scale: 0.97 }}
              transition={SPRING.snappy}
              className="flex-1 overflow-hidden bg-gold p-[17px] font-mono text-xs font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={added ? "added" : "idle"}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="block"
                >
                  {added ? "Added to bag ✓" : `Add to bag — ${size}`}
                </m.span>
              </AnimatePresence>
            </m.button>
```

- [ ] **Step 7: Add the wishlist heart pop and particles**

Replace the wishlist button:

```tsx
            <m.button
              onClick={() =>
                toggle({
                  slug: product.slug,
                  name: product.name,
                  price: product.price_inr,
                  image: product.image_url ?? "",
                  category: cat,
                })
              }
              aria-pressed={wished}
              aria-label="Toggle wishlist"
              whileTap={{ scale: 0.9 }}
              transition={SPRING.snappy}
              className={cn(
                "relative w-14 border text-lg transition-colors",
                wished ? "border-gold bg-gold/15 text-gold" : "border-gold/40 text-gold hover:bg-gold/10"
              )}
            >
              <m.span
                key={wished ? "on" : "off"}
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={SPRING.snappy}
                className="inline-block"
              >
                {wished ? "♥" : "♡"}
              </m.span>
              <AnimatePresence>
                {wished &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <m.span
                      key={i}
                      className="pointer-events-none absolute left-1/2 top-1/2 size-1 rounded-full bg-gold"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos((i / 6) * Math.PI * 2) * 26,
                        y: Math.sin((i / 6) * Math.PI * 2) * 26,
                        opacity: 0,
                        scale: 0.4,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                    />
                  ))}
              </AnimatePresence>
            </m.button>
```

- [ ] **Step 8: Verify**

```bash
npm run lint && npm run build
```
Expected: both clean.

```bash
node scripts/motion-check.mjs
```
Expected: "size chips expose aria-pressed", "wishlist button toggles aria-pressed", "PDP CLS 0" all pass.

Manual: click size chips — the gold fill slides between them rather than blinking. Click Add to bag — the label rolls to "Added to bag ✓" and the drawer opens. Click the heart — it pops and throws six gold particles.

- [ ] **Step 9: Commit**

```bash
git add "app/(store)/product/[slug]/ProductDetail.tsx" scripts/motion-check.mjs
git commit -m "feat: PDP gallery crossfade, sliding size pill, button morph, wishlist pop"
```

---

## Task 6: Hero

**Files:**
- Create: `components/store/HeroTitle.tsx`, `components/store/HeroImage.tsx`
- Modify: `app/(store)/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `DURATION`, `EASE` from `@/lib/motion`; `useReducedMotionPref`; `Reveal`.
- Produces:
  - `<HeroTitle />` — renders the `PANTHÈRE` wordmark with per-letter mask reveal. No props.
  - `<HeroImage src: string; alt: string />` — parallax hero image, transform-only.

- [ ] **Step 1: Write the failing hero check**

Append to `scripts/motion-check.mjs`, before `await browser.close();`:

```js
// ── Hero ─────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // The wordmark must still read as one accessible string.
  const h1 = await page.locator("h1").first().innerText();
  if (h1.replace(/\s/g, "") !== "PANTHÈRE")
    fail(`hero h1 reads "${h1}", expected PANTHÈRE`);
  else pass("hero h1 still reads PANTHÈRE");

  const letters = await page.locator("h1 span[data-letter]").count();
  if (letters !== 8) fail(`hero has ${letters} letter spans, expected 8`);
  else pass("hero letters are individually masked");

  const cls = await measureCLS(page);
  if (cls > 0) fail(`home CLS ${cls.toFixed(4)} after hero animation`);
  else pass("home CLS 0 after hero animation");

  await ctx.close();
}

// ── Reduced motion ───────────────────────────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll("h1, h2, a[href^='/product/']")].filter(
      (el) => parseFloat(getComputedStyle(el).opacity) < 0.99
    ).length
  );
  if (hidden > 0) fail(`${hidden} element(s) stuck below full opacity under reduced motion`);
  else pass("all content fully visible under reduced motion");

  await page.screenshot({ path: join(OUT, "desktop_home_reduced.png"), fullPage: true });
  await ctx.close();
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node scripts/motion-check.mjs
```
Expected: FAIL — `hero has 0 letter spans, expected 8`.

- [ ] **Step 3: Add the letter keyframe**

Append to `app/globals.css`:

```css
@keyframes ldn-letter-rise {
  from {
    transform: translateY(110%);
  }
  to {
    transform: translateY(0);
  }
}
```

- [ ] **Step 4: Create HeroTitle**

Create `components/store/HeroTitle.tsx`:

```tsx
"use client";

import { EASE } from "@/lib/motion";
import { useReducedMotionPref } from "@/components/motion/useReducedMotionPref";

const WORD = [..."PANTHÈRE"];

/**
 * Per-letter mask reveal. Runs once on mount. The h1 keeps its full text
 * content, so screen readers and the check harness read "PANTHÈRE", not
 * eight orphaned characters.
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
                    animation: `ldn-letter-rise 900ms ${EASE.out} ${60 * i}ms forwards`,
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
```

- [ ] **Step 5: Create HeroImage**

Create `components/store/HeroImage.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useRef } from "react";
import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";

/**
 * Parallax hero. Scroll progress drives `y` only — no scroll position is
 * held in React state and no layout property is animated.
 */
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <div ref={ref} className="absolute inset-0">
      <m.div style={{ y }} className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="animate-[ldn-kb_18s_ease-in-out_infinite_alternate] object-cover object-[58%_center] brightness-[0.62] contrast-[1.15] grayscale"
        />
      </m.div>
    </div>
  );
}
```

- [ ] **Step 6: Wire the hero into the home page**

In `app/(store)/page.tsx`, replace the `next/image` import with the new components:

```tsx
import { HeroImage } from "@/components/store/HeroImage";
import { HeroTitle } from "@/components/store/HeroTitle";
```

Remove `import Image from "next/image";`.

Replace the `<Image ... />` in the hero section with:

```tsx
        <HeroImage src={HERO} alt="AW26 campaign — panther in fog" />
```

Replace the `<h1>` with `<HeroTitle />`, and wrap the kicker and CTA in `Reveal`:

```tsx
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <Reveal delay={250}>
            <div className="mb-5 font-mono text-[11px] tracking-[0.36em] text-sand sm:text-[13px]">
              HEIR TO THE NIGHT
            </div>
          </Reveal>
          <HeroTitle />
          <Reveal delay={400}>
            <Link
              href="/shop"
              transitionTypes={["nav-forward"]}
              className="mt-8 inline-block bg-gold px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-burgundy-deep transition-colors hover:bg-cream"
            >
              Shop the collection →
            </Link>
          </Reveal>
        </div>
```

- [ ] **Step 7: Verify**

```bash
npm run lint && npm run build
```
Expected: both clean.

```bash
node scripts/motion-check.mjs
```
Expected: "hero h1 still reads PANTHÈRE", "hero letters are individually masked", "home CLS 0 after hero animation", "all content fully visible under reduced motion" all pass.

- [ ] **Step 8: Commit**

```bash
git add components/store/HeroTitle.tsx components/store/HeroImage.tsx \
  "app/(store)/page.tsx" app/globals.css scripts/motion-check.mjs
git commit -m "feat: hero letter reveal and scroll parallax"
```

---

## Task 7: Final verification

**Files:**
- Modify: none expected. Fix whatever the checks surface.
- Create: `docs/superpowers/plans/motion-bundle.txt`

**Interfaces:**
- Consumes: everything.
- Produces: evidence that the spec's §5 budget and §6 checklist hold.

- [ ] **Step 1: Full lint and build**

```bash
npm run lint && npm run build 2>&1 | tee docs/superpowers/plans/motion-bundle.txt
```
Expected: lint clean, "Compiled successfully".

- [ ] **Step 2: Check the bundle budget**

Compare First Load JS for `/`, `/shop`, `/product/[slug]`:

```bash
grep -E "^[├└│ ]*[○ƒ●] /(\s|$|shop|product)" docs/superpowers/plans/baseline-bundle.txt
grep -E "^[├└│ ]*[○ƒ●] /(\s|$|shop|product)" docs/superpowers/plans/motion-bundle.txt
```

Expected: each route grew by **≤ 20 kb**. If any route exceeds it, find the offender — most likely a full `motion/react` import that slipped past lint, or `AnimatePresence` pulled into a route that does not need it — and fix before continuing.

- [ ] **Step 3: Run the full check suite against a production build**

```bash
npm run build && npm run start
```
In another terminal:
```bash
BASE_URL=http://localhost:3000 node scripts/motion-check.mjs
```
Expected: exit 0, "all checks passed". Production build matters — the dev indicator and dev-only overlays can skew both CLS and screenshots.

- [ ] **Step 4: Review the screenshots**

Open every PNG in `.screens/` and compare against the Task 1 "before" set. Confirm: no clipped text, no element stuck mid-animation, no missing image, mobile at 390px shows no overflow, and the reduced-motion screenshot is a complete, fully-rendered page.

- [ ] **Step 5: Manual cross-browser pass**

Chromium: full flow — home → category → shop → card → PDP → add to bag → drawer → checkout link. Morphs and slides should be visible and never leave the header moving.

Safari (if available): the same flow must **work**. Transitions may not animate — that is acceptable and expected. What is not acceptable is a broken layout, a stuck overlay, or a dead link.

- [ ] **Step 6: Add .screens to gitignore if not already present**

```bash
grep -q "^.screens" .gitignore || printf "\n.screens/\n" >> .gitignore
```

- [ ] **Step 7: Commit the evidence**

```bash
git add docs/superpowers/plans/motion-bundle.txt .gitignore
git commit -m "chore: record post-motion bundle sizes and verification evidence"
```

---

## Notes for the implementer

- **The one risky spot is Task 4 Step 8.** Animating header padding violates the transform-only constraint; the step gives a transform-based approach and an explicit documented fallback. Do not silently animate padding — pick one and say which in the commit message.
- **Duplicate `viewTransitionName` is the failure mode most likely to bite.** If a morph stops working, first check whether two cards on the page are passing `morph`.
- **`ViewTransition` comes from `react`, not `next`.** Importing it from anywhere else will fail.
- If a step's code conflicts with what is actually in the file, the file wins — read it, adapt, and note the divergence in the commit message rather than forcing the plan's version.
