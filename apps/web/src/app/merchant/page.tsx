"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useMerchant } from "../../hooks/useMerchant";
import { TopBar } from "../../components/layout/TopBar";

function inr(n: number | undefined) {
  return `₹${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-secondary-container text-primary",
  FAILED: "bg-error-container text-error",
  CANCELLED: "bg-error-container text-error",
};

export default function MerchantDashboardPage() {
  const { merchant, merchantId, isLoading: merchantLoading } = useMerchant();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["merchant-dashboard", merchantId],
    queryFn: () => cryptoPaySdk.analytics.getDashboardMetrics(merchantId!),
    enabled: !!merchantId,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["merchant-recent-tx", merchantId],
    queryFn: () => cryptoPaySdk.merchants.getMerchantTransactions(merchantId!, { limit: 5 }),
    enabled: !!merchantId,
  });

  const transactions: any[] = (txData as any)?.data ?? [];

  if (merchantLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Merchant" />
        <div className="px-[20px] space-y-3 pt-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse bg-surface-container-high rounded-[20px] h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!merchantId) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Merchant" />
        <div className="px-[20px] pt-16 flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant">storefront</span>
          <p className="text-[15px] font-semibold text-on-background">No merchant account</p>
          <p className="text-[13px] text-on-surface-variant max-w-xs">
            You don&apos;t have a merchant profile yet. Set one up to accept payments.
          </p>
          <Link href="/merchant/onboard" className="mt-2 bg-primary text-on-primary text-[14px] font-semibold px-6 py-3 rounded-full">
            Become a Merchant
          </Link>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Revenue", value: inr(metrics?.totalVolumeInr), icon: "payments" },
    { label: "Transactions", value: String(metrics?.totalTransactions ?? 0), icon: "receipt_long" },
    { label: "STAR Issued", value: String(metrics?.totalRewardsMinted ?? 0), icon: "star" },
    { label: "Campaigns", value: String(metrics?.activeCampaigns ?? 0), icon: "campaign" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar
        title={merchant?.displayName || "Merchant"}
        actions={
          <Link href="/merchant/campaigns/create" className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </Link>
        }
      />

      <div className="px-[20px] space-y-5 pt-1">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="bg-surface-container-lowest border border-outline-variant rounded-[20px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]">{k.icon}</span>
                <span className="text-[12px] text-on-surface-variant">{k.label}</span>
              </div>
              {isLoading ? (
                <div className="h-7 w-20 animate-pulse bg-surface-container-high rounded-[8px]" />
              ) : (
                <p className="text-[24px] font-bold text-on-background leading-none">{k.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "qr_code_2", label: "QR Codes", href: "/merchant/qr-codes" },
            { icon: "campaign", label: "Campaigns", href: "/merchant/campaigns" },
            { icon: "insights", label: "Analytics", href: "/merchant/analytics" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex flex-col items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-[20px] py-4 active:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[24px]">{l.icon}</span>
              <span className="text-[11px] font-semibold text-on-background text-center">{l.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide">Recent Payments</p>
            <Link href="/merchant/transactions" className="text-[13px] font-semibold text-primary">See all</Link>
          </div>
          <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
            {txLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="animate-pulse bg-surface-container-high rounded-[12px] h-10 w-full" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px]">receipt_long</span>
                <p className="text-[14px]">No payments yet</p>
              </div>
            ) : (
              transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">south_west</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-on-background truncate">{tx.publicId || "Payment"}</p>
                    <p className="text-[12px] text-on-surface-variant">
                      {new Date(tx.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[14px] font-bold text-on-background">
                      ₹{(Number(tx.amountInPaise || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[tx.status] ?? "bg-surface-container text-on-surface-variant"}`}>
                      {tx.status}
                    </span>
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
