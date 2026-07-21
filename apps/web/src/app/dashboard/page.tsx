"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import { useAppStore } from "../../lib/store";
import { TopBar } from "../../components/layout/TopBar";

const QUICK_ACTIONS = [
  { icon: "qr_code_scanner", label: "Scan & Pay", href: "/pay" },
  { icon: "arrow_downward", label: "Deposit", href: "/wallet/onramp" },
  { icon: "arrow_upward", label: "Withdraw", href: "/wallet/offramp" },
  { icon: "receipt_long", label: "History", href: "/history" },
];

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-secondary-container text-primary",
  FAILED: "bg-error-container text-error",
  CANCELLED: "bg-error-container text-error",
};

function statusChip(status: string) {
  return STATUS_STYLES[status] ?? "bg-surface-container text-on-surface-variant";
}

export default function DashboardPage() {
  const { balances, publicKey } = useStellarWallet();
  const { currentUserDisplayName } = useAppStore();

  const { data: rewards } = useQuery({
    queryKey: ["rewards-balance"],
    queryFn: () => cryptoPaySdk.rewards.getRewards(),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["dashboard-transactions"],
    queryFn: () => cryptoPaySdk.transactions.listTransactions({ limit: 5 }),
  });

  const transactions: any[] = (txData as any)?.data ?? [];
  const starBalance = rewards?.lifetimeStar ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar
        title={`Hi, ${currentUserDisplayName || "there"}`}
        actions={
          <Link
            href="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </Link>
        }
      />

      <div className="px-[20px] space-y-5 pt-1">
        {/* Balance hero */}
        <div className="rewards-gradient rounded-[24px] p-6 text-white space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium opacity-80">Total Balance</p>
            <span className="text-[11px] font-semibold bg-white/15 px-2.5 py-1 rounded-full">
              Stellar
            </span>
          </div>
          <div>
            <p className="text-[40px] font-bold leading-none">
              {balances?.XLM ?? "0.00"} <span className="text-[20px] font-medium opacity-80">XLM</span>
            </p>
          </div>
          <div className="flex items-center gap-4 text-[13px] pt-3 border-t border-white/20">
            <span className="opacity-90">{balances?.USDC ?? "0.00"} USDC</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="font-semibold">{String(starBalance)} STAR</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-[20px] py-4 active:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[24px]">{a.icon}</span>
              <span className="text-[11px] font-semibold text-on-background text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide">Recent Activity</p>
            <Link href="/history" className="text-[13px] font-semibold text-primary">See all</Link>
          </div>
          <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
            {txLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="animate-pulse bg-surface-container-high rounded-[12px] h-10 w-full" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px]">receipt_long</span>
                <p className="text-[14px]">No transactions yet</p>
                <Link href="/pay" className="mt-2 text-[13px] font-semibold text-primary">Scan &amp; Pay</Link>
              </div>
            ) : (
              transactions.map((tx: any) => (
                <Link key={tx.id} href={`/history/${tx.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-container transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-on-background truncate">
                      {tx.merchantUpiVpa || tx.publicId || "Payment"}
                    </p>
                    <p className="text-[12px] text-on-surface-variant">
                      {new Date(tx.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
