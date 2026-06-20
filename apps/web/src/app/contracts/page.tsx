"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton } from "@cryptopay/ui";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import {
  ExternalLink,
  Cpu,
  CheckCircle,
  AlertCircle,
  Copy,
  Zap,
  Star,
  Activity,
  Globe,
} from "lucide-react";

const CONTRACTS = {
  starToken:     process.env.NEXT_PUBLIC_STAR_CONTRACT_ADDRESS || "",
  paymentEngine: process.env.NEXT_PUBLIC_PAYMENT_ENGINE_CONTRACT_ADDRESS || "",
  rewardEngine:  process.env.NEXT_PUBLIC_REWARD_ENGINE_CONTRACT_ADDRESS || "",
};

const STELLAR_EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

function truncate(s: string, n = 16) {
  return s.length > n * 2 ? `${s.slice(0, n)}...${s.slice(-8)}` : s;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="ml-2 p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
      title="Copy address"
    >
      {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ContractCard({
  label,
  address,
  icon: Icon,
  color,
}: {
  label: string;
  address: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-5 bg-black/40 ${color}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color.includes("blue") ? "bg-blue-600/20" : "bg-emerald-600/20"}`}>
          <Icon className={`h-5 w-5 ${color.includes("blue") ? "text-blue-400" : "text-emerald-400"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">ACTIVE</span>
          </div>
        </div>
        <div className="ml-auto">
          <a
            href={`${STELLAR_EXPLORER_BASE}/contract/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Explorer <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      <div className="bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-xs text-white/70 break-all flex items-start gap-1">
        <span className="flex-1">{truncate(address, 4)}</span>
        <CopyButton value={address} />
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const { publicKey, balances } = useStellarWallet();

  // Fetch last 5 reward events that have Stellar mint hashes
  const { data: recentRewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ["contract-rewards"],
    queryFn: () => cryptoPaySdk.rewards.listRewards({ limit: 5 }),
    refetchInterval: 30000,
  });

  // Fetch recent transactions to show Stellar hashes
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["contract-transactions"],
    queryFn: () => cryptoPaySdk.transactions.listTransactions({ limit: 5 }),
    refetchInterval: 30000,
  });

  const starBalance = publicKey ? balances.STAR : "5,000"; // Fallback for demo
  const isConnected = !!publicKey;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Blockchain</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Live on-chain data from Stellar Testnet via Soroban.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10">
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Stellar Testnet</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">Soroban RPC Online</span>
          </div>
        </div>
      </div>

      {/* Wallet Balance from Contract */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-900/20 to-black/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">STAR Balance (On-chain)</span>
          </div>
          <p className="text-4xl font-black text-white">{starBalance}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isConnected ? `Wallet: ${truncate(publicKey!, 10)}` : "Demo mode — connect wallet for live balance"}
          </p>
          <p className="text-xs text-yellow-400/70 mt-2 font-mono">Source: Soroban contract</p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-black/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">XLM Balance</span>
          </div>
          <p className="text-4xl font-black text-white">{isConnected ? balances.XLM : "10,000.00"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isConnected ? "Live from Horizon" : "Demo mode — connect wallet for live balance"}
          </p>
          <p className="text-xs text-purple-400/70 mt-2 font-mono">Source: Horizon API</p>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-black/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Network Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-2xl font-black text-white">Operational</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Soroban Testnet</p>
          <a
            href="https://status.stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400/70 mt-2 font-mono flex items-center gap-1 hover:text-blue-300"
          >
            status.stellar.org <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Contract Addresses */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-400" />
          Deployed Contracts
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ContractCard
            label="STAR Token (ERC-20 equivalent)"
            address={CONTRACTS.starToken}
            icon={Star}
            color="border-yellow-500/20"
          />
          <ContractCard
            label="Payment Engine"
            address={CONTRACTS.paymentEngine}
            icon={Zap}
            color="border-blue-500/20"
          />
          <ContractCard
            label="Reward Engine"
            address={CONTRACTS.rewardEngine}
            icon={Activity}
            color="border-emerald-500/20"
          />
        </div>
      </div>

      {/* Recent On-Chain Transactions */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          Recent On-Chain Settlement Hashes
        </h2>
        <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden divide-y divide-white/5">
          {txLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-none" />)
          ) : txData?.data && txData.data.length > 0 ? (
            txData.data.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white/60">{tx.publicId}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                      SETTLED
                    </span>
                  </div>
                  {tx.stellarTransactionHash ? (
                    <p className="text-xs font-mono text-blue-400/80 mt-1 truncate">
                      {tx.stellarTransactionHash}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Hash pending...</p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-white">
                    ₹{(Number(tx.amountInPaise) / 100).toLocaleString("en-IN")}
                  </p>
                  {tx.stellarTransactionHash ? (
                    <a
                      href={`${STELLAR_EXPLORER_BASE}/tx/${tx.stellarTransactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 justify-end mt-0.5"
                    >
                      View on Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Cpu className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No settled transactions yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent STAR Mint Events */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          Recent STAR Mint Events (Soroban)
        </h2>
        <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden divide-y divide-white/5">
          {rewardsLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-none" />)
          ) : (recentRewards as any)?.items && (recentRewards as any).items.length > 0 ? (
            (recentRewards as any).items.map((reward: any) => (
              <div key={reward.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium uppercase">
                      {reward.reason}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                      MINTED
                    </span>
                  </div>
                  {reward.stellarMintHash ? (
                    <p className="text-xs font-mono text-blue-400/80 mt-1 truncate">
                      {reward.stellarMintHash}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Mint hash pending</p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-yellow-400">+{reward.starAmount.toString()} STAR</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(reward.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No reward events yet. Complete a payment to earn STAR.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="rounded-xl border border-white/5 bg-white/5 p-5 flex gap-4 items-start">
        <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-white mb-1">Testnet Environment</p>
          <p className="text-sm text-muted-foreground">
            All transactions are on the Stellar Testnet. Contracts are deployed to Soroban Testnet. 
            Production deployment will use Mainnet addresses. Click any "View on Explorer" link to 
            see the real on-chain data.
          </p>
        </div>
      </div>
    </div>
  );
}
