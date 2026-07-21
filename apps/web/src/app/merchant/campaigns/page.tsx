"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useMerchant } from "../../../hooks/useMerchant";
import { TopBar } from "../../../components/layout/TopBar";

const TABS = ["ALL", "ACTIVE", "SCHEDULED", "COMPLETED"] as const;
type Tab = (typeof TABS)[number];

function statusChip(status: string) {
  if (status === "ACTIVE") return "bg-secondary-container text-primary";
  if (status === "COMPLETED") return "bg-surface-container text-on-surface-variant";
  if (status === "PAUSED") return "bg-error-container text-error";
  return "bg-surface-container text-on-surface-variant";
}

export default function CampaignsPage() {
  const [tab, setTab] = React.useState<Tab>("ALL");
  const { merchantId, isLoading: merchantLoading } = useMerchant();

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-campaigns", merchantId],
    queryFn: () => cryptoPaySdk.campaigns.listCampaigns(),
    enabled: !!merchantId,
  });

  const all: any[] = (data as any)?.data ?? [];
  const campaigns = tab === "ALL" ? all : all.filter((c) => (c.status || "").toUpperCase() === (tab === "SCHEDULED" ? "SCHEDULED" : tab));

  if (merchantLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="Campaigns" />
        <div className="px-[20px] space-y-3 pt-2">
          {Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-surface-container-high rounded-[24px] h-28" />)}
        </div>
      </div>
    );
  }

  if (!merchantId) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="Campaigns" />
        <div className="px-[20px] pt-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px]">campaign</span>
          <p className="text-[14px]">No merchant profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar
        backHref="/merchant"
        title="Campaigns"
        actions={
          <Link href="/merchant/campaigns/create" className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </Link>
        }
      />

      <div className="px-[20px] pt-1 space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-[20px] px-[20px]">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                tab === t ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant"
              }`}
            >
              {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-surface-container-high rounded-[24px] h-28" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px]">campaign</span>
            <p className="text-[15px] font-semibold text-on-background">No campaigns yet</p>
            <p className="text-[13px]">Create one to reward your customers.</p>
            <Link href="/merchant/campaigns/create" className="mt-2 bg-primary text-on-primary text-[14px] font-semibold px-6 py-3 rounded-full">
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c: any) => {
              const budget = Number(c.budgetStar ?? 0);
              const spent = Number(c.spentStar ?? 0);
              const pct = budget ? Math.min(100, (spent / budget) * 100) : 0;
              return (
                <Link
                  key={c.id}
                  href={`/merchant/campaigns/${c.id}`}
                  className="block bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 space-y-3 active:bg-surface-container transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-bold text-on-background truncate">{c.name}</p>
                      <p className="text-[13px] text-primary font-semibold">+{c.rewardAmountStar} STAR reward</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusChip(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  {budget > 0 && (
                    <div>
                      <div className="flex justify-between text-[11px] text-on-surface-variant mb-1">
                        <span>{spent} / {budget} STAR</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
