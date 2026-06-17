"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { RewardBalanceCard, Skeleton, MetricCard, Button } from "@cryptopay/ui";
import { Users, Star, Gift, QrCode } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ─── SECTION TAG ─── */
function SectionTag({ label }: { label: string }) {
  return (
    <div className="section-tag">
      <span className="tag-marker" />
      <span className="tag-line" />
      <span className="tag-label">{label}</span>
    </div>
  );
}

export default function RewardsPage() {
  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      // Fetch balance — API returns { mintedStar, pendingStar, lifetimeStar }
      const balanceObj = await cryptoPaySdk.rewards.getRewards();
      return { totalMinted: (balanceObj as any).mintedStar?.toString() || "0" };
    },
  });

  // Use the seeded Demo User ID (matches store default)
  const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
  
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["consumer-reward-metrics", DEMO_USER_ID],
    queryFn: () => cryptoPaySdk.analytics.getConsumerRewardMetrics(DEMO_USER_ID),
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionTag label="REWARDS" />
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">STAR Rewards</h1>
        </div>
        <div className="pill-tabs">
          <Link href="/rewards/history" className="pill-tab">Reward History</Link>
          <Link href="/rewards/campaigns" className="pill-tab">Campaigns</Link>
          <Link href="/rewards/referrals" className="pill-tab">Referrals</Link>
          <Link href="/rewards/analytics" className="pill-tab">Analytics</Link>
        </div>
      </div>

      {/* Stats Card */}
      <div className="stats-card stats-card-3">
        <div className="stat-col">
          <div className="stat-number !text-4xl">{rewards?.totalMinted || "2,500"}</div>
          <div className="stat-primary-label">Total STAR</div>
        </div>
        <div className="stat-col">
          <div className="stat-number !text-4xl">340</div>
          <div className="stat-primary-label">This month</div>
        </div>
        <div className="stat-col">
          <div className="stat-number !text-4xl">0</div>
          <div className="stat-primary-label">Redeemed</div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="space-y-4">
        <SectionTag label="TIER" />
        <div className="card-white">
          <div className="flex items-center justify-between mb-4">
            <span className="border-[1.5px] border-ink rounded-[50px] px-3 py-1 text-xs font-semibold font-[family-name:var(--font-ibm-plex-mono)] uppercase tracking-wider">
              Silver Tier
            </span>
            <span className="text-sm text-muted font-[family-name:var(--font-ibm-plex-mono)]">500 STAR to Gold</span>
          </div>
          <div className="progress-bar-track">
            <motion.div 
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[100px] w-full rounded-[20px]" />)
        ) : (
          <>
            <MetricCard title="Earned via Spend" value={metrics?.byReason.SPEND.toString() || "0"} icon={<Star className="w-4 h-4" />} />
            <MetricCard title="Earned via Referrals" value={metrics?.byReason.REFERRAL.toString() || "0"} icon={<Users className="w-4 h-4" />} />
            <MetricCard title="Earned via Campaigns" value={metrics?.byReason.CAMPAIGN?.toString() || "0"} icon={<Gift className="w-4 h-4" />} />
            <MetricCard title="Earned via Merchants" value={metrics?.byReason.MERCHANT?.toString() || "0"} icon={<Star className="w-4 h-4" />} />
          </>
        )}
      </div>

      {/* Refer & Earn */}
      <div className="card-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="icon-box !w-9 !h-9">
            <Gift className="w-4 h-4" />
          </div>
          <h3 className="font-bold font-[family-name:var(--font-ibm-plex-mono)]">Refer & Earn</h3>
        </div>
        <p className="text-sm text-muted mb-4">
          Invite friends to CryptoPay and earn 500 STAR tokens when they make their first payment.
        </p>
        <div className="p-3 bg-surface rounded-[12px] border-[1.5px] border-ink font-[family-name:var(--font-ibm-plex-mono)] text-sm text-center mb-4">
          REF-CRYPTO-2026
        </div>
        <Button variant="accent" className="w-full">Copy Link →</Button>
      </div>
    </motion.div>
  );
}
