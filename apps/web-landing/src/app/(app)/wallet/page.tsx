"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useWallet } from "@/components/app/WalletProvider";
import { Card, PageTitle, Button, ConnectPrompt, Spinner } from "@/components/app/ui";
import {
  hasUsdcTrustline,
  buildUsdcTrustlineXdr,
  submitSignedXdr,
  NETWORK_PASSPHRASE,
} from "@/lib/stellar";
import { signTxWithFreighter } from "@/lib/freighter";
import { shortAddr } from "@/lib/format";

const ACTIONS = [
  { href: "/pay", label: "Pay", icon: "ph:qr-code-bold" },
  { href: "/onramp", label: "Add funds", icon: "ph:arrow-down-bold" },
  { href: "/offramp", label: "Withdraw", icon: "ph:arrow-up-bold" },
  { href: "/rewards", label: "Rewards", icon: "ph:star-four-bold" },
];

export default function WalletPage() {
  const { publicKey, balances, connect, refreshBalances, isConnecting } =
    useWallet();
  const [needsTrustline, setNeedsTrustline] = useState(false);
  const [addingTrustline, setAddingTrustline] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!publicKey) return;
    hasUsdcTrustline(publicKey).then((has) => setNeedsTrustline(!has));
  }, [publicKey, balances]);

  const addTrustline = async () => {
    if (!publicKey) return;
    setAddingTrustline(true);
    setErr("");
    try {
      const xdr = await buildUsdcTrustlineXdr(publicKey);
      const signed = await signTxWithFreighter(xdr, NETWORK_PASSPHRASE, publicKey);
      await submitSignedXdr(signed);
      await refreshBalances();
      setNeedsTrustline(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not add USDC trustline");
    } finally {
      setAddingTrustline(false);
    }
  };

  const copyAddr = () => {
    if (!publicKey) return;
    navigator.clipboard?.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!publicKey) {
    return (
      <>
        <PageTitle title="Wallet" subtitle="Your balances and quick actions" />
        <Card>
          <ConnectPrompt onConnect={connect} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Wallet"
        right={
          <button
            onClick={copyAddr}
            className="focus-ring flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
          >
            <Icon icon={copied ? "ph:check" : "ph:copy"} />
            {copied ? "Copied" : shortAddr(publicKey)}
          </button>
        }
      />

      {/* USDC hero balance */}
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle,#2563eb,transparent 70%)" }}
        />
        <div className="relative">
          <div className="text-xs font-medium uppercase tracking-widest text-fg-muted">
            USDC balance
          </div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">
            {balances.USDC}{" "}
            <span className="text-lg font-normal text-fg-muted">USDC</span>
          </div>
          <div className="mt-4 flex gap-4 text-sm text-fg-muted">
            <span className="flex items-center gap-1.5">
              <Icon icon="ph:star-four-fill" className="text-brand-glow" />
              {balances.STAR} STAR
            </span>
            <span className="flex items-center gap-1.5">
              <Icon icon="ph:planet" className="text-fg-dim" />
              {balances.XLM} XLM
            </span>
          </div>
        </div>
      </Card>

      {needsTrustline && (
        <Card className="mt-4 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <Icon
              icon="ph:seal-warning-bold"
              className="mt-0.5 text-xl text-warning"
            />
            <div className="flex-1">
              <p className="font-semibold">Add a USDC trustline</p>
              <p className="mt-1 text-sm text-fg-muted">
                Your wallet needs a one-time USDC trustline before it can hold or
                receive USDC.
              </p>
              <div className="mt-3 w-40">
                <Button onClick={addTrustline} disabled={addingTrustline}>
                  {addingTrustline ? <Spinner className="mx-auto text-base" /> : "Add trustline"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {err && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <Icon icon="ph:warning-circle-bold" />
          {err}
        </p>
      )}

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="glass focus-ring flex flex-col items-center gap-2 rounded-2xl py-4 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Icon icon={a.icon} className="text-lg" />
            </span>
            {a.label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <Button variant="ghost" onClick={refreshBalances} disabled={isConnecting}>
          Refresh balances
        </Button>
      </div>
    </>
  );
}
