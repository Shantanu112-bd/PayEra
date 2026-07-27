"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import type { RampStatus, RampType } from "@cryptopay/sdk";
import { TopBar } from "../../../components/layout/TopBar";

// R3 — read-only surface for the user's fiat ramp (deposit / withdrawal)
// history, distinct from the payment history at /history. Reads through the
// SDK ramps client. No mutations are performed here.

const STATUS_STYLE: Record<RampStatus, string> = {
  INITIATED: "bg-surface-container text-on-surface-variant",
  PENDING_USER_TRANSFER: "bg-secondary-container text-on-surface",
  PENDING_ANCHOR: "bg-secondary-container text-on-surface",
  PENDING_STELLAR: "bg-secondary-container text-on-surface",
  PENDING_EXTERNAL: "bg-secondary-container text-on-surface",
  COMPLETED: "bg-primary-container text-on-primary-container",
  REFUNDED: "bg-surface-container text-on-surface-variant",
  EXPIRED: "bg-error-container text-error",
  ERROR: "bg-error-container text-error",
};

function label(status: RampStatus) {
  return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function typeLabel(type: RampType) {
  return type === "ONRAMP" ? "Deposit" : "Withdrawal";
}

export default function RampActivityPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ramp-history"],
    queryFn: () => cryptoPaySdk.ramps.history({ limit: 50 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar title="Deposits & Withdrawals" backHref="/profile" />

      <div className="px-[20px] pt-1 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse bg-surface-container rounded-[20px]" />
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-error-container rounded-[20px] p-4 text-sm text-error">
            Couldn&apos;t load your ramp activity. Please try again later.
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">swap_horiz</span>
            <p className="text-on-surface-variant text-sm">No deposits or withdrawals yet</p>
          </div>
        )}

        {items.map((r) => (
          <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-[20px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">
                {r.type === "ONRAMP" ? "south_west" : "north_east"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-on-background">{typeLabel(r.type)}</p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status]}`}>
                  {label(r.status)}
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant">
                {new Date(r.createdAt).toLocaleString()} · {r.provider}
              </p>
              {r.referenceNumber && (
                <p className="text-[12px] font-mono text-on-surface-variant truncate">Ref: {r.referenceNumber}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[14px] font-bold text-on-background">
                {(r.type === "ONRAMP" ? r.amountIn : r.amountOut) ?? "—"} {r.assetCode}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
