"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/wallet", icon: "account_balance_wallet", label: "Wallet" },
  { href: "/pay", icon: "qr_code_scanner", label: "Scan" },
  { href: "/rewards", icon: "redeem", label: "Rewards" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface border-t border-outline-variant shadow-sm rounded-t-xl">
      {NAV.map(({ href, icon, label }) => {
        const active = path === href || (href !== "/dashboard" && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-150 active:scale-90 ${
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[24px]" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
              {icon}
            </span>
            <span className="text-[11px] font-medium leading-4">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
