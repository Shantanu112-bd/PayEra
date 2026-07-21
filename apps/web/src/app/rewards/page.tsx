"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import { TopBar } from "../../components/layout/TopBar";

const REDEEM_OPTIONS = [
  { icon: "percent", label: "Cashback" },
  { icon: "card_giftcard", label: "Gift Cards" },
  { icon: "local_offer", label: "Fee Discount" },
  { icon: "volunteer_activism", label: "Donate" },
];

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "MINTED"
      ? "bg-secondary-container text-primary"
      : status === "PENDING"
      ? "bg-surface-container text-on-surface-variant"
      : "bg-error-container text-error";
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

export default function RewardsPage() {
  const { publicKey } = useStellarWallet();

  const { data: starBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["star-balance", publicKey],
    queryFn: () => cryptoPaySdk.stellar.getStarBalance(publicKey!),
    enabled: !!publicKey,
  });

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ["rewards-list"],
    queryFn: () => cryptoPaySdk.rewards.listRewards({ limit: 10 }),
  });

  const rewards: any[] = (rewardsData as any)?.data ?? [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar title="Rewards" />

      <div className="px-[20px] space-y-5 pt-2">
        {/* Hero card */}
        <div className="rewards-gradient rounded-[24px] p-6 text-white space-y-1">
          <p className="text-[13px] font-medium opacity-80">STAR Balance</p>
          {balanceLoading ? (
            <div className="h-10 w-32 bg-white/20 rounded-[8px] animate-pulse" />
          ) : (
            <p className="text-[40px] font-bold leading-none">{String(starBalance ?? "0")}</p>
          )}
          <p className="text-[13px] opacity-70">STAR Tokens</p>
          <div className="pt-3 border-t border-white/20 flex justify-between text-[13px]">
            <span className="opacity-70">Lifetime earned</span>
            <span className="font-semibold">{(rewardsData as any)?.meta?.total ?? "—"}</span>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-3">
          <Link href="/rewards/referrals" className="flex-1 flex items-center gap-2 bg-surface-container-lowest rounded-[16px] px-4 py-3 border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">group_add</span>
            <span className="text-[14px] font-semibold text-on-background">Referrals</span>
          </Link>
          <Link href="/rewards/history" className="flex-1 flex items-center gap-2 bg-surface-container-lowest rounded-[16px] px-4 py-3 border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">history</span>
            <span className="text-[14px] font-semibold text-on-background">History</span>
          </Link>
        </div>

        {/* Quick Redeem */}
        <div>
          <p className="text-[13px] font-semibold text-on-surface-variant mb-3 uppercase tracking-wide">Quick Redeem</p>
          <div className="grid grid-cols-2 gap-3">
            {REDEEM_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                className="flex flex-col items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-[24px] py-5 px-3 active:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-[28px]">{opt.icon}</span>
                <span className="text-[13px] font-semibold text-on-background">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Rewards */}
        <div>
          <p className="text-[13px] font-semibold text-on-surface-variant mb-3 uppercase tracking-wide">Recent Rewards</p>
          <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
            {rewardsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="animate-pulse bg-surface-container-high rounded-[12px] h-10 w-full" />
                </div>
              ))
            ) : rewards.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px]">star_border</span>
                <p className="text-[14px]">No rewards yet</p>
              </div>
            ) : (
              rewards.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">star</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-on-background truncate">{r.reason}</p>
                    <p className="text-[12px] text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[14px] font-bold text-primary">+{r.starAmount}</span>
                    <StatusChip status={r.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
