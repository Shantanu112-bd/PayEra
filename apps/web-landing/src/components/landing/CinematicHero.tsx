"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useScrollProgress } from "@/lib/useScrollProgress";

/*
  Cinematic pinned hero.

  A tall (720vh) track holds a sticky, full-viewport stage. A paused GSAP
  timeline choreographs four "scenes"; we scrub it with the section's scroll
  progress (see useScrollProgress) — NOT native scroll-snap, so it stays
  smooth and interruptible. Letterbox bars and a screen-blend grade wash sell
  the film look. prefers-reduced-motion pins progress at 0 (first scene shown).
*/

const SCENES = [
  {
    kicker: "PayEra",
    title: ["Your stablecoins,", "spendable everywhere."],
    sub: "No conversions to think about. Just money that’s ready when you are.",
  },
  {
    kicker: "One scan",
    title: ["Scan any", "UPI code."],
    sub: "Point at the same QR you already use. PayEra does the rest.",
  },
  {
    kicker: "Instant",
    title: ["Settled on Stellar", "in seconds."],
    sub: "Finality you can feel — not a spinner you have to trust.",
  },
  {
    kicker: "Rewarding",
    title: ["And every payment", "earns STAR."],
    sub: "Loyalty that lives on-chain, yours to keep.",
    cta: true,
  },
];

export function CinematicHero() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const barTop = useRef<HTMLDivElement | null>(null);
  const barBottom = useRef<HTMLDivElement | null>(null);
  const wash = useRef<HTMLDivElement | null>(null);

  // Build the paused timeline once.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const scenes = gsap.utils.toArray<HTMLElement>(".hero-scene", stage);

    const t = gsap.timeline({ paused: true });

    // Letterbox bars slide in during the first beat, retract at the very end.
    t.fromTo(
      [barTop.current, barBottom.current],
      { height: "0vh" },
      { height: "9vh", duration: 0.6, ease: "power2.out" },
      0
    );

    scenes.forEach((scene, i) => {
      const at = i * 1; // one unit per scene
      const lines = scene.querySelectorAll(".hero-line");
      const meta = scene.querySelectorAll(".hero-meta");

      if (i === 0) {
        gsap.set(scene, { autoAlpha: 1 });
        gsap.set(lines, { yPercent: 0, autoAlpha: 1 });
        gsap.set(meta, { autoAlpha: 1, y: 0 });
      } else {
        gsap.set(scene, { autoAlpha: 0 });
        gsap.set(lines, { yPercent: 40, autoAlpha: 0 });
        gsap.set(meta, { autoAlpha: 0, y: 20 });
      }

      // Fade the previous scene out and this one in.
      const prev = scenes[i - 1];
      if (i > 0 && prev) {
        t.to(prev, { autoAlpha: 0, duration: 0.35 }, at - 0.25);
        t.to(scene, { autoAlpha: 1, duration: 0.35 }, at - 0.2);
        t.to(
          lines,
          { yPercent: 0, autoAlpha: 1, stagger: 0.06, duration: 0.4 },
          at - 0.15
        );
        t.to(meta, { autoAlpha: 1, y: 0, duration: 0.4 }, at - 0.05);
      }
    });

    // Retract letterbox on the final stretch.
    t.to(
      [barTop.current, barBottom.current],
      { height: "0vh", duration: 0.5, ease: "power2.inOut" },
      SCENES.length - 0.6
    );

    tl.current = t;
    return () => {
      t.kill();
    };
  }, []);

  // Scrub the timeline with scroll progress; drift the grade wash hue.
  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    t.progress(progress);
    if (wash.current) {
      // blue → indigo → violet across the scroll
      const hue = 222 + progress * 40; // 222 (blue) → ~262 (violet)
      wash.current.style.background = `radial-gradient(60% 50% at 50% 42%, hsla(${hue}, 90%, 60%, 0.28), transparent 70%)`;
    }
  }, [progress]);

  return (
    <section ref={ref} className="relative h-[720vh]">
      {/* Sticky stage */}
      <div
        ref={stageRef}
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
      >
        {/* Grade wash (screen blend over particles) */}
        <div ref={wash} className="grade-wash absolute inset-0" />

        {/* Letterbox bars */}
        <div ref={barTop} className="absolute inset-x-0 top-0 bg-ink" />
        <div ref={barBottom} className="absolute inset-x-0 bottom-0 bg-ink" />

        {/* Scenes */}
        <div className="relative mx-auto w-full max-w-4xl px-6 text-center">
          {SCENES.map((s, i) => (
            <div
              key={i}
              className="hero-scene absolute inset-0 flex flex-col items-center justify-center"
            >
              <span className="hero-meta mb-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-fg-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {s.kicker}
              </span>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
                {s.title.map((line, j) => (
                  <span key={j} className="block overflow-hidden">
                    <span
                      className={`hero-line inline-block ${
                        j === s.title.length - 1 ? "text-gradient" : ""
                      }`}
                    >
                      {line}
                    </span>
                  </span>
                ))}
              </h1>
              <p className="hero-meta mx-auto mt-6 max-w-xl text-base text-fg-muted sm:text-lg">
                {s.sub}
              </p>
              {s.cta && (
                <div className="hero-meta mt-9 flex flex-col items-center gap-3 sm:flex-row">
                  <Link
                    href="/wallet"
                    className="focus-ring group flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand/30 transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    Launch App
                    <Icon
                      icon="ph:arrow-right-bold"
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                  <a
                    href="#how"
                    className="rounded-full border border-hairline-strong px-7 py-3.5 text-base font-medium text-fg-muted transition-colors hover:text-fg"
                  >
                    See how it works
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-[11vh] left-1/2 -translate-x-1/2 text-fg-dim transition-opacity duration-500"
          style={{ opacity: progress > 0.05 ? 0 : 1 }}
        >
          <Icon icon="ph:mouse-simple" className="mx-auto text-2xl" />
          <span className="mt-1 block text-[11px] uppercase tracking-widest">
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}
