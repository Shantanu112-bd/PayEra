"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, QrCode, History, Gift, User, LogOut, Cpu, ShieldAlert, ShieldCheck, Building2, Code } from "lucide-react";
import { cn } from "@cryptopay/ui";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";

const consumerNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Scan & Pay", href: "/pay", icon: QrCode },
  { name: "History", href: "/history", icon: History },
  { name: "Rewards", href: "/rewards", icon: Gift },
  { name: "Blockchain", href: "/contracts", icon: Cpu },
  { name: "Profile", href: "/profile", icon: User },
];

const merchantNavItems = [
  { name: "Overview", href: "/merchant", icon: LayoutDashboard },
  { name: "Transactions", href: "/merchant/transactions", icon: History },
  { name: "Settlements", href: "/merchant/settlements", icon: Building2 },
  { name: "Campaigns", href: "/merchant/campaigns", icon: Gift },
  { name: "Analytics", href: "/merchant/analytics", icon: Wallet },
  { name: "QR Codes", href: "/merchant/qr-codes", icon: QrCode },
  { name: "Developers", href: "/merchant/developers/webhooks", icon: Code },
  { name: "Settings", href: "/merchant/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const isMerchant = pathname.startsWith("/merchant");
  const navItems = isMerchant ? merchantNavItems : consumerNavItems;

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-surface border-r-[1.5px] border-ink h-screen sticky top-0">
      <div className="p-6">
        <Link href={isMerchant ? "/merchant" : "/"} className="flex items-center gap-2">
          <div className="h-8 w-8 border-[1.5px] border-ink rounded-[12px] flex items-center justify-center bg-lime">
            <span className="text-ink font-bold text-lg font-[family-name:var(--font-ibm-plex-mono)]">⟠</span>
          </div>
          <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">
            CryptoPay
          </span>
          {isMerchant && <span className="text-xs text-muted font-[family-name:var(--font-ibm-plex-mono)]">Business</span>}
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/merchant" ? pathname === "/merchant" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-200 text-[15px]",
                isActive 
                  ? "bg-ink text-white font-semibold" 
                  : "text-ink/70 hover:bg-ink/5 hover:text-ink"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* KYC Status Badge */}
      <div className="p-4 mx-4 mb-4 rounded-xl border border-ink/10 bg-surface">
        <KYCStatusBadge />
      </div>

      <div className="p-4 border-t-[1.5px] border-ink mt-auto">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] w-full text-ink/50 hover:bg-ink/5 hover:text-ink transition-colors">
          <LogOut className="h-5 w-5" />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
}

function KYCStatusBadge() {
  const { data: user } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: () => cryptoPaySdk.auth.getCurrentUser()
  });

  const kycStatus = user?.kycStatus || "NOT_STARTED";

  if (kycStatus === "VERIFIED" || kycStatus === "APPROVED") {
    return (
      <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
        <ShieldCheck className="w-4 h-4" /> KYC Verified
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium">
        <ShieldAlert className="w-4 h-4" /> KYC Required
      </div>
      <Link href="/profile" className="block text-xs underline text-ink">
        Complete now to unlock limits
      </Link>
    </div>
  );
}
