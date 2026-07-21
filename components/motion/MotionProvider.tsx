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
