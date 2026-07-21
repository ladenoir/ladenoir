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

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks passed");
