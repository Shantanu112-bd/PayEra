"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { RampTransaction } from "@cryptopay/sdk";

type Step = "amount" | "loading" | "interactive" | "polling" | "done" | "error";

function OnRampInner() {
  const router = useRouter();
  const params = useSearchParams();
  const presetTopUp = params.get("topup") || "";
  const returnTo = params.get("returnTo") || "/wallet";

  const { publicKey, connect, refreshBalances } = useWallet();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(presetTopUp);
  const [interactiveUrl, setInteractiveUrl] = useState("");
  const [rampId, setRampId] = useState("");
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  const initiate = async () => {
    if (!publicKey) return;
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setError("Enter an amount to add.");
      return;
    }
    setError("");
    setStep("loading");
    setStatus("Contacting provider…");
    try {
      const res = await sdk.ramps.initiateOnRamp({
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
      setError(e instanceof Error ? e.message : "Could not start the deposit.");
      setStep("error");
    }
  };

  const startPolling = (id: string) => {
    setStep("polling");
    setStatus("Waiting for the provider to confirm…");
    const started = Date.now();
    const tick = async () => {
      try {
        const ramp: RampTransaction = await sdk.ramps.get(id);
        setStatus(`Status: ${ramp.status.replace(/_/g, " ").toLowerCase()}`);
        if (ramp.referenceNumber) setReference(ramp.referenceNumber);
        if (ramp.status === "COMPLETED") {
          await refreshBalances();
          setStep("done");
          return;
        }
        if (["ERROR", "EXPIRED", "REFUNDED"].includes(ramp.status)) {
          setError(ramp.failureMessage || `Deposit ${ramp.status.toLowerCase()}.`);
          setStep("error");
          return;
        }
      } catch {
        /* transient */
      }
      if (Date.now() - started > 15 * 60_000) {
        setStatus("Still pending — check Activity later for the final status.");
        return;
      }
      pollRef.current = setTimeout(tick, 5000);
    };
    tick();
  };

  if (!publicKey) {
    return (
      <>
        <PageTitle title="Add funds" subtitle="Deposit USDC into your wallet" backHref="/wallet" />
        <Card><ConnectPrompt onConnect={connect} /></Card>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Add funds" subtitle="Deposit USDC via MoneyGram" backHref="/wallet" />

      {step === "amount" && (
        <Card className="space-y-4">
          {presetTopUp && (
            <p className="rounded-xl bg-brand/10 px-3 py-2.5 text-sm text-brand">
              Suggested top-up: {presetTopUp} USDC
            </p>
          )}
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
            {["10", "25", "50", "100"].map((v) => (
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
          {error && (
            <p className="flex items-center gap-2 text-sm text-danger">
              <Icon icon="ph:warning-circle-bold" /> {error}
            </p>
          )}
          <Button onClick={initiate}>Continue</Button>
        </Card>
      )}

      {(step === "loading" || step === "polling") && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Spinner className="text-3xl" />
            <p className="text-sm text-fg-muted">{status || "Please wait…"}</p>
            {reference && (
              <p className="rounded-xl bg-surface-1 px-3 py-2 text-sm">
                Ref <span className="font-mono font-semibold">{reference}</span>
              </p>
            )}
          </div>
        </Card>
      )}

      {step === "interactive" && interactiveUrl && (
        <div className="space-y-3">
          <p className="text-center text-sm text-fg-muted">
            Complete your deposit in the secure provider window below.
          </p>
          <div className="h-[520px] overflow-hidden rounded-2xl border border-hairline bg-surface-1">
            <iframe
              src={interactiveUrl}
              className="h-full w-full border-0"
              title="MoneyGram Deposit"
            />
          </div>
          <Button onClick={() => startPolling(rampId)}>
            I’ve completed the form
          </Button>
        </div>
      )}

      {step === "done" && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <Icon icon="ph:check-circle-fill" className="text-4xl" />
            </span>
            <p className="text-xl font-semibold">Funds added</p>
            {reference && (
              <p className="rounded-xl bg-surface-1 px-4 py-2 text-sm">
                Ref <span className="font-mono font-semibold">{reference}</span>
              </p>
            )}
            <div className="flex w-full gap-3">
              <Button variant="ghost" onClick={() => router.push("/wallet")}>
                Wallet
              </Button>
              <Button onClick={() => router.push(returnTo)}>Continue</Button>
            </div>
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

export default function OnRampPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center"><Spinner className="text-3xl" /></div>}>
      <OnRampInner />
    </Suspense>
  );
}
