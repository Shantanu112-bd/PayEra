"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton, MetricCard, ChartCard, LineChart } from "@cryptopay/ui";
import { Loader2, TrendingUp, Users, Activity, BarChart3 } from "lucide-react";

export default function MerchantAnalyticsPage() {
  const { data: merchant, isLoading: isMerchantLoading } = useQuery({
    queryKey: ["my-merchant"],
    queryFn: () => cryptoPaySdk.merchants.getMyMerchant(),
  });

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["merchant-analytics", merchant?.id],
    queryFn: () => cryptoPaySdk.merchants.getMerchantAnalytics(merchant!.id),
    enabled: !!merchant?.id,
  });

  if (isMerchantLoading) {
    return (
      <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!merchant) {
    return <div className="text-muted-foreground p-8">No merchant profile found.</div>;
  }

  const timelineData = analytics?.revenueTimeline || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-emerald-400" />
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Advanced metrics, transaction volume, and performance over time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAnalyticsLoading ? (
          <>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </>
        ) : (
          <>
            <MetricCard 
              title="Total Volume (INR)" 
              value={analytics ? `₹${(analytics.totalVolumePaise / 100).toLocaleString()}` : "—"}
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
            />
            <MetricCard 
              title="Total Transactions" 
              value={analytics?.transactionCount?.toString() || "0"}
              icon={<Activity className="w-5 h-5 text-blue-400" />}
            />
            <MetricCard 
              title="Avg Ticket Size" 
              value={analytics ? `₹${(analytics.averageTicketSizePaise / 100).toLocaleString()}` : "—"}
            />
            <MetricCard 
              title="Unique Customers" 
              value={analytics?.uniqueCustomers?.toString() || "0"}
              icon={<Users className="w-5 h-5 text-amber-400" />}
            />
          </>
        )}
      </div>

      <ChartCard 
        title="Revenue Timeline" 
        description="Daily transaction volume over the last 30 days"
      >
        {isAnalyticsLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : timelineData.length > 0 ? (
          <LineChart 
            data={timelineData} 
            index="date" 
            categories={["revenue"]} 
            colors={["#10b981"]}
            valueFormatter={(val) => `₹${(val / 100).toLocaleString()}`}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-lg">
            No timeline data available.
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Payment Methods</h3>
          {isAnalyticsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(analytics?.volumeByRail || {}).map(([rail, volume]: [string, any]) => (
                <div key={rail} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{rail}</span>
                  <span className="font-bold text-white">₹{(volume / 100).toLocaleString()}</span>
                </div>
              ))}
              {Object.keys(analytics?.volumeByRail || {}).length === 0 && (
                <div className="text-sm text-muted-foreground">No payment data yet.</div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-[#111111] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Campaign Performance</h3>
          {isAnalyticsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
               {analytics?.campaignsCount > 0 ? (
                 <div className="text-sm text-muted-foreground">
                   Active Campaigns: <span className="text-white font-bold">{analytics.campaignsCount}</span>
                 </div>
               ) : (
                 <div className="text-sm text-muted-foreground">No active campaigns.</div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
