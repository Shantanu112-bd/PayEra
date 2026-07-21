"use client";

import * as React from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../components/layout/TopBar";

const FILTERS = ["ALL", "COMPLETED", "SETTLING", "REWARDING", "AUTHORIZED", "FAILED"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_LABELS: Record<string, string> = {
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

function statusChip(status: string) {
  if (status === "COMPLETED") return "bg-secondary-container text-primary";
  if (status === "FAILED" || status === "CANCELLED") return "bg-error-container text-error";
  return "bg-surface-container text-on-surface-variant";
}

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = React.useState<Filter>("ALL");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["history-transactions", activeFilter],
    queryFn: ({ pageParam = 1 }) => {
      const params: { limit: number; page: number; status?: string } = { limit: 20, page: pageParam };
      if (activeFilter !== "ALL") params.status = activeFilter;
      return cryptoPaySdk.transactions.listTransactions(params);
    },
    getNextPageParam: (lastPage: any) =>
      lastPage?.meta && lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const transactions: any[] = data?.pages.flatMap((p: any) => p.data ?? []) ?? [];
  const loading = isLoading && transactions.length === 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar
        title="History"
        actions={
          <Link
            href="/transactions/tax-report"
            className="text-[12px] font-semibold text-primary bg-secondary-container px-3 py-1.5 rounded-full"
          >
            Tax Report
          </Link>
        }
      />

      <div className="px-[20px] pt-1 space-y-4">
        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-[20px] px-[20px]">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                activeFilter === f
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant"
              }`}
            >
              {f === "ALL" ? "All" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="p-4">
                <div className="animate-pulse bg-surface-container-high rounded-[12px] h-12 w-full" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px]">receipt_long</span>
              <p className="text-[14px]">
                {activeFilter === "ALL" ? "No transactions yet" : `No ${(STATUS_LABELS[activeFilter] ?? activeFilter).toLowerCase()} transactions`}
              </p>
              <Link href="/pay" className="mt-2 text-[13px] font-semibold text-primary">Scan &amp; Pay</Link>
            </div>
          ) : (
            transactions.map((tx: any) => (
              <Link key={tx.id} href={`/history/${tx.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-container transition-colors">
                <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-on-background truncate">
                    {tx.merchantUpiVpa || tx.publicId || "Payment"}
                  </p>
                  <p className="text-[12px] text-on-surface-variant">
                    {new Date(tx.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[14px] font-bold text-on-background">
                    ₹{(Number(tx.amountInPaise || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusChip(tx.status)}`}>
                    {STATUS_LABELS[tx.status] || tx.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {hasNextPage && (
          <div className="text-center pt-1">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-3 bg-surface-container-lowest border border-outline-variant rounded-full text-[14px] font-semibold text-on-background disabled:opacity-50"
            >
              {isFetchingNextPage ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
