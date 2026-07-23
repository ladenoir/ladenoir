// Motion verification harness.
//
// IMPORTANT — run this against a PRODUCTION server, not `next dev`:
//   npm run build && npm run start
//   node scripts/motion-check.mjs
//
// The morph assertion ("PDP claims a product-* morph name") is known to
// fail under `next dev` on otherwise-correct code. This is an environment
// quirk of the dev server (unminified/unoptimized dev bundles change the
// timing of when React's ViewTransition applies the live
// `view-transition-name` inline style relative to this script's polling),
// not a regression signal — a failure there does not mean the morph is
// broken, and a pass there does not mean it works in production. Only a
// run against `next start` is authoritative. See git history / task-3
// report for the original investigation.
//
// Env: BASE_URL (default http://localhost:3000)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", ".screens");
mkdirSync(OUT, { recursive: true });

// Next.js serves dev-mode static assets under a literal "development"
// build-id path (e.g. /_next/static/development/_buildManifest.js), which
// only ever appears in HTML served by `next dev`. That makes it a simple,
// reliable way to detect "this run is talking to a dev server" and repeat
// the warning above where it can't be missed, rather than relying on
// whoever runs this script to remember it.
console.warn(
  "\n[motion-check] This suite must be run against a PRODUCTION server " +
    "(`npm run build && npm run start`). The morph check is known to give " +
    "false results under `next dev`.\n"
);
try {
  const res = await fetch(BASE, { redirect: "manual" });
  const html = await res.text();
  if (html.includes("/_next/static/development/")) {
    console.warn(
      `[motion-check] WARNING: ${BASE} looks like a \`next dev\` server ` +
        `(found /_next/static/development/ in the HTML). Results — ` +
        `especially the morph check — are NOT trustworthy from this run. ` +
        `Re-run against \`npm run build && npm run start\`.\n`
    );
  }
} catch {
  // If BASE isn't reachable yet, the checks below will fail loudly on
  // their own; no need to double-report here.
}

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
  // Hover first so the fast path (prefetch={true} Link + cached PDP query,
  // see components/store/ProductCard.tsx and lib/queries.ts) has a chance
  // to warm the RSC payload before the click, the same way a real user
  // would dwell over a card before clicking it.
  const firstCard = page.locator("a[href^='/product/']").first();
  await firstCard.hover();
  await page.waitForTimeout(600);

  // React's <ViewTransition name> only assigns a live `view-transition-name`
  // inline style to the DOM node for the duration of the browser's active
  // transition (react-dom calls restoreViewTransitionName() once it
  // finishes), so with a fast, single-transition navigation that window can
  // be well under 100ms. Poll across the click instead of sampling once
  // after the transition has certainly settled, or the assertion below
  // would false-fail on a *working* morph just as readily as a broken one.
  let sawMorphName = false;
  const pollDeadline = Date.now() + 3000;
  const poll = (async () => {
    while (!sawMorphName && Date.now() < pollDeadline) {
      const seen = await page
        .evaluate(() =>
          [...document.querySelectorAll("[style*='view-transition-name']")].some((el) =>
            el.style.viewTransitionName.startsWith("product-")
          )
        )
        .catch(() => false); // page may be mid-navigation; ignore transient eval errors
      if (seen) sawMorphName = true;
      else await page.waitForTimeout(20);
    }
  })();

  await firstCard.click();
  await page.waitForURL(/\/product\//, { timeout: 5000 });
  await page.waitForTimeout(1000);
  await poll;

  if (!sawMorphName) fail("PDP has no product-* view-transition-name to morph into");
  else pass("PDP claims a product-* morph name");

  await page.screenshot({ path: join(OUT, "desktop_pdp.png"), fullPage: true });
  await ctx.close();
}

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

// ── Reduced motion disables the hover spring ────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const card = page.locator("a[href^='/product/']").first();
  const before = await card.evaluate((el) => getComputedStyle(el).transform);
  await card.hover();
  // Give the (should-be-suppressed) spring more time than it would ever
  // need to settle under normal motion, so this isn't just catching the
  // animation mid-flight.
  await page.waitForTimeout(600);
  const after = await card.evaluate((el) => getComputedStyle(el).transform);

  if (before !== after)
    fail(
      `product card transform changed under prefers-reduced-motion: reduce ` +
        `(before=${before}, after=${after}) — MotionConfig reducedMotion="user" is not wired up`
    );
  else pass("product card transform unchanged under prefers-reduced-motion: reduce");

  await ctx.close();
}

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

