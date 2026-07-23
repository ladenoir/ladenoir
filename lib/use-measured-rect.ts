"use client";

import { useLayoutEffect, useState } from "react";

export type MeasuredRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Shared measurement hook behind SiteHeader.tsx's `useNavIndicatorRect` and
 * ProductDetail.tsx's `useThumbIndicatorRect` / `useSizePillRect`. All three
 * are "find the active element inside a container, read its untransformed
 * layout box (`offsetLeft`/`offsetTop`/`offsetWidth`/`offsetHeight` — immune
 * to ancestor CSS transforms, unlike `getBoundingClientRect`), and drive an
 * absolutely positioned indicator from it" — the only real differences
 * between the three call sites are which selector picks out the active
 * element and which of the four returned numbers each one actually uses
 * (nav: left+width; thumbnails: top+height; size pill: all four). Returning
 * the full rect and letting each caller destructure what it needs meant the
 * extraction stayed a plain shared hook rather than needing per-shape
 * variants or config flags.
 *
 * Re-measures:
 * - once synchronously in a layout effect before paint (so first render is
 *   never visibly wrong — no initial jump),
 * - whenever `selector` or an entry in `deps` changes (selection changes,
 *   item count changes),
 * - on any layout change to the *container*, via `ResizeObserver` — this is
 *   the general "content reflow, not just viewport resize" mechanism (a
 *   container whose content changed height/width fires it regardless of
 *   whether `window` ever dispatched "resize"),
 * - once more when `document.fonts.ready` resolves, as a belt-and-braces
 *   addition for the specific case a `ResizeObserver` on the container can
 *   miss: a late Google Fonts swap (this project loads webfonts) that
 *   changes sibling elements' glyph metrics without changing the
 *   *container's own* border-box size (e.g. a fixed-width flex item whose
 *   children's widths redistribute internally).
 */
export function useMeasuredRect(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string | null,
  deps: unknown[]
): MeasuredRect | null {
  const [rect, setRect] = useState<MeasuredRect | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !selector) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = container.querySelector<HTMLElement>(selector);
      // A hidden (display: none) match — e.g. SiteHeader's right-hand links
      // collapsing below `md` — reports 0 for both dimensions; treat that
      // the same as "no match in this container" so the indicator never
      // renders pointing at something that isn't actually visible.
      if (!el || (el.offsetWidth === 0 && el.offsetHeight === 0)) {
        setRect(null);
        return;
      }
      setRect({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(container);

    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (!cancelled) measure();
    });

    return () => {
      cancelled = true;
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, selector, ...deps]);

  return rect;
}
