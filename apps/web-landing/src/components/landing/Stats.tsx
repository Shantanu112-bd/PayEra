"use client";

import { Reveal } from "./Reveal";

const STATS = [
  { value: "~5s", label: "Median settlement on Stellar" },
  { value: "170+", label: "Countries reachable via partners" },
  { value: "USDC", label: "Stable value, on-chain" },
  { value: "STAR", label: "Rewards minted to your wallet" },
];

export function Stats() {
  return (
    <section id="stats" className="section-rule relative mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Small footprint. Global reach.
        </h2>
        <p className="mt-4 max-w-xl text-fg-muted">
          PayEra rides on open rails — the same network that settles value for
          anyone, anywhere, without asking permission.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 90}>
            <div className="bg-surface-0 p-8">
              <div className="text-4xl font-semibold tracking-tight text-gradient">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-fg-muted">{s.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
