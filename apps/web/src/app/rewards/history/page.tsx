"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../components/layout/TopBar";

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "MINTED"
      ? "bg-secondary-container text-primary"
      : status === "PENDING"
      ? "bg-surface-container text-on-surface-variant"
      : "bg-error-container text-error";
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

export default function RewardHistoryPage() {
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["rewards-history", page],
    queryFn: () => cryptoPaySdk.rewards.listRewards({ page, limit }),
  });

  const rewards: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / limit) : 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/rewards" title="Reward History" />

      <div className="px-[20px] pt-2">
        <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="p-4">
                <div className="animate-pulse bg-surface-container-high rounded-[10px] h-10 w-full" />
              </div>
            ))
          ) : rewards.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px]">history</span>
              <p className="text-[14px]">No reward history</p>
            </div>
          ) : (
            rewards.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[18px]">star</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-on-background truncate">{r.reason}</p>
                  <p className="text-[12px] text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[14px] font-bold text-primary">+{r.starAmount} STAR</span>
                  <StatusChip status={r.status} />
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="text-[13px] text-on-surface-variant">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
