"use client";

import * as React from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton, EmptyState, Button } from "@cryptopay/ui";
import { QrCode, RefreshCw, ChevronRight, Filter } from "lucide-react";
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

type TransactionStatus =
  | "CREATED"
  | "QUOTED"
  | "AUTHORIZED"
  | "CONVERTING"
  | "ROUTING_STELLAR"
  | "SETTLING"
  | "REWARDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

const STATUS_CONFIG: Record<TransactionStatus, { label: string; color: string; bgColor: string }> = {
  CREATED: { label: "Created", color: "text-gray-500", bgColor: "bg-gray-100" },
  QUOTED: { label: "Quoted", color: "text-blue-500", bgColor: "bg-blue-50" },
  AUTHORIZED: { label: "Authorized", color: "text-blue-600", bgColor: "bg-blue-100" },
  CONVERTING: { label: "Converting", color: "text-yellow-500", bgColor: "bg-yellow-50" },
  ROUTING_STELLAR: { label: "Routing Stellar", color: "text-purple-500", bgColor: "bg-purple-50" },
  SETTLING: { label: "Settling UPI", color: "text-orange-500", bgColor: "bg-orange-50" },
  REWARDING: { label: "Minting STAR", color: "text-green-500", bgColor: "bg-green-50" },
  COMPLETED: { label: "Completed", color: "text-[#A3B359]", bgColor: "bg-[#F0F2E8]" },
  FAILED: { label: "Failed", color: "text-red-500", bgColor: "bg-red-50" },
  CANCELLED: { label: "Cancelled", color: "text-gray-500", bgColor: "bg-gray-100" },
};

const FILTERS = ["ALL", "COMPLETED", "SETTLING", "REWARDING", "ROUTING_STELLAR", "CONVERTING", "AUTHORIZED", "QUOTED", "CREATED", "FAILED"] as const;
type Filter = typeof FILTERS[number];

const STATUS_LABELS: Record<TransactionStatus, string> = {
  CREATED: "Created",
  QUOTED: "Quoted",
  AUTHORIZED: "Authorized",
  CONVERTING: "Converting",
  ROUTING_STELLAR: "Routing",
  SETTLING: "Settling",
  REWARDING: "Rewarding",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = React.useState<Filter>("ALL");

  const { data, isLoading: isLoadingInitial, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["transactions", activeFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params: { limit: number; page: number; status?: string } = {
        limit: 20,
        page: pageParam,
      };
      if (activeFilter !== "ALL") {
        params.status = activeFilter;
      }
      return cryptoPaySdk.transactions.listTransactions(params);
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const transactions = data?.pages.flatMap(p => p.data) ?? [];
  const isLoading = isLoadingInitial && transactions.length === 0;

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
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border-[1.5px] border-ink rounded-full text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`pill-tab whitespace-nowrap ${activeFilter === filter ? "pill-tab-active" : ""}`}
          >
            {filter === "ALL" ? "All" : STATUS_LABELS[filter as TransactionStatus]}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[16px] border-[1.5px] border-ink/20" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center p-12 border-[1.5px] border-ink/10 rounded-[16px] bg-white text-muted font-mono">
          {activeFilter !== "ALL" ? `No ${STATUS_LABELS[activeFilter as TransactionStatus].toLowerCase()} transactions` : "No transactions yet"}
          <Link href="/pay" className="block mt-4">
            <Button variant="accent">
              <QrCode className="mr-2 h-4 w-4" /> SCAN & PAY →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx: any) => (
            <Link key={tx.id} href={`/history?tx=${tx.id}`} className="block">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-4 bg-white rounded-[16px] border-[1.5px] border-ink hover:border-[#C5D483] hover:bg-[#F5F2EC] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-[#F5F2EC] flex items-center justify-center border-[1.5px] border-ink flex-shrink-0">
                    <span className="font-mono font-bold text-sm text-ink">
                      {tx.merchantName?.substring(0, 2).toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-ink truncate">{tx.merchantName || 'Merchant'}</div>
                    <div className="text-xs text-muted font-mono">
                      {new Date(tx.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {tx.publicId && (
                      <div className="text-[10px] font-mono text-muted mt-0.5">{tx.publicId}</div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="font-bold text-sm text-ink">₹{Number(tx.amountInPaise || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-[11px] text-[#A3B359] font-bold">+{tx.rewardAmount || "0"} STAR</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border-[1.5px] ${STATUS_CONFIG[tx.status as TransactionStatus]?.bgColor || "bg-gray-100"} border-gray-300 ${STATUS_CONFIG[tx.status as TransactionStatus]?.color || "text-gray-500"}`}>
                    {STATUS_LABELS[tx.status as TransactionStatus] || tx.status}
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}

          {/* Load More */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-3 border-[1.5px] border-ink rounded-full font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}