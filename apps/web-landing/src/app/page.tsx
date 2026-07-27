"use client";

import dynamic from "next/dynamic";
import { Nav } from "@/components/landing/Nav";
import { CinematicHero } from "@/components/landing/CinematicHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Manifesto } from "@/components/landing/Manifesto";
import { Stats } from "@/components/landing/Stats";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

// Three.js touches window/WebGL — load it client-only.
const ParticleField = dynamic(
  () => import("@/components/landing/ParticleField"),
  { ssr: false }
);

export default function LandingPage() {
  return (
    <main className="relative">
      <ParticleField />
      <Nav />
      <CinematicHero />
      {/* Sections sit on the opaque ink surface so particles read only behind the hero. */}
      <div className="relative z-10 bg-ink">
        <HowItWorks />
        <Features />
        <Manifesto />
        <Stats />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
