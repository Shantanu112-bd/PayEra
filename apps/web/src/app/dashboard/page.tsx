"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton } from "@cryptopay/ui";
import { Check, ExternalLink, Star, ArrowRight, Zap, QrCode, Wallet, Gift, User, Settings, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import { useAppStore } from "../../lib/store";
import { motion } from "framer-motion";
import { StarBalance } from "../../components/stellar/StarBalance";
import { TransactionStatusDisplay } from "../../components/stellar/TransactionStatus";

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
  const { publicKey, balances } = useStellarWallet();
  const { currentUserDisplayName } = useAppStore();

  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => cryptoPaySdk.rewards.getRewards(),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => cryptoPaySdk.transactions.listTransactions({ limit: 5 }),
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["active-campaigns"],
    queryFn: () => cryptoPaySdk.campaigns.listCampaigns({ status: "ACTIVE", limit: 3 }),
  });

  const xlmBalance = balances?.XLM || "0.00";
  const usdcBalance = balances?.USDC || "0.00";
  const starBalance = rewards?.mintedStar?.toString() || "0";

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

      {/* Balance Card - Mobile First */}
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
            <span className="text-[#C5D483] font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {starBalance} STAR
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/wallet/onramp">
            <button className="flex-1 border-[1.5px] border-[#1A1A1A] rounded-full py-2 text-sm font-semibold hover:bg-ink/5 transition-colors">
              ADD USDC
            </button>
          </Link>
          <Link href="/wallet/offramp">
            <button className="flex-1 border-[1.5px] border-[#1A1A1A] rounded-full py-2 text-sm font-semibold hover:bg-ink/5 transition-colors">
              CASH OUT
            </button>
          </Link>
        </div>
      </div>

      {/* Floating Scan Button */}
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

      {/* On-Chain STAR Balance - Uses the Stellar component */}
      <div className="space-y-4">
        <SectionTag label="ON-CHAIN" />
        <StarBalance />
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <SectionTag label="ACTIONS" />
        <div className="grid grid-cols-2 gap-3">
          <Link href="/pay" className="block">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white border-[1.5px] border-ink rounded-[16px] p-4 text-center hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink mx-auto mb-2">
                <QrCode className="w-5 h-5 text-ink" />
              </div>
              <div className="font-bold text-sm text-ink">Scan & Pay</div>
              <div className="text-xs text-muted font-mono">Pay at any UPI QR</div>
            </motion.div>
          </Link>
          <Link href="/rewards" className="block">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white border-[1.5px] border-ink rounded-[16px] p-4 text-center hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink mx-auto mb-2">
                <Gift className="w-5 h-5 text-[#A3B359]" />
              </div>
              <div className="font-bold text-sm text-ink">Rewards</div>
              <div className="text-xs text-muted font-mono">{starBalance} STAR earned</div>
            </motion.div>
          </Link>
          <Link href="/wallet" className="block">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white border-[1.5px] border-ink rounded-[16px] p-4 text-center hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink mx-auto mb-2">
                <Wallet className="w-5 h-5 text-ink" />
              </div>
              <div className="font-bold text-sm text-ink">Wallet</div>
              <div className="text-xs text-muted font-mono">{xlmBalance} XLM · {usdcBalance} USDC</div>
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
              <div className="text-xs text-muted font-mono">View all transactions</div>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <SectionTag label="RECENT" />
        <div className="space-y-3">
          {txLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[16px] border-[1.5px] border-ink/20" />)
          ) : (transactions as any)?.data?.length === 0 ? (
            <div className="text-center p-6 border-[1.5px] border-ink/10 rounded-[16px] bg-white text-muted font-mono text-sm">
              No recent transactions
            </div>
          ) : (
            ((transactions as any)?.data ?? []).map((tx: any) => (
              <Link key={tx.id} href={`/history?tx=${tx.id}`} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-4 bg-white rounded-[16px] border-[1.5px] border-ink hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink">
                      <span className="font-mono font-bold text-sm text-ink">
                        {tx.merchantName?.substring(0, 2).toUpperCase() || 'M'}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-ink">{tx.merchantName || 'Merchant'}</div>
                      <div className="text-xs text-muted font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-ink">₹{tx.amountFiat || '0.00'}</div>
                    <div className="text-[11px] text-[#A3B359] font-bold">+{tx.rewardAmount || '0'} STAR</div>
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="space-y-4">
        <SectionTag label="CAMPAIGNS" />
        <div className="space-y-3">
          {campaignsLoading ? (
            Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[16px] border-[1.5px] border-ink/20" />)
          ) : (campaigns as any)?.data?.length === 0 ? (
            <div className="text-center p-6 border-[1.5px] border-ink/10 rounded-[16px] bg-white text-muted font-mono text-sm">
              No active campaigns
            </div>
          ) : (
            ((campaigns as any)?.data ?? []).map((campaign: any) => (
              <Link key={campaign.id} href={`/rewards/campaigns/${campaign.id}`} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 bg-white rounded-[16px] border-[1.5px] border-ink hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm text-ink">{campaign.name}</div>
                    <span className="text-[10px] font-mono bg-[#F5F2EC] border border-ink px-2 py-1 rounded-full text-ink">
                      {campaign.multiplier}x STAR
                    </span>
                  </div>
                  <div className="text-xs text-muted mb-2">{campaign.description}</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
                    <span>Ends {new Date(campaign.endDate).toLocaleDateString()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Contract Status - Real addresses from env */}
      <div className="space-y-4 mt-8">
        <SectionTag label="CONTRACTS" />
        <div className="space-y-3">
          {[
            { name: "STAR Token", address: process.env.NEXT_PUBLIC_STAR_CONTRACT_ADDRESS || "CCW3...X9P2", verified: true },
            { name: "Reward Engine", address: process.env.NEXT_PUBLIC_REWARD_ENGINE_CONTRACT_ADDRESS || "CBT5...3L1M", verified: true },
            { name: "Payment Engine", address: process.env.NEXT_PUBLIC_PAYMENT_ENGINE_CONTRACT_ADDRESS || "CDA8...K4N9", verified: true },
            { name: "Merchant Registry", address: process.env.NEXT_PUBLIC_MERCHANT_REGISTRY_CONTRACT_ADDRESS || "CAIR...O36R", verified: true },
          ].map(contract => (
            <div key={contract.name} className="flex items-center justify-between p-4 bg-white rounded-[16px] border-[1.5px] border-ink">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink">
                  <Check className="w-4 h-4 text-ink" />
                </div>
                <div>
                  <div className="font-bold text-sm text-ink mb-0.5">{contract.name}</div>
                  <Link
                    href={`https://stellar.expert/explorer/testnet/contract/${contract.address.replace("...", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 underline font-mono"
                  >
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