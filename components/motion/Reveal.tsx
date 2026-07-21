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
      // Deliberate: this can only be known after mount (matchMedia is a
      // browser API), and setting it here — once, guarded by the early
      // return below — is the whole point of the effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(true);
      return;
    }

    // Above the fold at mount: show now, never observe. Deliberate for the
    // same reason — layout is only measurable once `el` exists post-mount.
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
