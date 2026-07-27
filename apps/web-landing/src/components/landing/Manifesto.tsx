"use client";

import { Reveal } from "./Reveal";

/*
  Light break — a deliberate tonal shift from the dark film to a bright,
  quiet statement. Keeps brand color to a single highlighted phrase.
*/
export function Manifesto() {
  return (
    <section className="relative bg-fg py-32 text-ink">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p className="mb-6 text-sm font-medium uppercase tracking-widest text-brand">
            Why we built PayEra
          </p>
          <p className="text-2xl font-semibold leading-snug tracking-tight sm:text-4xl">
            Digital money should feel as simple as{" "}
            <span className="text-brand">pointing your phone at a code</span> —
            and as final as handing someone the money directly. No middlemen you
            can’t see. No waiting to find out if it worked.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
