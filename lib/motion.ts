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
