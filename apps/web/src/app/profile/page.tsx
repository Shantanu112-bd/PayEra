"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useAppStore } from "../../lib/store";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import { TopBar } from "../../components/layout/TopBar";

function shortKey(key: string | null) {
  if (!key) return "Not connected";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

const SETTINGS_LINKS = [
  { icon: "account_balance_wallet", label: "Manage Wallets", href: "/wallet/manage" },
  { icon: "group_add", label: "Referrals", href: "/rewards/referrals" },
  { icon: "receipt_long", label: "Transaction History", href: "/history" },
  { icon: "shield", label: "Trust & Security", href: "/profile/trust" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { clearTokens } = useAppStore();
  const { publicKey, disconnect } = useStellarWallet();

  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: () => cryptoPaySdk.auth.getCurrentUser(),
  });

  const isVerified = user?.kycStatus === "VERIFIED" || user?.kycStatus === "APPROVED";

  const handleLogout = () => {
    cryptoPaySdk.auth.logout();
    disconnect();
    clearTokens();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar title="Profile" />

      <div className="px-[20px] space-y-5 pt-1">
        {/* Identity card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-primary text-[26px] font-bold shrink-0">
            {(user?.displayName || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse bg-surface-container-high rounded-[8px]" />
                <div className="h-4 w-40 animate-pulse bg-surface-container-high rounded-[8px]" />
              </div>
            ) : (
              <>
                <p className="text-[18px] font-bold text-on-background truncate">{user?.displayName || "PayEra User"}</p>
                <p className="text-[13px] text-on-surface-variant truncate">{user?.email || user?.phoneE164 || "—"}</p>
              </>
            )}
          </div>
        </div>

        {/* KYC status */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isVerified ? "bg-secondary-container" : "bg-error-container"}`}>
            <span className={`material-symbols-outlined text-[22px] ${isVerified ? "text-primary" : "text-error"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {isVerified ? "verified_user" : "gpp_maybe"}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-on-background">
              {isVerified ? "Identity Verified" : "Verification Required"}
            </p>
            <p className="text-[12px] text-on-surface-variant">
              {isVerified ? "Your KYC is complete" : "Complete KYC to unlock all features"}
            </p>
          </div>
          {!isVerified && (
            <Link href="/kyc" className="bg-primary text-on-primary text-[13px] font-semibold px-4 py-2 rounded-full shrink-0">
              Verify
            </Link>
          )}
        </div>

        {/* Connected wallet */}
        <div>
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Connected Wallet</p>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-on-background">Freighter</p>
              <p className="text-[12px] font-mono text-on-surface-variant">{shortKey(publicKey)}</p>
            </div>
            {publicKey && (
              <button onClick={disconnect} className="text-[13px] font-semibold text-error px-3 py-1.5 rounded-full active:bg-error-container transition-colors">
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Settings links */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] overflow-hidden divide-y divide-outline-variant">
          {SETTINGS_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 px-5 py-4 active:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-primary text-[22px]">{l.icon}</span>
              <span className="flex-1 text-[14px] font-medium text-on-background">{l.label}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-full bg-error-container text-error font-semibold active:scale-[0.98] transition-transform"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
