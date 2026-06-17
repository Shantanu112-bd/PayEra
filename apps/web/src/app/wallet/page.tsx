"use client";

import * as React from "react";
import { Plus, Copy, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { WalletCard, Skeleton, Button, EmptyState } from "@cryptopay/ui";
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

export default function WalletPage() {
  const { data: wallets, isLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  const { publicKey, balances, isWalletInstalled, connect } = useStellarWallet();
  const { isDemoMode, currentUserId } = useAppStore();
  const effectiveKey = isDemoMode ? currentUserId : publicKey;
  const shortAddress = effectiveKey ? effectiveKey.slice(0, 6) + "..." + effectiveKey.slice(-4) : "";

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
        <Button onClick={!effectiveKey ? connect : () => {}} variant="accent">
          <Plus className="mr-2 h-4 w-4" /> 
          {!effectiveKey ? "Connect Wallet →" : "Add Asset →"}
        </Button>
      </div>

      {!effectiveKey ? (
        <EmptyState 
          icon={<Plus className="h-6 w-6" />}
          title="No Wallets Connected" 
          description="Connect a Freighter wallet to start spending your crypto."
          action={<Button onClick={connect} variant="accent"><Plus className="mr-2 h-4 w-4" /> Connect Wallet →</Button>}
        />
      ) : (
        <>
          {/* Wallet Card */}
          <div className="card-white">
            <div className="flex items-center justify-between mb-4">
              <span className="border-[1.5px] border-ink rounded-[50px] px-3 py-1 text-xs font-semibold font-[family-name:var(--font-ibm-plex-mono)] uppercase tracking-wider">
                Stellar Testnet
              </span>
              <span className="flex items-center gap-2 text-sm text-ink font-[family-name:var(--font-ibm-plex-mono)]">
                <span className="status-dot-lime !w-[6px] !h-[6px]" style={{ position: 'relative' }} />
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
              <button className="btn-primary !py-2 !text-[12px]">
                <ExternalLink className="w-3 h-3" /> VIEW ON STELLAR EXPERT ↗
              </button>
            </div>
          </div>

          {/* Balances */}
          <SectionTag label="BALANCES" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { asset: "XLM", balance: balances.XLM || "42.3000", label: "Native asset", highlight: false },
              { asset: "USDC", balance: balances.USDC || "500.00", label: "Circle", highlight: false },
              { asset: "STAR", balance: "2,500", label: "Your rewards", highlight: true },
            ].map((item) => (
              <div key={item.asset} className={`card-white ${item.highlight ? "!bg-lime" : ""}`}>
                <p className="text-xs text-muted uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)] mb-2">{item.asset}</p>
                <p className="text-3xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink">{item.balance}</p>
                <p className="text-xs text-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Network Status */}
          <div className="card-white flex items-center gap-3">
            <span className="status-dot-lime" style={{ position: 'relative' }} />
            <span className="font-[family-name:var(--font-ibm-plex-mono)] text-sm text-ink">
              Stellar Testnet — Connected
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}
