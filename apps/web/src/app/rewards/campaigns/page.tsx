"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../components/layout/TopBar";

function inr(paise: string | number | undefined) {
  return `₹${(Number(paise ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ConsumerCampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["consumer-campaigns"],
    queryFn: () => cryptoPaySdk.campaigns.listCampaigns({ status: "ACTIVE" }),
  });

  const campaigns: any[] = (data as any)?.data ?? [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/rewards" title="Active Campaigns" />

      <div className="px-[20px] space-y-4 pt-1">
        <p className="text-[13px] text-on-surface-variant">
          Shop at these merchants to earn bonus STAR rewards.
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-surface-container-high rounded-[24px] h-32" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px]">campaign</span>
            <p className="text-[15px] font-semibold text-on-background">No active campaigns</p>
            <p className="text-[13px]">Check back later for new offers.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c: any) => {
              const budget = Number(c.budgetStar ?? 0);
              const spent = Number(c.spentStar ?? 0);
              const pct = budget ? Math.min(100, (spent / budget) * 100) : 0;
              return (
                <div key={c.id} className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[22px]">redeem</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-bold text-on-background truncate">{c.name}</p>
                      {c.description && <p className="text-[13px] text-on-surface-variant line-clamp-2">{c.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-secondary-container rounded-[14px] px-3 py-2">
                      <p className="text-[11px] text-on-surface-variant">Reward</p>
                      <p className="text-[15px] font-bold text-primary">+{c.rewardAmountStar} STAR</p>
                    </div>
                    <div className="flex-1 bg-surface-container rounded-[14px] px-3 py-2">
                      <p className="text-[11px] text-on-surface-variant">Spend ≥</p>
                      <p className="text-[15px] font-bold text-on-background">{inr(c.thresholdAmountPaise)}</p>
                    </div>
                  </div>

                  {budget > 0 && (
                    <div>
                      <div className="flex justify-between text-[11px] text-on-surface-variant mb-1">
                        <span>Budget used</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
