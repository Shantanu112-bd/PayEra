"use client";

import { Icon } from "@iconify/react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    icon: "ph:wallet-bold",
    title: "Connect your wallet",
    body: "Link a Stellar wallet like Freighter. Your keys stay with you — PayEra never holds them.",
  },
  {
    icon: "ph:qr-code-bold",
    title: "Scan & pay",
    body: "Point at any UPI QR. We quote the rate, you confirm, and the merchant is paid.",
  },
  {
    icon: "ph:star-four-bold",
    title: "Earn STAR",
    body: "Every payment mints STAR rewards to your wallet — on-chain and entirely yours.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand">
          How it works
        </p>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Three steps between you and a paid bill.
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 120}>
            <div className="glass group relative h-full overflow-hidden rounded-2xl p-7 transition-colors hover:border-hairline-strong">
              <span className="absolute right-6 top-6 text-6xl font-semibold text-white/5">
                {i + 1}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <Icon icon={s.icon} className="text-2xl" />
              </span>
              <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-fg-muted">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
