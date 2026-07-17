"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton } from "@cryptopay/ui";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import { useAppStore } from "../../lib/store";
import { motion } from "framer-motion";

function SectionTag({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="font-mono text-xs text-muted px-2 py-0.5 uppercase">
        [□]———[{label}]
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => cryptoPaySdk.rewards.getRewards(),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => cryptoPaySdk.transactions.listTransactions({ limit: 5 }),
  });

  const { balances } = useStellarWallet();
  const { currentUserDisplayName } = useAppStore();
  
  const xlmBalance = balances?.XLM || "0.00";
  const usdcBalance = balances?.USDC || "0.00";
  const starBalance = rewards?.totalStarAmount || "0";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-md mx-auto pb-24 pt-2"
    >
      {/* Greeting */}
      <h1 className="text-[16px] font-mono text-muted mb-2">
        Good morning, {currentUserDisplayName || 'there'}
      </h1>

      {/* ZONE 1: Balance + Allowance Status */}
      <div className="space-y-4 mb-8">
        <SectionTag label="WALLET" />
        <div className="w-full bg-white border-[1.5px] border-[#1A1A1A] rounded-[20px] p-6 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="text-[11px] font-mono uppercase text-muted tracking-wider">
              TOTAL BALANCE
            </div>
            <div className="text-[10px] font-mono bg-ink/5 border border-ink/10 px-2 py-1 rounded-full text-ink">
              STELLAR TESTNET
            </div>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-mono font-bold text-ink flex items-baseline gap-1">
              {xlmBalance} <span className="text-xl text-muted font-medium">XLM</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm font-mono text-muted">
              <span>{usdcBalance} USDC</span>
              <span className="w-1 h-1 rounded-full bg-ink/20" />
              <span className="text-[#C5D483] font-bold">{starBalance} STAR</span>
            </div>
          </div>

          {/* Allowance Status Row */}
          <div className="mt-6 pt-4 border-t-[1.5px] border-ink/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#A3B359] animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-ink tracking-wider">OPERATOR ALLOWANCE</span>
            </div>
            <span className="text-[11px] font-mono text-muted">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ZONE 2: Quick Actions + Contract Status */}
      <div className="space-y-4 mb-8">
        <SectionTag label="SYSTEM" />
        <div className="grid grid-cols-2 gap-4">
          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.push('/pay')}
              className="flex-1 bg-[#1A1A1A] text-white rounded-[16px] p-4 text-xs font-bold tracking-wider flex flex-col items-start justify-center gap-2 border-[1.5px] border-[#1A1A1A] hover:bg-[#1A1A1A]/90 transition-colors shadow-sm"
            >
              <span className="text-lg mb-1">⬤</span> 
              <span>SCAN & PAY</span>
            </button>
            <div className="flex gap-3 h-12">
              <button className="flex-1 bg-white text-ink rounded-[12px] text-[10px] font-bold tracking-wider border-[1.5px] border-[#1A1A1A] hover:bg-ink/5 transition-colors">
                ADD USDC
              </button>
              <button className="flex-1 bg-white text-ink rounded-[12px] text-[10px] font-bold tracking-wider border-[1.5px] border-[#1A1A1A] hover:bg-ink/5 transition-colors">
                CASH OUT
              </button>
            </div>
          </div>

          {/* Contract Status */}
          <div className="flex flex-col gap-2">
            {[
              { name: "STAR Token", address: "CCW3...X9P2" },
              { name: "Reward Engine", address: "CBT5...3L1M" },
              { name: "Payment Engine", address: "CDA8...K4N9" },
            ].map(contract => (
              <div key={contract.name} className="flex-1 flex flex-col justify-center p-3 bg-white rounded-[12px] border-[1.5px] border-ink hover:bg-ink/5 transition-colors">
                 <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-[10px] text-ink uppercase tracking-wider">{contract.name}</div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#A3B359] animate-pulse" />
                 </div>
                 <Link href={`https://stellar.expert/explorer/testnet/contract/${contract.address.replace("...", "")}`} className="text-[9px] text-blue-600 underline font-mono truncate">
                   {contract.address}
                 </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ZONE 3: Recent Activity */}
      <div className="space-y-4">
        <SectionTag label="RECENT" />
        
        <div className="space-y-3">
          {txLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[16px] border-[1.5px] border-ink/20" />)
          ) : (transactions as any)?.items?.length === 0 ? (
            <div className="text-center p-6 border-[1.5px] border-ink/10 rounded-[16px] bg-white text-muted font-mono text-sm">
              No recent transactions
            </div>
          ) : (
            ((transactions as any)?.items ?? []).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-[16px] border-[1.5px] border-ink">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink">
                    <span className="font-mono font-bold text-sm text-ink">
                      {tx.merchantName?.substring(0, 2).toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink">{tx.merchantName || 'Merchant'}</div>
                    <div className="text-xs text-muted font-mono">
                      {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-ink">₹{tx.amountFiat || '0.00'}</div>
                  <div className="text-[11px] text-[#A3B359] font-bold">+{tx.rewardAmount || '0'} STAR</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
