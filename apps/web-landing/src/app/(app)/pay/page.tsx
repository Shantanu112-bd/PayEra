"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useWallet } from "@/components/app/WalletProvider";
import { sdk } from "@/lib/sdk";
import {
  Card,
  PageTitle,
  Button,
  ConnectPrompt,
  Spinner,
  StatusPill,
} from "@/components/app/ui";
import { parseUpiQr, isUpiVpa } from "@/lib/upi";
import { computeTopUp, buildTopUpQuery } from "@/lib/topup";
import { formatUsd } from "@/lib/format";
import type { Merchant, Transaction } from "@cryptopay/types";

type Step = "enter" | "quote" | "confirm" | "processing" | "done" | "error";

const TERMINAL_OK = "COMPLETED";
const TERMINAL_BAD = ["FAILED", "CANCELLED"];

export default function PayPage() {
  const router = useRouter();
  const { publicKey, balances, connect, refreshBalances } = useWallet();

  const [step, setStep] = useState<Step>("enter");
  const [vpaInput, setVpaInput] = useState("");
  const [amount, setAmount] = useState(""); // rupees
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  const amountInPaise = () =>
    String(Math.round((parseFloat(amount) || 0) * 100));

  const usdcNeeded = quote ? Number(quote.usdcAmount ?? 0) : 0;
  const topUp = computeTopUp(usdcNeeded, balances.USDC);

  const resolveAndQuote = async () => {
    setError("");
    const raw = vpaInput.trim();
    let vpa = raw;
    let presetAmount = "";

    // Accept a full upi:// payload or a bare VPA.
    if (raw.toLowerCase().startsWith("upi://")) {
      const parsed = parseUpiQr(raw);
      if (!parsed.isValid) {
        setError("That doesn’t look like a valid UPI QR payload.");
        return;
      }
      vpa = parsed.upiVpa;
      if (parsed.amount) presetAmount = String(parsed.amount);
    }
    if (!isUpiVpa(vpa)) {
      setError("Enter a valid UPI ID (e.g. merchant@bank).");
      return;
    }
    if (presetAmount) setAmount(presetAmount);
    const amt = presetAmount || amount;
    if (!amt || parseFloat(amt) <= 0) {
      setError("Enter an amount in ₹.");
      return;
    }

    setBusy(true);
    try {
      const found = await sdk.merchants.findByVpa(vpa);
      if (!found) {
        setError("No merchant is registered for that UPI ID.");
        return;
      }
      setMerchant(found);
      const q = await sdk.transactions.getQuote({
        assetIn: "USDC",
        amountInPaise: String(Math.round(parseFloat(amt) * 100)),
      });
      setQuote(q as Record<string, unknown>);
      setStep("quote");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not fetch a quote.");
    } finally {
      setBusy(false);
    }
  };

  const pollTransaction = (id: string, startedAt: number) => {
    const tick = async () => {
      try {
        const latest = await sdk.transactions.getTransaction(id);
        setTx(latest);
        if (latest.status === TERMINAL_OK) {
          await refreshBalances();
          setStep("done");
          return;
        }
        if (TERMINAL_BAD.includes(latest.status)) {
          setError(latest.failureMessage || `Payment ${latest.status.toLowerCase()}.`);
          setStep("error");
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      if (Date.now() - startedAt > 60_000) {
        setError("Timed out waiting for settlement. Check Activity for the final status.");
        setStep("error");
        return;
      }
      pollRef.current = setTimeout(tick, 3000);
    };
    tick();
  };

  const confirmPay = async () => {
    if (!merchant) return;
    setBusy(true);
    setError("");
    try {
      const created = await sdk.transactions.createTransaction({
        merchantId: merchant.id,
        assetIn: "USDC",
        amountInPaise: amountInPaise(),
        merchantUpiVpa: merchant.defaultUpiVpa || vpaInput.trim(),
      });
      setTx(created);
      setStep("processing");
      pollTransaction(created.id, Date.now());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start the payment.");
      setStep("error");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStep("enter");
    setMerchant(null);
    setQuote(null);
    setTx(null);
    setError("");
    setVpaInput("");
    setAmount("");
  };

  if (!publicKey) {
    return (
      <>
        <PageTitle title="Pay" subtitle="Pay any UPI merchant with USDC" />
        <Card>
          <ConnectPrompt onConnect={connect} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Pay"
        subtitle="Pay any UPI merchant with USDC"
        backHref={step === "enter" ? "/wallet" : undefined}
      />

      {step === "enter" && (
        <Card className="space-y-4">
          <div>
            <label className="text-sm font-medium">UPI ID or QR payload</label>
            <input
              value={vpaInput}
              onChange={(e) => setVpaInput(e.target.value)}
              placeholder="merchant@bank  or  upi://pay?pa=…"
              className="focus-ring mt-2 w-full rounded-xl border border-hairline bg-surface-1 px-4 py-3 text-sm outline-none placeholder:text-fg-dim"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Amount (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="focus-ring mt-2 w-full rounded-xl border border-hairline bg-surface-1 px-4 py-3 text-lg font-semibold outline-none placeholder:text-fg-dim"
            />
          </div>
          {error && <ErrLine msg={error} />}
          <Button onClick={resolveAndQuote} disabled={busy}>
            {busy ? <Spinner className="mx-auto text-base" /> : "Get quote"}
          </Button>
        </Card>
      )}

      {step === "quote" && merchant && quote && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <Icon icon="ph:storefront-bold" className="text-xl" />
              </span>
              <div>
                <div className="font-semibold">{merchant.displayName}</div>
                <div className="text-xs text-fg-muted">
                  {merchant.defaultUpiVpa || vpaInput}
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <Row label="You pay" value={`₹${amount}`} strong />
            <Row label="USDC debited" value={`${formatUsd(quote.usdcAmount as number)} USDC`} />
            {quote.quoteRateInrPerAsset != null && (
              <Row label="Rate" value={`₹${Number(quote.quoteRateInrPerAsset).toFixed(2)} / USDC`} />
            )}
            {quote.networkFeePaise != null && (
              <Row label="Network fee" value={`₹${(Number(quote.networkFeePaise) / 100).toFixed(2)}`} />
            )}
            {quote.starEarned != null && (
              <Row label="STAR earned" value={`+${String(quote.starEarned)}`} accent />
            )}
          </Card>

          {topUp.insufficient ? (
            <Card className="border-warning/30 bg-warning/5">
              <p className="text-sm">
                You need{" "}
                <span className="font-semibold">
                  {topUp.shortfall.toFixed(2)} USDC
                </span>{" "}
                more to cover this payment.
              </p>
              <div className="mt-3">
                <Button
                  onClick={() =>
                    router.push(
                      `/onramp?${buildTopUpQuery(topUp.shortfall, "/pay")}`
                    )
                  }
                >
                  Add funds
                </Button>
              </div>
            </Card>
          ) : (
            <Button onClick={confirmPay} disabled={busy}>
              {busy ? <Spinner className="mx-auto text-base" /> : `Pay ₹${amount}`}
            </Button>
          )}
          <Button variant="ghost" onClick={reset}>
            Cancel
          </Button>
        </div>
      )}

      {step === "processing" && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Spinner className="text-3xl" />
            <div>
              <p className="font-semibold">Settling your payment…</p>
              <p className="mt-1 text-sm text-fg-muted">
                {tx ? tx.status.replace(/_/g, " ").toLowerCase() : "Please wait"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {step === "done" && tx && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <Icon icon="ph:check-circle-fill" className="text-4xl" />
            </span>
            <div>
              <p className="text-xl font-semibold">Paid ₹{amount}</p>
              <p className="mt-1 text-sm text-fg-muted">
                {merchant?.displayName}
              </p>
            </div>
            {tx.stellarTransactionHash && (
              <p className="break-all rounded-xl bg-surface-1 px-3 py-2 font-mono text-[11px] text-fg-muted">
                {tx.stellarTransactionHash}
              </p>
            )}
            <div className="flex w-full gap-3">
              <Button variant="ghost" onClick={() => router.push("/activity")}>
                View activity
              </Button>
              <Button onClick={reset}>Pay again</Button>
            </div>
          </div>
        </Card>
      )}

      {step === "error" && (
        <Card className="border-danger/30 bg-danger/5">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Icon icon="ph:x-circle-fill" className="text-4xl text-danger" />
            <p className="text-sm text-danger">{error}</p>
            {tx && <StatusPill status={tx.status} />}
            <Button variant="ghost" onClick={reset}>
              Try again
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-fg-muted">{label}</span>
      <span
        className={
          accent
            ? "font-semibold text-brand-glow"
            : strong
              ? "text-base font-semibold"
              : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ErrLine({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
      <Icon icon="ph:warning-circle-bold" />
      {msg}
    </p>
  );
}
