"use client";

import { useState } from "react";
import { useScroll, useMotionValueEvent, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { SPRING } from "@/lib/motion";

const DEFAULT_ITEMS = [
  "★ New drop live",
  "Maison du Panthère",
  "Free shipping ₹10,000+",
];

export function Marquee({
  items = DEFAULT_ITEMS,
  className = "",
}: {
  items?: string[];
  className?: string;
}) {
  // duplicate the sequence so the -50% translate loops seamlessly
  const loop = [...items, ...items, ...items];

  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  // Same hysteresis band as the header condense, so both settle together.
  useMotionValueEvent(scrollY, "change", (y) => {
    setHidden((prev) => (prev ? y > 40 : y > 80));
  });

  // Scroll-driven hide is a decorative flourish, not information — see
  // components/store/ProductCard.tsx and SiteHeader.tsx for the identical
  // rationale. Under reduced motion the marquee stays fully static
  // (always visible) instead of instantly snapping offscreen as the user
  // scrolls past the threshold.
  const isHidden = !shouldReduceMotion && hidden;

  return (
    <m.div
      className={`overflow-hidden bg-gold py-2.5 text-noir-deep ${className}`}
      style={{ viewTransitionName: "site-marquee" }}
      animate={{ y: isHidden ? "-100%" : "0%" }}
      transition={SPRING.soft}
    >
      <div className="flex w-max animate-[ldn-marquee_22s_linear_infinite] font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
        <span className="flex gap-[34px] whitespace-nowrap pr-[34px]">
          {loop.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </span>
      </div>
    </m.div>
  );
}
