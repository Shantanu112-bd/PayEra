"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useWallet } from "@/components/app/WalletProvider";
import { sdk } from "@/lib/sdk";
import {
  Card,
  PageTitle,
  Button,
  ConnectPrompt,
  Spinner,
  EmptyState,
  StatusPill,
} from "@/components/app/ui";
import type { Reward } from "@cryptopay/types";

type Rewards = {
  lifetimeStar?: number | string;
  mintedStar?: number | string;
  pendingStar?: number | string;
  userId?: string;
};

export default function RewardsPage() {
  const { publicKey, balances, connect, refreshBalances } = useWallet();
  const [summary, setSummary] = useState<Rewards | null>(null);
  const [items, setItems] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError("");
    try {
      const [s, list] = await Promise.all([
        sdk.rewards.getRewards(),
        sdk.rewards.listRewards({ page: 1, limit: 20 }),
      ]);
      setSummary(s as Rewards);
      setItems(list?.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load rewards.");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async (id: string) => {
    setClaiming(id);
    setError("");
    try {
      await sdk.rewards.claimReward(id);
      await Promise.all([load(), refreshBalances()]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not claim this reward.");
    } finally {
      setClaiming(null);
    }
  };

  if (!publicKey) {
    return (
      <>
        <PageTitle title="Rewards" subtitle="Earn STAR on every payment" />
        <Card><ConnectPrompt onConnect={connect} /></Card>
      </>
    );
  }

  const pending = Number(summary?.pendingStar ?? 0);

  return (
    <>
      <PageTitle
        title="Rewards"
        subtitle="Earn STAR every time you pay"
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

      {/* STAR hero */}
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-fg-muted">
            <Icon icon="ph:star-four-fill" className="text-brand-glow" />
            STAR balance
          </div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">
            {balances.STAR}
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Lifetime earned" value={String(summary?.lifetimeStar ?? "0")} />
        <Stat label="Pending" value={String(summary?.pendingStar ?? "0")} accent />
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <Icon icon="ph:warning-circle-bold" />
          {error}
        </p>
      )}

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-fg-muted">
        History
      </h2>

      {loading ? (
        <Card>
          <div className="flex justify-center py-10">
            <Spinner className="text-2xl" />
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="ph:star-four"
            title="No rewards yet"
            body="Make your first payment to start earning STAR."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const claimable = r.status === "PENDING";
            return (
              <Card key={r.id} className="flex items-center gap-3 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-glow/15 text-brand-glow">
                  <Icon icon="ph:star-four-bold" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    +{String(r.starAmount ?? 0)} STAR
                  </div>
                  <div className="truncate text-xs text-fg-muted">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : r.transactionId
                        ? `Tx ${r.transactionId.slice(0, 8)}…`
                        : r.reason}
                  </div>
                </div>
                {claimable ? (
                  <div className="w-24">
                    <Button
                      onClick={() => claim(r.id)}
                      disabled={claiming === r.id}
                      className="py-2 text-xs"
                    >
                      {claiming === r.id ? (
                        <Spinner className="mx-auto text-sm" />
                      ) : (
                        "Claim"
                      )}
                    </Button>
                  </div>
                ) : (
                  <StatusPill status={r.status} />
                )}
              </Card>
            );
          })}
        </div>
      )}

      {pending > 0 && (
        <p className="mt-4 text-center text-xs text-fg-muted">
          Claimed STAR is minted to your Stellar wallet on the testnet.
        </p>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-widest text-fg-muted">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-semibold ${
          accent ? "text-brand-glow" : ""
        }`}
      >
        {value}
      </div>
    </Card>
  );
}
