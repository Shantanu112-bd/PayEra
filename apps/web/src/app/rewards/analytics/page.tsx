"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useAppStore } from "../../../lib/store";
import { TopBar } from "../../../components/layout/TopBar";

const SOURCE_COLORS: Record<string, string> = {
  Payments: "bg-primary",
  Referrals: "bg-tertiary",
  Campaigns: "bg-secondary",
  Merchant: "bg-error",
};

export default function ConsumerAnalyticsPage() {
  const { currentUserId } = useAppStore();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["consumer-reward-metrics", currentUserId],
    queryFn: () => cryptoPaySdk.analytics.getConsumerRewardMetrics(currentUserId!),
    enabled: !!currentUserId,
  });

  const timeSeries: any[] = metrics?.timeSeries ?? [];
  const maxEarned = Math.max(1, ...timeSeries.map((d) => Number(d.earned ?? 0)));

  const sources = metrics?.byReason
    ? [
        { name: "Payments", value: metrics.byReason.SPEND || 0 },
        { name: "Referrals", value: metrics.byReason.REFERRAL || 0 },
        { name: "Campaigns", value: metrics.byReason.CAMPAIGN || 0 },
        { name: "Merchant", value: metrics.byReason.MERCHANT || 0 },
      ].filter((s) => s.value > 0)
    : [];
  const sourcesTotal = sources.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/rewards" title="Reward Analytics" />

      <div className="px-[20px] space-y-5 pt-1">
        {/* Total earned */}
        <div className="rewards-gradient rounded-[24px] p-6 text-white">
          <p className="text-[13px] font-medium opacity-80">Total STAR Earned</p>
          {isLoading ? (
            <div className="h-10 w-32 bg-white/20 rounded-[8px] animate-pulse mt-1" />
          ) : (
            <p className="text-[40px] font-bold leading-none">{metrics?.totalEarned ?? 0}</p>
          )}
        </div>

        {/* Earnings over time */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5">
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Earnings Over Time</p>
          {isLoading ? (
            <div className="h-40 animate-pulse bg-surface-container-high rounded-[12px]" />
          ) : timeSeries.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-on-surface-variant text-[13px]">No earnings data</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {timeSeries.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/80 rounded-t-[4px] min-h-[2px]"
                    style={{ height: `${(Number(d.earned ?? 0) / maxEarned) * 100}%` }}
                    title={`${d.month}: ${d.earned} STAR`}
                  />
                  <span className="text-[10px] text-on-surface-variant truncate max-w-full">{d.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Earning sources */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5">
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Earning Sources</p>
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-5 animate-pulse bg-surface-container-high rounded-[6px]" />)}
            </div>
          ) : sources.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant">No earning sources yet</p>
          ) : (
            <div className="space-y-4">
              {sources.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[14px] text-on-background">{s.name}</span>
                    <span className="text-[13px] font-semibold text-on-background">{s.value} STAR</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${SOURCE_COLORS[s.name] ?? "bg-primary"}`}
                      style={{ width: `${(s.value / sourcesTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