// ── Nav underline: positioned over the active link, moves on navigation ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // The active link ("Shop") sits in the left nav group; its indicator is a
  // sibling <span> (not layoutId-based — see SiteHeader.tsx's NavIndicator)
  // absolutely positioned inside the same <nav>.
  const shopLink = page.locator('nav a[href="/shop"]');
  const shopBox = await shopLink.boundingBox();
  const indicator = page.locator('nav a[href="/shop"] ~ span.bg-gold').first();

  const onShop = await indicator.boundingBox();
  if (!shopBox || !onShop) {
    fail("nav underline not found on /shop");
  } else if (Math.abs(onShop.x - shopBox.x) > 4) {
    fail(
      `nav underline not aligned with active "/shop" link ` +
        `(link x=${shopBox.x.toFixed(1)}, indicator x=${onShop.x.toFixed(1)})`
    );
  } else {
    pass("nav underline is positioned over the active link on /shop");
  }

  await page.getByRole("link", { name: /^maison$/i }).first().click();
  await page.waitForURL(/\/maison/, { timeout: 5000 });
  await page.waitForTimeout(500);

  const maisonLink = page.locator('nav a[href="/maison"]');
  const maisonBox = await maisonLink.boundingBox();
  const indicatorAfter = page
    .locator('nav a[href="/maison"] ~ span.bg-gold')
    .first();
  const onMaison = await indicatorAfter.boundingBox();

  if (!maisonBox || !onMaison) {
    fail("nav underline not found on /maison after navigation");
  } else if (Math.abs(onMaison.x - maisonBox.x) > 4) {
    fail(
      `nav underline did not move to "/maison" ` +
        `(link x=${maisonBox.x.toFixed(1)}, indicator x=${onMaison.x.toFixed(1)})`
    );
  } else if (onShop && Math.abs(onMaison.x - onShop.x) < 4) {
    fail("nav underline did not move between routes");
  } else {
    pass("nav underline moves to the active link after navigating to /maison");
  }

  await ctx.close();
}

// ── Reduced motion: cart drawer opens without fading ─────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.locator("a[href^='/product/']").first().hover();
  await page.getByRole("button", { name: /quick add/i }).first().click();

  // Sample opacity almost immediately (well inside the ~210ms enter /
  // ~450ms stagger window that would still be mid-fade under full motion)
  // and again once everything would have long settled either way. Under
  // reduced motion both samples must already read the final opacity.
  await page.waitForTimeout(40);
  const early = await page.evaluate(() => {
    const backdrop = document.querySelector("[role='dialog']")?.previousElementSibling;
    const item = document.querySelector("[role='dialog'] .mb-4");
    return {
      backdropOpacity: backdrop ? getComputedStyle(backdrop).opacity : null,
      itemOpacity: item ? getComputedStyle(item).opacity : null,
    };
  });

  await page.waitForTimeout(700);
  const drawer = page.getByRole("dialog", { name: /your bag/i });
  const opensUnderReducedMotion = await drawer.isVisible();
  const late = await page.evaluate(() => {
    const backdrop = document.querySelector("[role='dialog']")?.previousElementSibling;
    const item = document.querySelector("[role='dialog'] .mb-4");
    return {
      backdropOpacity: backdrop ? getComputedStyle(backdrop).opacity : null,
      itemOpacity: item ? getComputedStyle(item).opacity : null,
    };
  });

  if (!opensUnderReducedMotion) {
    fail("cart drawer did not open under prefers-reduced-motion: reduce");
  } else {
    pass("cart drawer still opens under prefers-reduced-motion: reduce");
  }

  // Backdrop's animate target is opacity: 0.6; an item's is opacity: 1.
  // "Essentially immediately" = the early sample already matches the late
  // (fully-settled) sample, rather than reading close to the initial 0.
  const closeEnough = (a, b) => a !== null && b !== null && Math.abs(a - b) < 0.02;

  if (!closeEnough(early.backdropOpacity, late.backdropOpacity)) {
    fail(
      `cart drawer backdrop still fading under reduced motion ` +
        `(opacity at 40ms=${early.backdropOpacity}, settled=${late.backdropOpacity})`
    );
  } else {
    pass("cart drawer backdrop reaches final opacity immediately under reduced motion");
  }

  if (!closeEnough(early.itemOpacity, late.itemOpacity)) {
    fail(
      `cart drawer item still fading/staggering under reduced motion ` +
        `(opacity at 40ms=${early.itemOpacity}, settled=${late.itemOpacity})`
    );
  } else {
    pass("cart drawer item reaches final opacity immediately under reduced motion (no stagger)");
  }

  await ctx.close();
}

