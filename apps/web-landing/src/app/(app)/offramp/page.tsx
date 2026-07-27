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
} from "@/components/app/ui";
import {
  buildUsdcPaymentXdr,
  submitSignedXdr,
  NETWORK_PASSPHRASE,
} from "@/lib/stellar";
import { signTxWithFreighter } from "@/lib/freighter";
import { shortAddr } from "@/lib/format";
import type { RampTransaction } from "@cryptopay/sdk";

type Step =
  | "amount"
  | "loading"
  | "interactive"
  | "polling"
  | "sign"
  | "done"
  | "error";

export default function OffRampPage() {
  const router = useRouter();
  const { publicKey, balances, connect, refreshBalances } = useWallet();

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [interactiveUrl, setInteractiveUrl] = useState("");
  const [rampId, setRampId] = useState("");
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");
  const [anchorAccount, setAnchorAccount] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  const initiate = async () => {
    if (!publicKey) return;
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val < 5) {
      setError("Minimum withdrawal is 5 USDC.");
      return;
    }
    if (val > parseFloat(balances.USDC)) {
      setError("Insufficient USDC balance.");
      return;
    }
    setError("");
    setStep("loading");
    setStatus("Initiating withdrawal…");
    try {
      // SEP-10 auth happens SERVER-SIDE; the client never holds the anchor JWT.
      const res = await sdk.ramps.initiateOffRamp({
        providerId: "MONEYGRAM",
        userStellarAddress: publicKey,
        amount,
        assetCode: "USDC",
      });
      setRampId(res.id);
      if (res.interactiveUrl) {
        setInteractiveUrl(res.interactiveUrl);
        setStep("interactive");
      } else {
        startPolling(res.id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start the withdrawal.");
      setStep("error");
    }
  };

  const startPolling = (id: string) => {
    setStep("polling");
    setStatus("Waiting for anchor confirmation…");
    const tick = async () => {
      try {
        const ramp: RampTransaction = await sdk.ramps.get(id);
        setStatus(`Status: ${ramp.status.replace(/_/g, " ").toLowerCase()}`);
        if (ramp.referenceNumber) setReference(ramp.referenceNumber);

        // Once the anchor supplies the destination + memo, prompt the user
        // to sign the USDC payment that funds the withdrawal.
        if (ramp.status === "PENDING_USER_TRANSFER" && ramp.anchorAccount) {
          setAnchorAccount(ramp.anchorAccount);
          setMemo(ramp.stellarMemo || "");
          setStep("sign");
          return;
        }
        if (ramp.status === "COMPLETED") {
          await refreshBalances();
          setStep("done");
          return;
        }
        if (["ERROR", "EXPIRED", "REFUNDED"].includes(ramp.status)) {
          setError(ramp.failureMessage || `Withdrawal ${ramp.status.toLowerCase()}.`);
          setStep("error");
          return;
        }
      } catch {
        /* transient */
      }
      pollRef.current = setTimeout(tick, 5000);
    };
    tick();
  };

  const signPayment = async () => {
    if (!publicKey) return;
    setStep("loading");
    setStatus("Signing payment…");
    try {
      const xdr = await buildUsdcPaymentXdr(
        publicKey,
        anchorAccount,
        amount,
        memo || undefined
      );
      const signed = await signTxWithFreighter(xdr, NETWORK_PASSPHRASE, publicKey);
      await submitSignedXdr(signed);
      startPolling(rampId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to sign the payment.");
      setStep("error");
    }
  };

  if (!publicKey) {
    return (
      <>
        <PageTitle title="Withdraw" subtitle="Cash out your USDC" backHref="/wallet" />
        <Card><ConnectPrompt onConnect={connect} /></Card>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Withdraw" subtitle="Withdraw via MoneyGram" backHref="/wallet" />

      {step === "amount" && (
        <div className="space-y-4">
          <Card className="relative overflow-hidden">
            <div className="text-xs font-medium uppercase tracking-widest text-fg-muted">
              Available
            </div>
            <div className="mt-1 text-3xl font-semibold">
              {balances.USDC} <span className="text-lg text-fg-muted">USDC</span>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount (USDC)</label>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="focus-ring mt-2 w-full rounded-xl border border-hairline bg-surface-1 px-4 py-3 text-lg font-semibold outline-none placeholder:text-fg-dim"
              />
            </div>
            <div className="flex gap-2">
              {["20", "50", "100"].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`focus-ring flex-1 rounded-full border py-2 text-sm font-medium transition-colors ${
                    amount === v
                      ? "border-brand bg-brand/15 text-brand"
                      : "border-hairline text-fg-muted hover:text-fg"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-fg-muted">Min 5 USDC · Max 2,500 USDC</p>
            {error && (
              <p className="flex items-center gap-2 text-sm text-danger">
                <Icon icon="ph:warning-circle-bold" /> {error}
              </p>
            )}
          </Card>

          <Card className="space-y-2 text-sm text-fg-muted">
            <div className="flex items-center gap-2">
              <Icon icon="ph:storefront-bold" className="text-brand" />
              Pick up at any MoneyGram location
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="ph:globe-hemisphere-west-bold" className="text-brand" />
              170+ countries supported
            </div>
          </Card>

          <Button onClick={initiate} disabled={!amount}>
            Continue
          </Button>
        </div>
      )}

      {(step === "loading" || step === "polling") && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Spinner className="text-3xl" />
            <p className="text-sm text-fg-muted">{status}</p>
          </div>
        </Card>
      )}

      {step === "interactive" && interactiveUrl && (
        <div className="space-y-3">
          <p className="text-center text-sm text-fg-muted">
            Complete your withdrawal details in the secure window below.
          </p>
          <div className="h-[520px] overflow-hidden rounded-2xl border border-hairline bg-surface-1">
            <iframe
              src={interactiveUrl}
              className="h-full w-full border-0"
              title="MoneyGram Withdrawal"
            />
          </div>
          <Button onClick={() => startPolling(rampId)}>
            I’ve completed the form
          </Button>
        </div>
      )}

      {step === "sign" && (
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Icon icon="ph:paper-plane-tilt-bold" className="text-xl" />
            </span>
            <div>
              <div className="font-semibold">Send USDC to MoneyGram</div>
              <div className="text-sm text-fg-muted">
                Sign to complete your withdrawal
              </div>
            </div>
          </div>
          <div className="space-y-2 rounded-xl bg-surface-1 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-fg-muted">Amount</span>
              <span className="font-semibold">{amount} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Destination</span>
              <span className="font-mono text-xs">{shortAddr(anchorAccount, 8, 4)}</span>
            </div>
            {memo && (
              <div className="flex justify-between">
                <span className="text-fg-muted">Memo</span>
                <span className="font-mono">{memo}</span>
              </div>
            )}
          </div>
          <Button onClick={signPayment}>Sign &amp; send</Button>
        </Card>
      )}

      {step === "done" && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <Icon icon="ph:check-circle-fill" className="text-4xl" />
            </span>
            <div>
              <p className="text-xl font-semibold">Withdrawal submitted</p>
              <p className="mt-1 text-sm text-fg-muted">
                Your funds are ready for pickup at MoneyGram
              </p>
            </div>
            {reference && (
              <p className="rounded-xl bg-surface-1 px-4 py-2 text-sm">
                Ref <span className="font-mono font-semibold">{reference}</span>
              </p>
            )}
            <Button onClick={() => router.push("/wallet")}>Done</Button>
          </div>
        </Card>
      )}

      {step === "error" && (
        <Card className="border-danger/30 bg-danger/5">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Icon icon="ph:x-circle-fill" className="text-4xl text-danger" />
            <p className="text-sm text-danger">{error}</p>
            <Button variant="ghost" onClick={() => setStep("amount")}>
              Try again
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
