"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useWallet } from "./WalletProvider";
import { useAuth } from "@/lib/store";
import { shortAddr } from "@/lib/format";

/*
  App chrome for the working screens. Deliberately calm and utilitarian —
  none of the cinematic scroll from the landing. A top bar on desktop and a
  bottom tab bar on mobile.
*/

const TABS = [
  { href: "/wallet", label: "Wallet", icon: "ph:wallet" },
  { href: "/pay", label: "Pay", icon: "ph:qr-code" },
  { href: "/rewards", label: "Rewards", icon: "ph:star-four" },
  { href: "/activity", label: "Activity", icon: "ph:list-bullets" },
  { href: "/profile", label: "Profile", icon: "ph:user" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey, disconnect } = useWallet();
  const displayName = useAuth((s) => s.currentUserDisplayName);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const onSignOut = () => {
    disconnect();
    router.replace("/login");
  };

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass-strong">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/wallet" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2">
              <Icon icon="ph:lightning-fill" className="text-sm text-white" />
            </span>
            <span className="font-semibold tracking-tight">PayEra</span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden items-center gap-1 sm:flex">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  isActive(t.href)
                    ? "bg-brand/15 text-brand"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                <Icon icon={t.icon} className="text-base" />
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-fg-muted md:block">
              {publicKey ? shortAddr(publicKey) : displayName || ""}
            </span>
            <button
              onClick={onSignOut}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:text-fg"
              aria-label="Sign out"
              title="Sign out"
            >
              <Icon icon="ph:sign-out" className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 glass-strong sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] transition-colors ${
                isActive(t.href) ? "text-brand" : "text-fg-muted"
              }`}
            >
              <Icon icon={t.icon} className="text-xl" />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