// ── PDP interactions ─────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForURL(/\/product\//);
  await page.waitForTimeout(900);

  // Selected size must be marked for assistive tech, not colour alone.
  // Scoped to `button[data-size]` (the size chips — see ProductDetail.tsx)
  // rather than `button[aria-pressed]` generally: the gallery thumbnails
  // also carry aria-pressed and sit earlier in DOM order, so a plain
  // `.first()` over "any button with aria-pressed" would silently match a
  // thumbnail and pass even if the size chips themselves had no
  // aria-pressed at all. Comparing the count of size chips to the count of
  // size chips that also carry aria-pressed catches that: every chip must
  // have it, not just whichever button happens to come first in the DOM.
  const sizeChipCount = await page.locator("button[data-size]").count();
  const sizeChipsWithAriaPressed = await page
    .locator("button[data-size][aria-pressed]")
    .count();
  if (sizeChipCount === 0 || sizeChipsWithAriaPressed !== sizeChipCount)
    fail(
      `size chips have no aria-pressed state (${sizeChipsWithAriaPressed}/${sizeChipCount} chips carry it)`
    );
  else pass("size chips expose aria-pressed");

  // Wishlist toggle must report its state. This one is scoped by accessible
  // name (aria-label="Toggle wishlist" is unique on the page — the gallery
  // thumbnails' aria-labels are "View image N"), not by DOM position, and it
  // asserts the value actually flips rather than merely existing — so it
  // doesn't share the size-chip locator's "first matching button, whatever
  // that happens to be" problem: getByRole would only start matching the
  // wrong button if some other button's accessible name also contained
  // "wishlist", which is not the case here.
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

// ── Size pill indicator follows non-viewport reflow ──────────────────────
// useSizePillRect (and its siblings useNavIndicatorRect / useThumbIndicatorRect)
// must re-measure on any layout change to the element they track, not just on
// a `window` "resize" event — the realistic case that misses is a late
// web-font swap, which changes glyph metrics without ever firing `resize`.
// This forces a deterministic, non-resize layout change (narrowing the size
// row so the active chip wraps onto a second line) and confirms the pill
// follows it without a `resize` event ever being dispatched, proving the
// underlying mechanism (ResizeObserver on the container) is what caught it —
// not the old resize listener, which this test never triggers.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForURL(/\/product\//);
  await page.waitForTimeout(900);

  // The size row is the only `div` on the PDP with a direct `button[data-size]`
  // child; the pill indicator is the sole `span.bg-gold` inside it.
  const sizeRow = page.locator("div:has(> button[data-size])");
  const chips = page.locator("button[data-size]");
  const chipCount = await chips.count();
  if (chipCount < 2) {
    fail("PDP needs at least 2 size chips to exercise the reflow assertion");
  } else {
    // Select the LAST chip so narrowing the row is guaranteed to move it
    // onto a new wrapped row (rather than possibly staying put on row 1).
    const lastChip = chips.nth(chipCount - 1);
    await lastChip.click();
    await page.waitForTimeout(400); // let the initial (correct) slide settle

    const indicator = sizeRow.locator("span.bg-gold").first();
    const rowBefore = await sizeRow.boundingBox();
    const chipBeforeBox = await lastChip.boundingBox();

    // Mutate the row's own layout box directly — no window resize event
    // involved — forcing the chips to wrap. This is the "content reflow
    // that isn't a viewport resize" the finding describes; a late web-font
    // swap is the realistic real-world trigger, but this is a deterministic
    // stand-in for CI.
    await sizeRow.evaluate((el) => {
      el.style.maxWidth = "150px";
    });
    await page.waitForTimeout(400); // ResizeObserver callback + re-render

    const rowAfter = await sizeRow.boundingBox();
    const after = await indicator.boundingBox();
    const chipBox = await lastChip.boundingBox();

    if (!rowBefore || !chipBeforeBox || !rowAfter || !after || !chipBox) {
      fail("could not measure size pill indicator for reflow assertion");
    } else if (rowAfter.height <= rowBefore.height + 4) {
      fail(
        `size row did not actually wrap onto a new line (height before=${rowBefore.height.toFixed(1)}, after=${rowAfter.height.toFixed(1)}) — reflow assertion is not exercising anything`
      );
    } else {
      // Compare positions RELATIVE to the row container, not raw viewport
      // coordinates: the info column is `flex flex-col justify-center`, so
      // the row wrapping onto a second line changes the row's *own* height,
      // which re-centers the whole column and shifts the container's
      // viewport position too. That ancestor shift would move the
      // indicator's viewport coordinates right along with it even if the
      // indicator's own transform never re-measured — a false "it moved"
      // signal that has nothing to do with whether our fix works. Container-
      // relative coordinates cancel that out and isolate what we actually
      // care about: does the indicator's offset *within its own container*
      // track the active chip's offset within that same container.
      const chipRel = {
        x: chipBox.x - rowAfter.x,
        y: chipBox.y - rowAfter.y,
      };
      const indicatorRel = {
        x: after.x - rowAfter.x,
        y: after.y - rowAfter.y,
      };
      const aligned =
        Math.abs(indicatorRel.x - chipRel.x) <= 4 &&
        Math.abs(indicatorRel.y - chipRel.y) <= 4;
      if (!aligned) {
        fail(
          `size pill indicator did not follow non-viewport reflow (row wrapped onto a new line, no window resize event fired, but indicator's position relative to its container is ${JSON.stringify(indicatorRel)} while the active chip's is ${JSON.stringify(chipRel)})`
        );
      } else {
        pass(
          "size pill indicator follows non-viewport reflow (wrap forced without a resize event) and stays aligned with the active chip"
        );
      }
    }

    // Undo the mutation so it can't affect any later assertion order changes.
    await sizeRow.evaluate((el) => {
      el.style.maxWidth = "";
    });
  }

  await ctx.close();
}

