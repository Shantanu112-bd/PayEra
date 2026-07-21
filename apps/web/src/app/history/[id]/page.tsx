"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../components/layout/TopBar";

const STATUS_ORDER = [
  "CREATED",
  "QUOTED",
  "AUTHORIZED",
  "CONVERTING",
  "ROUTING_STELLAR",
  "SETTLING",
  "REWARDING",
  "COMPLETED",
] as const;

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Created",
  QUOTED: "Quoted",
  AUTHORIZED: "Authorized",
  CONVERTING: "Converting",
  ROUTING_STELLAR: "Routing on Stellar",
  SETTLING: "Settling UPI",
  REWARDING: "Minting STAR",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

const ACTIVE = new Set(["CREATED", "QUOTED", "AUTHORIZED", "CONVERTING", "ROUTING_STELLAR", "SETTLING", "REWARDING"]);

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-on-surface-variant">{label}</span>
      <span className="text-[13px] font-medium text-on-background text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: tx, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => cryptoPaySdk.transactions.getTransaction(id),
    refetchInterval: (query) => (ACTIVE.has((query.state.data as any)?.status) ? 2500 : false),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cryptoPaySdk.transactions.cancelTransaction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transaction", id] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/history" title="Transaction" />
        <div className="px-[20px] space-y-3 pt-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse bg-surface-container-high rounded-[16px] h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/history" title="Transaction" />
        <div className="px-[20px] pt-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px]">search_off</span>
          <p className="text-[14px]">Transaction not found</p>
        </div>
      </div>
    );
  }

  const status = tx.status as string;
  const isFailed = status === "FAILED" || status === "CANCELLED";
  const currentIndex = STATUS_ORDER.indexOf(status as any);
  const isCancellable = ["CREATED", "QUOTED", "AUTHORIZED"].includes(status);
  const amount = (Number(tx.amountInPaise || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/history" title="Transaction" />

      <div className="px-[20px] space-y-5 pt-1">
        {/* Amount hero */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-6 text-center">
          <p className="text-[13px] text-on-surface-variant">Amount</p>
          <p className="text-[36px] font-bold text-on-background leading-tight">₹{amount}</p>
          <p className="text-[12px] font-mono text-on-surface-variant mt-1">{tx.publicId}</p>
          <span
            className={`inline-block mt-3 text-[12px] font-semibold px-3 py-1 rounded-full ${
              isFailed ? "bg-error-container text-error" : status === "COMPLETED" ? "bg-secondary-container text-primary" : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {STATUS_LABELS[status] || status}
          </span>
        </div>

        {/* Progress timeline */}
        {!isFailed && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5">
            <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Progress</p>
            <div className="space-y-0">
              {STATUS_ORDER.map((step, i) => {
                const done = i < currentIndex;
                const current = i === currentIndex;
                const last = i === STATUS_ORDER.length - 1;
                return (
                  <div key={step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          done ? "bg-primary text-on-primary" : current ? "bg-secondary-container text-primary" : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {done ? (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        ) : current ? (
                          <span className="status-dot" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                        )}
                      </div>
                      {!last && <div className={`w-0.5 flex-1 min-h-[20px] ${done ? "bg-primary" : "bg-outline-variant"}`} />}
                    </div>
                    <div className={`pb-4 ${current ? "text-on-background font-semibold" : done ? "text-on-background" : "text-on-surface-variant"}`}>
                      <p className="text-[14px]">{STATUS_LABELS[step]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isFailed && tx.failureMessage && (
          <div className="bg-error-container rounded-[24px] p-5">
            <p className="text-[13px] font-semibold text-error mb-1">Failure reason</p>
            <p className="text-[13px] text-error/90">{tx.failureMessage}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] px-5 py-3 divide-y divide-outline-variant">
          <Row label="Merchant" value={tx.merchantUpiVpa || tx.merchantId} />
          <Row label="Rail" value={tx.rail} />
          <Row label="Asset" value={tx.assetIn} />
          <Row
            label="Network fee"
            value={tx.networkFeePaise ? `₹${(Number(tx.networkFeePaise) / 100).toFixed(2)}` : "—"}
          />
          <Row label="Created" value={new Date(tx.createdAt).toLocaleString()} />
          {tx.stellarTransactionHash && (
            <Row
              label="Stellar tx"
              value={
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${tx.stellarTransactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  View
                </a>
              }
            />
          )}
        </div>

        {isCancellable && (
          <button
            onClick={() => {
              if (window.confirm("Cancel this transaction?")) cancelMutation.mutate();
            }}
            disabled={cancelMutation.isPending}
            className="w-full py-3.5 rounded-full bg-error-container text-error font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {cancelMutation.isPending ? "Cancelling…" : "Cancel Transaction"}
          </button>
        )}
      </div>
    </div>
  );
}
