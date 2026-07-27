"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Reveal } from "./Reveal";

export function CTA() {
  return (
    <section className="section-rule relative mx-auto max-w-6xl px-6 py-32">
      <Reveal>
        <div className="glass-strong relative overflow-hidden rounded-[2rem] px-8 py-16 text-center sm:px-16 sm:py-24">
          {/* single restrained brand glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, #6366f1 0%, transparent 70%)",
            }}
          />
          <h2 className="relative text-3xl font-semibold tracking-tight sm:text-5xl">
            Ready when you are.
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-fg-muted">
            Launch the app, connect your wallet, and make your first payment in
            under a minute.
          </p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/wallet"
              className="focus-ring group flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-base font-semibold text-white shadow-xl shadow-brand/30 transition-transform hover:scale-[1.03] active:scale-95"
            >
              Launch App
              <Icon
                icon="ph:arrow-right-bold"
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-hairline-strong px-8 py-4 text-base font-medium text-fg-muted transition-colors hover:text-fg"
            >
              Create an account
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