// ── Reduced motion: PDP surfaces are fully static ────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForURL(/\/product\//);
  await page.waitForTimeout(900);

  // Add-to-bag label morph must not fade in/out under reduced motion. (The
  // seed catalogue has no product with >1 gallery image, so the gallery
  // crossfade itself can never be exercised end-to-end here — this exercises
  // the same opacity-gated AnimatePresence swap pattern on a surface that's
  // always present regardless of product data.)
  // Located structurally (not by its text, which changes on click) so the
  // locator keeps resolving after the label swaps to "Added to bag ✓".
  const addBtn = page.locator("main button.flex-1");
  await addBtn.click();
  await page.waitForTimeout(30);
  const early = await addBtn
    .locator("span")
    .first()
    .evaluate((el) => getComputedStyle(el).opacity);
  await page.waitForTimeout(400);
  const late = await addBtn
    .locator("span")
    .first()
    .evaluate((el) => getComputedStyle(el).opacity);
  if (Math.abs(Number(early) - Number(late)) > 0.02) {
    fail(
      `PDP add-to-bag label still fading under prefers-reduced-motion: reduce ` +
        `(opacity at 30ms=${early}, settled=${late})`
    );
  } else {
    pass("PDP add-to-bag label reaches final opacity immediately under reduced motion");
  }

  // Adding to bag opens the cart drawer, which overlays the wishlist button
  // below — close it first so the next click isn't intercepted.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // Wishlist particle burst must not render at all under reduced motion.
  const heart = page.getByRole("button", { name: /wishlist/i });
  await heart.click();
  await page.waitForTimeout(300);
  const particleCount = await page.locator(".wishlist-particle").count();
  if (particleCount > 0) {
    fail(`wishlist particle burst rendered ${particleCount} particles under reduced motion`);
  } else {
    pass("wishlist particle burst does not render under reduced motion");
  }

  await ctx.close();
}

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

// ── Reduced motion: hero letter-rise animation does not run ─────────────
// The opacity sweep above cannot catch this: the letter reveal animates
// `transform`, not `opacity`, so a hero with its reduced-motion gate
// completely removed would still pass that check. Read the CSS
// `animation-name` directly off a letter span instead — under
// `reducedMotion: "reduce"`, HeroTitle must render the span with no inline
// `animation` at all, so the computed animation-name is the CSS default
// "none". If the gate is missing, the inline `ldn-letter-rise ...` animation
// is present regardless of the OS/browser preference and this reads back
// "ldn-letter-rise" instead.
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const animationName = await page
    .locator("h1 span[data-letter] span")
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);

  if (animationName !== "none")
    fail(
      `hero letter animation-name is "${animationName}" under prefers-reduced-motion: reduce, ` +
        `expected "none" (HeroTitle's reduced-motion gate is not suppressing the CSS animation)`
    );
  else
    pass(
      "hero letter animation is suppressed (animation-name: none) under prefers-reduced-motion: reduce"
    );

  await ctx.close();
}

// ── Reduced motion: hero parallax transform does not move on scroll ─────
// The opacity sweep above also cannot catch this: the parallax animates
// `transform` via a MotionValue outside any `animate` prop, and the sweep
// never scrolls. Read the computed `transform` on the hero image's parallax
// wrapper (`[data-hero-image-wrapper]`, the `m.div` HeroImage drives with
// `y` — see components/store/HeroImage.tsx), scroll the page, and read it
// again. Under `reducedMotion: "reduce"` the two reads must be identical;
// if HeroImage's `shouldReduceMotion` gate were removed, scrolling would
// change scrollYProgress and therefore `y`, and this would catch that.
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const wrapper = page.locator("[data-hero-image-wrapper]");
  const before = await wrapper.evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(500);
  const after = await wrapper.evaluate((el) => getComputedStyle(el).transform);

  if (before !== after)
    fail(
      `hero parallax transform changed under prefers-reduced-motion: reduce ` +
        `(before=${before}, after=${after}) — HeroImage's reduced-motion gate is not suppressing the scroll-driven transform`
    );
  else pass("hero parallax transform unchanged after scrolling under prefers-reduced-motion: reduce");

  await ctx.close();
}

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks passed");
