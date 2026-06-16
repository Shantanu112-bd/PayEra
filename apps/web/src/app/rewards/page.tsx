"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { RewardBalanceCard, Skeleton, Card, CardContent, CardHeader, CardTitle, MetricCard } from "@cryptopay/ui";
import { Users, Star, Gift } from "lucide-react";
import Link from "next/link";

export default function RewardsPage() {
  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      // Fetch balance and return it as totalMinted
      const balanceObj = await cryptoPaySdk.rewards.getRewards();
      return { totalMinted: balanceObj.totalStarAmount || "0" };
    },
  });

  // Use a hardcoded mock user ID since auth isn't fully connected in the UI yet
  const DEMO_USER_ID = "33333333-3333-3333-3333-333333333333";
  
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["consumer-reward-metrics", DEMO_USER_ID],
    queryFn: () => cryptoPaySdk.analytics.getConsumerRewardMetrics(DEMO_USER_ID),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">STAR Rewards</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your earnings, referrals, and campaigns.</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Link href="/rewards/history" className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-white/10 bg-black hover:bg-white/5 h-9 px-4 py-2 whitespace-nowrap text-white">
            Reward History
          </Link>
          <Link href="/rewards/campaigns" className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-white/10 bg-black hover:bg-white/5 h-9 px-4 py-2 whitespace-nowrap text-white">
            Campaigns
          </Link>
          <Link href="/rewards/referrals" className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-white/10 bg-black hover:bg-white/5 h-9 px-4 py-2 whitespace-nowrap text-white">
            Referrals
          </Link>
          <Link href="/rewards/analytics" className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-white/10 bg-black hover:bg-white/5 h-9 px-4 py-2 whitespace-nowrap text-white">
            Analytics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading || !rewards ? (
            <Skeleton className="h-[200px] w-full rounded-xl" />
          ) : (
            <RewardBalanceCard 
              starBalance={rewards.totalMinted} 
              onClaim={() => alert("Claiming rewards...")} 
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {metricsLoading ? (
              <>
                <Skeleton className="h-[100px] w-full rounded-xl" />
                <Skeleton className="h-[100px] w-full rounded-xl" />
              </>
            ) : (
              <>
                <MetricCard title="Earned via Spend" value={metrics?.byReason.SPEND.toString() || "0"} icon={<Star />} />
                <MetricCard title="Earned via Referrals" value={metrics?.byReason.REFERRAL.toString() || "0"} icon={<Users />} />
                <MetricCard title="Earned via Campaigns" value={metrics?.byReason.CAMPAIGN?.toString() || "0"} icon={<Gift />} />
                <MetricCard title="Earned via Merchants" value={metrics?.byReason.MERCHANT?.toString() || "0"} icon={<Star />} />
              </>
            )}
          </div>
        </div>

        <div>
          <Card className="h-full bg-blue-900/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-blue-400" />
                Refer & Earn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Invite friends to CryptoPay and earn 500 STAR tokens when they make their first payment.
              </p>
              <div className="p-3 bg-black/40 rounded-lg border border-white/10 font-mono text-sm text-center">
                REF-CRYPTO-2026
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                Copy Link
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
