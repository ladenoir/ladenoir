"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * True when the user asked for reduced motion. Starts false so server and
 * first client render agree; useSyncExternalStore corrects it on mount and
 * keeps it in sync with the media query without a setState-in-effect.
 */
export function useReducedMotionPref(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
