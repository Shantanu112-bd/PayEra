"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useMerchant } from "../../../hooks/useMerchant";
import { TopBar } from "../../../components/layout/TopBar";

const FILTERS = ["ALL", "COMPLETED", "SETTLING", "FAILED"] as const;
type Filter = (typeof FILTERS)[number];

function statusChip(status: string) {
  if (status === "COMPLETED") return "bg-secondary-container text-primary";
  if (status === "FAILED" || status === "CANCELLED") return "bg-error-container text-error";
  return "bg-surface-container text-on-surface-variant";
}

export default function MerchantTransactionsPage() {
  const { merchantId, isLoading: merchantLoading } = useMerchant();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-transactions-all", merchantId],
    queryFn: () => cryptoPaySdk.merchants.getMerchantTransactions(merchantId!, { limit: 50 }),
    enabled: !!merchantId,
  });

  const all: any[] = (data as any)?.data ?? [];
  const transactions = all.filter((tx) => {
    if (filter !== "ALL" && tx.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (tx.publicId || "").toLowerCase().includes(q) ||
        (tx.status || "").toLowerCase().includes(q) ||
        (tx.assetIn || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (merchantLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="Transactions" />
        <div className="px-[20px] space-y-3 pt-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse bg-surface-container-high rounded-[16px] h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (!merchantId) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="Transactions" />
        <div className="px-[20px] pt-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px]">storefront</span>
          <p className="text-[14px]">No merchant account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/merchant" title="Transactions" />

      <div className="px-[20px] pt-1 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-[16px] px-4 py-2.5">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, status or asset"
            className="flex-1 bg-transparent text-[14px] text-on-background outline-none placeholder:text-on-surface-variant"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-[20px] px-[20px]">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                filter === f
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="p-4">
                <div className="animate-pulse bg-surface-container-high rounded-[12px] h-12 w-full" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px]">receipt_long</span>
              <p className="text-[14px]">No transactions found</p>
            </div>
          ) : (
            transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">south_west</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-on-background truncate">{tx.publicId || "Payment"}</p>
                  <p className="text-[12px] text-on-surface-variant">
                    {new Date(tx.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[14px] font-bold text-on-background">
                    ₹{(Number(tx.amountInPaise || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusChip(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
