"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { 
  WalletCard, 
  RewardBalanceCard, 
  TransactionCard, 
  MetricCard, 
  Skeleton,
  Button
} from "@cryptopay/ui";
import { ArrowRight, QrCode, BarChart3, Gift, History, Wallet, Check } from "lucide-react";
import Link from "next/link";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import { useAppStore } from "../../lib/store";
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

export default function DashboardPage() {
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => cryptoPaySdk.rewards.getRewards(),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => cryptoPaySdk.transactions.listTransactions({ limit: 5 }),
  });

  const { publicKey, balances, isWalletInstalled, connect } = useStellarWallet();
  const { isDemoMode, currentUserId } = useAppStore();
  
  const effectivePublicKey = isDemoMode ? currentUserId : publicKey;
  
  const primaryWallet = effectivePublicKey 
    ? { id: "freighter-1", address: effectivePublicKey, type: "FREIGHTER", isPrimary: true, name: "Freighter Wallet (Demo)" } as any
    : null;

  const shortAddress = effectivePublicKey 
    ? effectivePublicKey.slice(0, 4) + "..." + effectivePublicKey.slice(-4)
    : "";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionTag label="DASHBOARD" />
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">
            Good morning, Demo User
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {effectivePublicKey && (
            <span className="text-xs font-[family-name:var(--font-ibm-plex-mono)] text-muted border-[1.5px] border-ink rounded-[50px] px-3 py-1.5 flex items-center gap-2">
              {shortAddress}
              <span className="status-dot-lime !w-[6px] !h-[6px]" style={{ position: 'relative' }} />
              Testnet
            </span>
          )}
          {!effectivePublicKey ? (
            <Button onClick={connect} variant="accent">
              <Wallet className="mr-2 h-4 w-4" /> Connect Wallet →
            </Button>
          ) : (
            <Link href="/pay">
              <Button variant="default">
                <QrCode className="mr-2 h-4 w-4" /> Scan QR →
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* STAR Balance + Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!primaryWallet ? (
            <div className="card-white flex items-center justify-center min-h-[240px] text-center">
              <div>
                <div className="icon-box mx-auto mb-4 !w-14 !h-14">
                  <Wallet className="h-6 w-6" />
                </div>
                <p className="text-muted mb-4">Connect your Freighter wallet to view your balance and make payments.</p>
                <Button onClick={connect} variant="accent">Connect Wallet →</Button>
              </div>
            </div>
          ) : (
            <WalletCard 
              wallet={primaryWallet} 
              balance={balances.USDC} 
              assetCode="USDC" 
            />
          )}
        </div>

        {rewardsLoading || !rewards ? (
          <Skeleton className="h-[180px] w-full rounded-[20px] border-[1.5px] border-ink/10" />
        ) : (
          <RewardBalanceCard 
            starBalance={rewards.totalStarAmount} 
            onClaim={() => {}} 
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "SCAN & PAY →", href: "/pay", icon: QrCode },
          { label: "ANALYTICS →", href: "/merchant/analytics", icon: BarChart3 },
          { label: "CAMPAIGNS →", href: "/merchant/campaigns", icon: Gift },
          { label: "HISTORY →", href: "/history", icon: History },
        ].map((action) => (
          <Link key={action.label} href={action.href} className="btn-primary !py-2.5 !text-[13px]">
            <action.icon className="w-3.5 h-3.5" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTag label="RECENT" />
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-muted">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="border-[1.5px] border-ink rounded-[20px] overflow-hidden bg-white">
          {txLoading ? (
            <div className="p-4 space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[12px]" />)}
            </div>
          ) : (transactions as any)?.items?.length === 0 ? (
            <div className="text-center p-8 text-muted font-[family-name:var(--font-ibm-plex-mono)]">
              No recent transactions
            </div>
          ) : (
            ((transactions as any)?.items ?? []).map((tx: any) => (
              <TransactionCard key={tx.id} transaction={tx} isOutbound={tx.type === "CRYPTO_TO_FIAT"} />
            ))
          )}
        </div>
      </div>

      {/* Contract Status */}
      <div className="space-y-4">
        <SectionTag label="SOROBAN CONTRACTS" />
        <div className="flex flex-wrap gap-3">
          {["STAR Token", "Reward Engine", "Payment Engine"].map((name) => (
            <div key={name} className="tile !flex-row !gap-2 !px-4 !py-3 cursor-pointer">
              <span className="tile-badge !static !w-5 !h-5">
                <Check className="w-2.5 h-2.5 text-white" />
              </span>
              <span className="tile-label font-[family-name:var(--font-ibm-plex-mono)]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
