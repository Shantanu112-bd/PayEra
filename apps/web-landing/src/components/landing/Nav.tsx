"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#stats", label: "Network" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5">
        <div
          className={`flex w-full items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 ${
            scrolled ? "glass-strong shadow-lg shadow-black/30" : "bg-transparent"
          }`}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2">
              <Icon icon="ph:lightning-fill" className="text-lg text-white" />
            </span>
            <span className="text-lg font-semibold tracking-tight">PayEra</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-fg-muted transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm text-fg-muted transition-colors hover:text-fg sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/wallet"
              className="focus-ring rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:scale-[1.03] active:scale-95"
            >
              Launch App
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              className="focus-ring ml-1 flex h-9 w-9 items-center justify-center rounded-full text-fg-muted md:hidden"
              aria-label="Menu"
            >
              <Icon icon={open ? "ph:x" : "ph:list"} className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl px-5 md:hidden">
          <div className="glass-strong flex flex-col gap-1 rounded-2xl p-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-fg-muted hover:bg-white/5 hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
