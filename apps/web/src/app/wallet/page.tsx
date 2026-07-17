"use client";

import * as React from "react";
import { Plus, Copy, ExternalLink, ArrowDown, ArrowUp, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton, Button, EmptyState } from "@cryptopay/ui";
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

/* ─── BALANCE CARD ─── */
function BalanceCard({
  icon,
  label,
  balance,
  symbol,
  color,
  href,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  balance: string;
  symbol: string;
  color: string;
  href: string;
  isLoading?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="bg-white border-[1.5px] border-ink rounded-[16px] p-4 hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center border-[1.5px] border-ink" style={{ background: color + "20" }}>
            {icon}
          </div>
          {isLoading && (
            <Skeleton className="h-6 w-16 rounded-full" />
          )}
        </div>
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-24 rounded mb-2" />
            <Skeleton className="h-4 w-16 rounded" />
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink">{balance}</span>
              <span className="text-xl text-muted font-medium">{symbol}</span>
            </div>
            <div className="text-xs text-muted">{label}</div>
          </>
        )}
      </motion.div>
    </Link>
  );
}

export default function WalletPage() {
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  const { publicKey, isWalletInstalled, connect, balances, refreshBalances } = useStellarWallet();
  const { isDemoMode, currentUserId } = useAppStore();

  const effectiveKey = isDemoMode
    ? (publicKey || "GBRP4ZDXSSQAJTZT25ZBQ55ZBQ55ZBQ55ZBQ55ZBQ55ZBQ55ZBQ55ZBQ")
    : publicKey;
  const shortAddress = effectiveKey ? effectiveKey.slice(0, 6) + "..." + effectiveKey.slice(-4) : "";

  // Fetch real on-chain STAR balance from the backend
  const { data: starBalance, isLoading: starLoading } = useQuery({
    queryKey: ["star-balance", publicKey],
    queryFn: () => cryptoPaySdk.stellar.getStarBalance(publicKey!),
    enabled: !!publicKey,
    refetchInterval: 30000,
  });

  // Fetch real XLM/USDC balances from Horizon
  const { data: horizonBalances, isLoading: horizonLoading } = useQuery({
    queryKey: ["horizon-balances", publicKey],
    queryFn: async () => {
      const { address } = await (await import("@stellar/freighter-api")).getAddress();
      if (!address) return { xlm: "0.00", usdc: "0.00" };
      const { getWalletBalances } = await import("../../lib/horizon");
      return getWalletBalances(address);
    },
    enabled: !!publicKey,
    refetchInterval: 30000,
  });

  const xlmBalance = horizonBalances?.xlm || "0.00";
  const usdcBalance = horizonBalances?.usdc || "0.00";
  const starBalanceValue = starBalance?.starBalanceFormatted || "0";

  if (!effectiveKey) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <SectionTag label="WALLET" />
            <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">Your Wallets</h1>
          </div>
          <Button onClick={connect} variant="accent">
            <Plus className="mr-2 h-4 w-4" /> Connect Wallet →
          </Button>
        </div>

        <EmptyState
          icon={<Plus className="h-6 w-6" />}
          title="No Wallets Connected"
          description="Connect a Freighter wallet to start spending your crypto."
          action={<Button onClick={connect} variant="accent"><Plus className="mr-2 h-4 w-4" /> Connect Wallet →</Button>}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <SectionTag label="WALLET" />
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">Your Wallets</h1>
        </div>
        <Button onClick={refreshBalances} variant="accent" disabled={horizonLoading || starLoading}>
          <Star className="mr-2 h-4 w-4" /> Refresh Balances
        </Button>
      </div>

      {/* Wallet Card */}
      <div className="card-white">
        <div className="flex items-center justify-between mb-4">
          <span className="border-[1.5px] border-ink rounded-[50px] px-3 py-1 text-xs font-semibold font-[family-name:var(--font-ibm-plex-mono)] uppercase tracking-wider">
            Stellar Testnet
          </span>
          <span className="flex items-center gap-2 text-sm text-ink font-[family-name:var(--font-ibm-plex-mono)]">
            <span className="status-dot-lime" style={{ position: 'relative' }} />
            Connected
          </span>
        </div>
        <p className="text-xl font-[family-name:var(--font-ibm-plex-mono)] font-bold text-ink mb-4">
          {shortAddress}
        </p>
        <div className="flex gap-3">
          <button className="btn-primary !py-2 !text-[12px]">
            <Copy className="w-3 h-3" /> COPY ADDRESS
          </button>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${effectiveKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !py-2 !text-[12px]"
          >
            <ExternalLink className="w-3 h-3" /> VIEW ON STELLAR EXPERT
          </a>
        </div>
      </div>

      {/* Balances - Real On-Chain Data */}
      <SectionTag label="ON-CHAIN BALANCES" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <BalanceCard
          icon={<Zap className="w-5 h-5 text-ink" />}
          label="Native asset"
          balance={xlmBalance}
          symbol="XLM"
          color="#3B7DE8"
          href="/wallet/offramp"
          isLoading={horizonLoading}
        />
        <BalanceCard
          icon={<Star className="w-5 h-5 text-[#3B7DE8]" />}
          label="Circle USDC"
          balance={usdcBalance}
          symbol="USDC"
          color="#3B7DE8"
          href="/wallet/offramp"
          isLoading={horizonLoading}
        />
        <BalanceCard
          icon={<Star className="w-5 h-5 text-[#C5D483]" />}
          label="Your rewards"
          balance={starBalanceValue}
          symbol="STAR"
          color="#C5D483"
          href="/rewards"
          isLoading={starLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Link href="/wallet/onramp" className="block">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white border-[1.5px] border-ink rounded-[16px] p-4 text-center hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink mx-auto mb-2">
              <ArrowDown className="w-5 h-5 text-ink" />
            </div>
            <div className="font-bold text-sm text-ink">Add USDC</div>
            <div className="text-xs text-muted font-mono">MoneyGram Ramps</div>
          </motion.div>
        </Link>
        <Link href="/wallet/offramp" className="block">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white border-[1.5px] border-ink rounded-[16px] p-4 text-center hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink mx-auto mb-2">
              <ArrowUp className="w-5 h-5 text-ink" />
            </div>
            <div className="font-bold text-sm text-ink">Cash Out</div>
            <div className="text-xs text-muted font-mono">174 countries</div>
          </motion.div>
        </Link>
        <Link href="/wallet/trust" className="block">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white border-[1.5px] border-ink rounded-[16px] p-4 text-center hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink mx-auto mb-2">
              <Star className="w-5 h-5 text-[#A3B359]" />
            </div>
            <div className="font-bold text-sm text-ink">Trustlines</div>
            <div className="text-xs text-muted font-mono">Manage assets</div>
          </motion.div>
        </Link>
        <Link href="/history" className="block">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white border-[1.5px] border-ink rounded-[16px] p-4 text-center hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink mx-auto mb-2">
              <Zap className="w-5 h-5 text-ink" />
            </div>
            <div className="font-bold text-sm text-ink">History</div>
            <div className="text-xs text-muted font-mono">All transactions</div>
          </motion.div>
        </Link>
      </div>

      {/* Network Status */}
      <div className="card-white flex items-center gap-3">
        <span className="status-dot-lime" style={{ position: 'relative' }} />
        <span className="font-[family-name:var(--font-ibm-plex-mono)] text-sm text-ink">
          Stellar Testnet — Connected
        </span>
      </div>

      {/* Network Info */}
      <div className="bg-white border-[1.5px] border-ink rounded-[16px] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink">
            <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <span className="font-bold font-[family-name:var(--font-ibm-plex-mono)]">Stellar Testnet</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted mb-1">Horizon</div>
            <div className="font-mono text-ink">horizon-testnet.stellar.org</div>
          </div>
          <div>
            <div className="text-muted mb-1">Soroban RPC</div>
            <div className="font-mono text-ink">soroban-testnet.stellar.org</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}