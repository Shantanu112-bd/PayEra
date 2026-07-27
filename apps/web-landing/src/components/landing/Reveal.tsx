"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
  Lightweight scroll reveal. Adds `.rise-in` when the element enters the
  viewport once. Pure IntersectionObserver — no animation library needed,
  and it self-disables under prefers-reduced-motion.
*/
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Comp = Tag as "div";
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      style={{
        opacity: shown ? undefined : 0,
        animationDelay: `${delay}ms`,
      }}
      data-revealed={shown ? "true" : "false"}
    >
      <div className={shown ? "rise-in" : ""} style={{ animationDelay: `${delay}ms` }}>
        {children}
      </div>
    </Comp>
  );
}
