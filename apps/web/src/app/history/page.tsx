"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TransactionCard, Skeleton, EmptyState, Button } from "@cryptopay/ui";
import { QrCode } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

export default function HistoryPage() {
  const [activeTab, setActiveTab] = React.useState("ALL");
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => cryptoPaySdk.transactions.listTransactions({ limit: 50 }),
  });

  const tabs = ["ALL", "Payments", "Rewards", "Pending"];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <SectionTag label="HISTORY" />
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">Transaction History</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="pill-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pill-tab ${activeTab === tab ? "pill-tab-active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Month grouping */}
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-muted font-[family-name:var(--font-ibm-plex-mono)] mb-3">
            JUNE 2025
          </p>
          <div className="h-px bg-ink/10 mb-4" />
        </div>

        {/* Transaction rows */}
        <div className="border-[1.5px] border-ink rounded-[20px] overflow-hidden bg-white">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[12px]" />)}
            </div>
          ) : (transactions as any)?.items?.length === 0 ? (
            <EmptyState 
              title="No Transactions Found" 
              description="You haven't made any payments yet. Scan a QR code to make your first payment."
              action={
                <Link href="/pay">
                  <Button variant="accent">
                    <QrCode className="mr-2 h-4 w-4" /> SCAN & PAY →
                  </Button>
                </Link>
              }
            />
          ) : (
            ((transactions as any)?.items ?? []).map((tx: any) => (
              <TransactionCard 
                key={tx.id} 
                transaction={tx} 
                isOutbound={tx.type === "CRYPTO_TO_FIAT"} 
              />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
