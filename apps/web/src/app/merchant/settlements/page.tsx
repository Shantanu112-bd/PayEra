"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Transaction } from "@cryptopay/types";
import { TopBar } from "../../../components/layout/TopBar";

function statusChip(status: string) {
  if (status === "CONFIRMED") return "bg-secondary-container text-primary";
  if (status === "FAILED") return "bg-error-container text-error";
  return "bg-surface-container text-on-surface-variant";
}

export default function SettlementsDashboard() {
  const { data: transactionsRes, isLoading } = useQuery({
    queryKey: ["merchant-settlements"],
    queryFn: () => cryptoPaySdk.transactions.listTransactions(),
  });

  const transactions = transactionsRes?.data || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/merchant" title="Settlements" />

      <div className="px-[20px] pt-1 space-y-4">
        <p className="text-[14px] text-on-surface-variant">Track your bank payouts and reconciliation status.</p>

        {isLoading ? (
          <div className="space-y-3">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container-high rounded-[20px] h-20" />
              ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px]">account_balance</span>
            <p className="text-[15px] font-semibold text-on-background">No settlements found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: Transaction) => {
              const settlement = tx.settlementInstruction;
              const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-IN") : "—";
              const amount = settlement ? `₹${(Number(settlement.amountPaise) / 100).toLocaleString("en-IN")}` : "—";
              const status = settlement?.status || "PENDING";

              return (
                <div
                  key={tx.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-[20px] p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-on-background">{amount}</p>
                      <p className="text-[12px] font-mono text-on-surface-variant truncate">
                        {tx.publicId || tx.id.slice(0, 8)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusChip(status)}`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-on-surface-variant pt-2 border-t border-outline-variant">
                    <span className="font-mono truncate">{tx.merchantUpiVpa || "—"}</span>
                    <span>{date}</span>
                  </div>
                  {settlement?.mockReference && (
                    <p className="text-[11px] font-mono text-on-surface-variant">Ref: {settlement.mockReference}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
