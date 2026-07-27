"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useWallet } from "@/components/app/WalletProvider";
import { sdk } from "@/lib/sdk";
import {
  Card,
  PageTitle,
  ConnectPrompt,
  Spinner,
  EmptyState,
  StatusPill,
} from "@/components/app/ui";
import { formatUsd } from "@/lib/format";
import type { Transaction } from "@cryptopay/types";
import type { RampTransaction } from "@cryptopay/sdk";

type Tab = "payments" | "transfers";

export default function ActivityPage() {
  const { publicKey, connect } = useWallet();
  const [tab, setTab] = useState<Tab>("payments");
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [ramps, setRamps] = useState<RampTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError("");
    try {
      const [txList, rampList] = await Promise.all([
        sdk.transactions.listTransactions({ page: 1, limit: 25 }),
        sdk.ramps.history({ page: 1, limit: 25 }),
      ]);
      setTxs(txList?.data ?? []);
      setRamps(rampList?.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load your activity.");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (!publicKey) {
    return (
      <>
        <PageTitle title="Activity" subtitle="Your payments and transfers" />
        <Card><ConnectPrompt onConnect={connect} /></Card>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Activity"
        subtitle="Payments and money movements"
        right={
          <button
            onClick={load}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:text-fg"
            aria-label="Refresh"
          >
            <Icon icon="ph:arrows-clockwise" className="text-lg" />
          </button>
        }
      />

      <div className="mb-4 flex gap-1 rounded-full border border-hairline p-1">
        <TabButton active={tab === "payments"} onClick={() => setTab("payments")}>
          Payments
        </TabButton>
        <TabButton active={tab === "transfers"} onClick={() => setTab("transfers")}>
          Add / Withdraw
        </TabButton>
      </div>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <Icon icon="ph:warning-circle-bold" />
          {error}
        </p>
      )}

      {loading ? (
        <Card>
          <div className="flex justify-center py-12">
            <Spinner className="text-2xl" />
          </div>
        </Card>
      ) : tab === "payments" ? (
        txs.length === 0 ? (
          <Card>
            <EmptyState
              icon="ph:receipt"
              title="No payments yet"
              body="Your UPI payments will appear here."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {txs.map((t) => (
              <PaymentRow key={t.id} tx={t} />
            ))}
          </div>
        )
      ) : ramps.length === 0 ? (
        <Card>
          <EmptyState
            icon="ph:arrows-down-up"
            title="No transfers yet"
            body="Deposits and withdrawals will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {ramps.map((r) => (
            <RampRow key={r.id} ramp={r} />
          ))}
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
        active ? "bg-brand text-white" : "text-fg-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function PaymentRow({ tx }: { tx: Transaction }) {
  const rupees =
    tx.amountInPaise != null
      ? `₹${(Number(tx.amountInPaise) / 100).toFixed(2)}`
      : "—";
  return (
    <Card className="flex items-center gap-3 py-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
        <Icon icon="ph:arrow-up-right-bold" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{rupees}</div>
        <div className="truncate text-xs text-fg-muted">
          {tx.usdcAmount != null && `${formatUsd(tx.usdcAmount)} USDC · `}
          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "Payment"}
        </div>
      </div>
      <StatusPill status={tx.status} />
    </Card>
  );
}

function RampRow({ ramp }: { ramp: RampTransaction }) {
  const isOff = ramp.type === "OFFRAMP";
  return (
    <Card className="flex items-center gap-3 py-4">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isOff ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
        }`}
      >
        <Icon icon={isOff ? "ph:arrow-up-bold" : "ph:arrow-down-bold"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">
          {ramp.amountOut ? `${ramp.amountOut} USDC` : isOff ? "Withdrawal" : "Deposit"}
        </div>
        <div className="truncate text-xs text-fg-muted">
          {ramp.referenceNumber ? `Ref ${ramp.referenceNumber}` : "MoneyGram"}
        </div>
      </div>
      <StatusPill status={ramp.status} />
    </Card>
  );
}
