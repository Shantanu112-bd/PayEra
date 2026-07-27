"use client";

import { useEffect, useRef, useState } from "react";

/*
  Scroll-progress hook for the cinematic hero.

  Returns a ref to attach to a TALL (e.g. 700vh) section and a `progress`
  value in [0,1] describing how far the viewport has travelled through that
  section while its inner stage is sticky. This is the "JS progress render
  loop" — no native scroll-snap, no ScrollTrigger pinning quirks.

  Updates are rAF-throttled so we never do layout work more than once a frame.
*/
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const compute = () => {
      raf.current = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Distance scrolled past the top of the section, over the scrollable span.
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;
      setProgress(reduce ? 0 : Math.min(Math.max(p, 0), 1));
    };

    const onScroll = () => {
      if (raf.current == null) raf.current = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return { ref, progress };
}
