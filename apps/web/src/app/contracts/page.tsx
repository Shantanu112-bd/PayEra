"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import { TopBar } from "../../components/layout/TopBar";

const CONTRACTS = [
  { label: "STAR Token", icon: "star", address: process.env.NEXT_PUBLIC_STAR_CONTRACT_ADDRESS || "" },
  { label: "Payment Engine", icon: "bolt", address: process.env.NEXT_PUBLIC_PAYMENT_ENGINE_CONTRACT_ADDRESS || "" },
  { label: "Reward Engine", icon: "monitoring", address: process.env.NEXT_PUBLIC_REWARD_ENGINE_CONTRACT_ADDRESS || "" },
];

const EXPLORER = "https://stellar.expert/explorer/testnet";

function truncate(s: string, n = 8) {
  return s && s.length > n * 2 ? `${s.slice(0, n)}…${s.slice(-6)}` : s;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant active:bg-surface-container transition-colors shrink-0"
    >
      <span className="material-symbols-outlined text-[18px]">{copied ? "check" : "content_copy"}</span>
    </button>
  );
}

export default function ContractsPage() {
  const { publicKey, balances } = useStellarWallet();
  const isConnected = !!publicKey;

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ["contract-rewards"],
    queryFn: () => cryptoPaySdk.rewards.listRewards({ limit: 5 }),
    refetchInterval: 30000,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["contract-transactions"],
    queryFn: () => cryptoPaySdk.transactions.listTransactions({ limit: 5 }),
    refetchInterval: 30000,
  });

  const transactions: any[] = (txData as any)?.data ?? [];
  const rewards: any[] = (rewardsData as any)?.data ?? [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar title="Blockchain" />

      <div className="px-[20px] space-y-5 pt-1">
        {/* Network status */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-[16px] px-3 py-2.5">
            <span className="material-symbols-outlined text-primary text-[18px]">public</span>
            <span className="text-[12px] font-semibold text-on-background">Stellar Testnet</span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-[16px] px-3 py-2.5">
            <span className="status-dot" />
            <span className="text-[12px] font-semibold text-on-background">Soroban Online</span>
          </div>
        </div>

        {/* Balances */}
        <div className="rewards-gradient rounded-[24px] p-6 text-white space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium opacity-80">STAR Balance (On-chain)</p>
            <span className="material-symbols-outlined text-[20px]">star</span>
          </div>
          <p className="text-[40px] font-bold leading-none">{isConnected ? balances.STAR : "—"}</p>
          <div className="flex items-center gap-4 text-[13px] pt-3 border-t border-white/20">
            <span className="opacity-90">{isConnected ? `${balances.XLM} XLM` : "Connect wallet"}</span>
            {isConnected && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="font-mono opacity-90">{truncate(publicKey!, 6)}</span>
              </>
            )}
          </div>
        </div>

        {/* Deployed contracts */}
        <div>
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Deployed Contracts</p>
          <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
            {CONTRACTS.map((c) => (
              <div key={c.label} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">{c.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-on-background">{c.label}</p>
                    <span className="status-dot" />
                  </div>
                  <p className="text-[12px] font-mono text-on-surface-variant truncate">{c.address ? truncate(c.address) : "not configured"}</p>
                </div>
                {c.address && (
                  <>
                    <CopyButton value={c.address} />
                    <a
                      href={`${EXPLORER}/contract/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant active:bg-surface-container transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent settlement hashes */}
        <div>
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Recent Settlements</p>
          <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
            {txLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4"><div className="animate-pulse bg-surface-container-high rounded-[12px] h-10 w-full" /></div>
              ))
            ) : transactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px]">receipt_long</span>
                <p className="text-[14px]">No settled transactions yet</p>
              </div>
            ) : (
              transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-mono text-on-surface-variant truncate">{tx.publicId}</p>
                    {tx.stellarTransactionHash ? (
                      <a
                        href={`${EXPLORER}/tx/${tx.stellarTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-mono text-primary truncate block"
                      >
                        {truncate(tx.stellarTransactionHash)}
                      </a>
                    ) : (
                      <p className="text-[12px] text-on-surface-variant">Hash pending…</p>
                    )}
                  </div>
                  <span className="text-[14px] font-bold text-on-background shrink-0">
                    ₹{(Number(tx.amountInPaise || 0) / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent STAR mints */}
        <div>
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Recent STAR Mints</p>
          <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
            {rewardsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4"><div className="animate-pulse bg-surface-container-high rounded-[12px] h-10 w-full" /></div>
              ))
            ) : rewards.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px]">star_border</span>
                <p className="text-[14px]">No reward events yet</p>
              </div>
            ) : (
              rewards.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">star</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-on-background uppercase">{r.reason}</p>
                    {r.stellarMintHash ? (
                      <p className="text-[12px] font-mono text-primary truncate">{truncate(r.stellarMintHash)}</p>
                    ) : (
                      <p className="text-[12px] text-on-surface-variant">Mint hash pending</p>
                    )}
                  </div>
                  <span className="text-[14px] font-bold text-primary shrink-0">+{String(r.starAmount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-secondary-container rounded-[16px] p-4 flex gap-3">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0">info</span>
          <p className="text-[13px] text-on-surface-variant">
            All transactions run on Stellar Testnet. Contracts are deployed to Soroban Testnet. Production will use Mainnet addresses.
          </p>
        </div>
      </div>
    </div>
  );
}
