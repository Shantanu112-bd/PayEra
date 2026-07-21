"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStellarWallet } from "../components/providers/StellarWalletProvider";
import { useAppStore } from "../lib/store";

const VALUE_PROPS = [
  { icon: "bolt", title: "Instant Payments", desc: "Settle in seconds on Stellar" },
  { icon: "star", title: "STAR Rewards", desc: "Earn tokens on every payment" },
  { icon: "verified_user", title: "Secure KYC", desc: "Verified identity, trusted network" },
];

export default function Home() {
  const router = useRouter();
  const { connect, isConnecting, isWalletInstalled } = useStellarWallet();
  const accessToken = useAppStore((s) => s.accessToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) router.replace("/dashboard");
  }, [accessToken, router]);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect();
    } catch (e: any) {
      setError(e?.message || "Failed to connect wallet");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-[20px] py-12">
      {/* Logo + tagline */}
      <div className="flex flex-col items-center gap-[16px] pt-8">
        <div className="h-16 w-16 rounded-[24px] bg-primary flex items-center justify-center shadow-sm">
          <span className="text-on-primary text-3xl font-bold">P</span>
        </div>
        <h1 className="text-[26px] font-bold text-on-background tracking-tight">PayEra</h1>
        <p className="text-on-surface-variant text-center text-base">
          Pay with Crypto. Earn STAR Rewards.
        </p>
      </div>

      {/* Hero card */}
      <div className="w-full rounded-[24px] p-6 flex flex-col gap-[16px] bg-primary-container shadow-sm">
        <h2 className="text-on-primary-container text-lg font-semibold">Why PayEra?</h2>
        {VALUE_PROPS.map((item) => (
          <div key={item.title} className="flex items-center gap-[16px]">
            <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary text-xl">{item.icon}</span>
            </div>
            <div>
              <p className="text-on-primary font-medium text-sm">{item.title}</p>
              <p className="text-on-primary-container text-xs">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="w-full flex flex-col gap-[12px]">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-container">
            <span className="material-symbols-outlined text-error text-[20px]">error</span>
            <p className="text-on-error-container text-sm">{error}</p>
          </div>
        )}
        {!isWalletInstalled ? (
          <Link
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-full bg-primary text-on-primary text-center font-semibold active:scale-[0.98] transition-transform"
          >
            Install Freighter Wallet
          </Link>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-4 rounded-full bg-primary text-on-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] transition-transform"
          >
            {isConnecting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                Connecting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                Connect Wallet
              </>
            )}
          </button>
        )}
        <p className="text-center text-xs text-on-surface-variant">
          Secured by Stellar. Non-custodial.
        </p>
      </div>
    </div>
  );
}
