"use client";

import { Icon } from "@iconify/react";
import { Reveal } from "./Reveal";

const FEATURES = [
  {
    icon: "ph:qr-code-bold",
    title: "Any UPI QR",
    body: "Works with the codes merchants already display. Nothing new for them to install.",
  },
  {
    icon: "ph:lightning-fill",
    title: "Seconds to settle",
    body: "Payments finalize on Stellar in moments — no waiting on batch windows.",
  },
  {
    icon: "ph:star-four-bold",
    title: "STAR rewards",
    body: "Loyalty minted straight to your wallet on every spend, tracked transparently.",
  },
  {
    icon: "ph:shield-check-bold",
    title: "Self-custody",
    body: "You sign with your own wallet. Keys never leave your device.",
  },
  {
    icon: "ph:globe-hemisphere-west-bold",
    title: "Withdraw worldwide",
    body: "Move value out through licensed partners across 170+ countries.",
  },
  {
    icon: "ph:eye-bold",
    title: "Transparent fees",
    body: "Every quote shows the rate and fee up front — before you confirm.",
  },
];

export function Features() {
  return (
    <section id="features" className="section-rule relative mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand">
          Built for real spending
        </p>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Everything you need. Nothing you don’t.
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 90}>
            <div className="group h-full bg-surface-0 p-8 transition-colors hover:bg-surface-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-brand-glow transition-colors group-hover:bg-brand/15 group-hover:text-brand">
                <Icon icon={f.icon} className="text-xl" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {f.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
