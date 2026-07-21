"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useMerchant } from "../../../hooks/useMerchant";
import { TopBar } from "../../../components/layout/TopBar";

function inr(paise: number | undefined) {
  return `₹${(Number(paise ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function MerchantAnalyticsPage() {
  const { merchant, merchantId, isLoading: merchantLoading } = useMerchant();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["merchant-analytics", merchantId],
    queryFn: () => cryptoPaySdk.merchants.getMerchantAnalytics(merchantId!),
    enabled: !!merchantId,
  });

  const timeline: any[] = analytics?.revenueTimeline ?? [];
  const maxVol = Math.max(1, ...timeline.map((d) => Number(d.revenue ?? d.volume ?? 0)));
  const railEntries = Object.entries(analytics?.volumeByRail ?? {}) as [string, any][];

  if (merchantLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="Analytics" />
        <div className="px-[20px] grid grid-cols-2 gap-3 pt-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse bg-surface-container-high rounded-[20px] h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!merchantId) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="Analytics" />
        <div className="px-[20px] pt-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px]">insights</span>
          <p className="text-[14px]">No merchant profile</p>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Total Volume", value: inr(analytics?.totalVolumePaise), icon: "trending_up" },
    { label: "Transactions", value: String(analytics?.transactionCount ?? 0), icon: "receipt_long" },
    { label: "Avg Ticket", value: inr(analytics?.averageTicketSizePaise), icon: "sell" },
    { label: "Customers", value: String(analytics?.uniqueCustomers ?? 0), icon: "group" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/merchant" title={`${merchant?.displayName || "Merchant"} · Analytics`} />

      <div className="px-[20px] space-y-5 pt-1">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-surface-container-lowest border border-outline-variant rounded-[20px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]">{m.icon}</span>
                <span className="text-[12px] text-on-surface-variant">{m.label}</span>
              </div>
              {isLoading ? (
                <div className="h-7 w-20 animate-pulse bg-surface-container-high rounded-[8px]" />
              ) : (
                <p className="text-[22px] font-bold text-on-background leading-none">{m.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Revenue timeline */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5">
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Revenue Timeline</p>
          {isLoading ? (
            <div className="h-40 animate-pulse bg-surface-container-high rounded-[12px]" />
          ) : timeline.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-on-surface-variant text-[13px]">
              No timeline data
            </div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {timeline.slice(-30).map((d, i) => {
                const v = Number(d.revenue ?? d.volume ?? 0);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-primary/80 rounded-t-[3px] min-h-[2px]"
                    style={{ height: `${(v / maxVol) * 100}%` }}
                    title={`${d.date}: ${inr(v)}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5">
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Payment Methods</p>
          {isLoading ? (
            <div className="space-y-3">
              {Array(2).fill(0).map((_, i) => <div key={i} className="h-5 animate-pulse bg-surface-container-high rounded-[6px]" />)}
            </div>
          ) : railEntries.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant">No payment data yet</p>
          ) : (
            <div className="space-y-3">
              {railEntries.map(([rail, volume]) => (
                <div key={rail} className="flex justify-between items-center">
                  <span className="text-[14px] text-on-surface-variant">{rail}</span>
                  <span className="text-[14px] font-bold text-on-background">{inr(volume)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
