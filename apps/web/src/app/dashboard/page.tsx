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
      <h1 className="text-[16px] font-mono text-muted">
        Good morning, {currentUserDisplayName || 'there'}
      </h1>

      {/* Balance Card */}
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

        <div className="flex gap-3">
          <button className="flex-1 border-[1.5px] border-[#1A1A1A] rounded-full py-2 text-sm font-semibold hover:bg-ink/5 transition-colors">
            ADD USDC
          </button>
          <button className="flex-1 border-[1.5px] border-[#1A1A1A] rounded-full py-2 text-sm font-semibold hover:bg-ink/5 transition-colors">
            CASH OUT
          </button>
        </div>
      </div>

      {/* Floating Scan Button (Sticky relative to content flow) */}
      <div className="sticky top-20 z-10 flex justify-center -mt-2 mb-8">
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/pay')}
          className="bg-[#1A1A1A] text-white rounded-full py-4 px-6 w-[80%] flex items-center justify-center gap-3 shadow-xl"
        >
          <span className="text-lg">⬤</span>
          <span className="font-bold tracking-wide">SCAN & PAY</span>
        </motion.button>
      </div>

      {/* Recent Activity */}
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

      {/* Contract Status */}
      <div className="space-y-4 mt-8">
        <SectionTag label="ON-CHAIN" />
        <div className="space-y-3">
          {[
            { name: "STAR Token", address: "CCW3...X9P2" },
            { name: "Reward Engine", address: "CBT5...3L1M" },
            { name: "Payment Engine", address: "CDA8...K4N9" },
          ].map(contract => (
             <div key={contract.name} className="flex items-center justify-between p-4 bg-white rounded-[16px] border-[1.5px] border-ink">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink">
                    <Check className="w-4 h-4 text-ink" />
                  </div>
                  <div>
                     <div className="font-bold text-sm text-ink mb-0.5">{contract.name}</div>
                     <Link href={`https://stellar.expert/explorer/testnet/contract/${contract.address.replace("...", "")}`} className="text-[11px] text-blue-600 underline font-mono">
                       {contract.address}
                     </Link>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F2EC] rounded-full border border-ink/10">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#A3B359] animate-pulse" />
                   <span className="text-[9px] font-bold tracking-wider text-ink">ACTIVE</span>
                </div>
             </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
