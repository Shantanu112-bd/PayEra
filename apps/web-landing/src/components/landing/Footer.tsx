"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

export function Footer() {
  return (
    <footer className="section-rule relative bg-surface-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            {/* Logo is on a white background — render a small cutout tile so it
                reads on dark without recoloring the artwork. */}
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image
                src="/payera-logo.png"
                alt="PayEra"
                width={28}
                height={28}
                className="object-contain"
              />
            </span>
            <span className="text-lg font-semibold tracking-tight">PayEra</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-fg-muted">
            Stablecoin payments that settle in seconds and reward every spend.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { label: "Launch App", href: "/wallet" },
            { label: "How it works", href: "#how" },
            { label: "Features", href: "#features" },
          ]}
        />
        <FooterCol
          title="Account"
          links={[
            { label: "Sign in", href: "/login" },
            { label: "Create account", href: "/signup" },
            { label: "Profile", href: "/profile" },
          ]}
        />
        <FooterCol
          title="Network"
          links={[
            { label: "Built on Stellar", href: "#stats" },
            { label: "STAR rewards", href: "#features" },
          ]}
        />
      </div>

      <div className="section-rule">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-fg-dim sm:flex-row">
          <p>© {2026} PayEra. Sandbox / testnet preview.</p>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="X" className="hover:text-fg">
              <Icon icon="ph:x-logo-bold" className="text-lg" />
            </a>
            <a href="#" aria-label="GitHub" className="hover:text-fg">
              <Icon icon="ph:github-logo-bold" className="text-lg" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-fg">{title}</h4>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
