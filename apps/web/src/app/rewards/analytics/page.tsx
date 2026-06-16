"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ChartCard, LineChart, PieChart } from "@cryptopay/ui";

import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";

const DEMO_USER_ID = "33333333-3333-3333-3333-333333333333";

export default function ConsumerAnalyticsPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["consumer-reward-metrics", DEMO_USER_ID],
    queryFn: () => cryptoPaySdk.analytics.getConsumerRewardMetrics(DEMO_USER_ID),
  });

  const starEarningsData = metrics?.timeSeries || [];

  const sourceData = metrics?.byReason ? [
    { name: "Payments", value: metrics.byReason.SPEND || 0 },
    { name: "Referrals", value: metrics.byReason.REFERRAL || 0 },
    { name: "Campaigns", value: metrics.byReason.CAMPAIGN || 0 },
    { name: "Merchant", value: metrics.byReason.MERCHANT || 0 },
  ].filter(s => s.value > 0) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <Link href="/rewards" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reward Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visualize your STAR earning trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Earnings Over Time" 
          description="STAR tokens earned per month"
        >
          {isLoading ? (
             <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-white/5 rounded-xl bg-black/20">Loading...</div>
          ) : starEarningsData.length === 0 ? (
             <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-white/5 rounded-xl bg-black/20">No earnings data available</div>
          ) : (
            <LineChart 
              data={starEarningsData} 
              index="month" 
              categories={["earned"]} 
              colors={["#f59e0b"]}
              valueFormatter={(val) => `${val} STAR`}
            />
          )}
        </ChartCard>

        <ChartCard 
          title="Earning Sources" 
          description="Where your STAR tokens come from"
        >
          {isLoading ? (
             <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-white/5 rounded-xl bg-black/20">Loading...</div>
          ) : sourceData.length === 0 ? (
             <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-white/5 rounded-xl bg-black/20">No earning sources available</div>
          ) : (
            <PieChart 
              data={sourceData} 
              nameKey="name" 
              dataKey="value" 
              colors={["#3b82f6", "#10b981", "#8b5cf6", "#f43f5e"]}
              valueFormatter={(val) => `${val} STAR`}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
