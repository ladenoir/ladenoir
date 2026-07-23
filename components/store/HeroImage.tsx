"use client";

import Image from "next/image";
import { useRef } from "react";
import { useScroll, useTransform, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

/**
 * Parallax hero. Scroll progress drives `y` only — no scroll position is
 * held in React state and no layout property is animated, so this can
 * never contribute CLS.
 *
 * `y` is a MotionValue computed straight from `useScroll`/`useTransform`,
 * not passed through an `m.*` component's `animate` prop, so
 * MotionProvider's `MotionConfig reducedMotion="user"` never sees it and
 * cannot auto-disable it the way it does for whileHover/whileTap elsewhere
 * in this codebase (see ProductCard.tsx, ProductDetail.tsx). It keeps
 * updating on every scroll frame regardless of the user's OS preference
 * unless gated explicitly, so `shouldReduceMotion` swaps it for the
 * constant `0` — fully static, no scroll-driven transform ever reaches the
 * DOM under prefers-reduced-motion: reduce.
 */
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <div ref={ref} className="absolute inset-0">
      <m.div
        data-hero-image-wrapper
        style={{ y: shouldReduceMotion ? 0 : y }}
        className="absolute inset-0"
      >
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
