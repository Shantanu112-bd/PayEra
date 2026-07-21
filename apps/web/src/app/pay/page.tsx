"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { parseUpiQr, isUpiVpa } from "../../lib/upi-parser";
import { getWalletBalances } from "../../lib/horizon";
import { getAddress } from "@stellar/freighter-api";
import { useAppStore } from "../../lib/store";
import { PaymentConfirm } from "../../components/auth/PaymentConfirm";

const QrScanner = dynamic(
  () => import("../../components/payment/QrScanner").then((m) => m.QrScanner),
  { ssr: false }
);

type Step = "SCAN" | "MERCHANT_FOUND" | "QUOTE" | "CONFIRM" | "PROCESSING" | "RESULT";

export default function PayPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("SCAN");
  const [asset, setAsset] = React.useState<"USDC" | "XLM">("USDC");
  const [amountPaise, setAmountPaise] = React.useState("");
  const [vpa, setVpa] = React.useState("");
  const [merchantName, setMerchantName] = React.useState("");
  const [merchantId, setMerchantId] = React.useState<string | null>(null);
  const [merchantApproved, setMerchantApproved] = React.useState(false);
  const [qrPayload, setQrPayload] = React.useState("");
  const [txId, setTxId] = React.useState<string | null>(null);
  const [txStatus, setTxStatus] = React.useState("");
  const [txFailed, setTxFailed] = React.useState(false);
  const [txFailMsg, setTxFailMsg] = React.useState("");
  const [showManual, setShowManual] = React.useState(false);
  const [manualVpa, setManualVpa] = React.useState("");
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [quoteExpiry, setQuoteExpiry] = React.useState(30);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { kycStatus, isAppUnlocked } = useAppStore();
  const isKycVerified = kycStatus === "APPROVED" || kycStatus === "VERIFIED";

  const { data: wallets } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  const { data: balances } = useQuery({
    queryKey: ["wallet-balances"],
    queryFn: async () => {
      const { address } = await getAddress();
      if (!address) return { xlm: "0", usdc: "0" };
      return getWalletBalances(address);
    },
    refetchInterval: 30000,
  });

  const { data: quote, refetch: refetchQuote } = useQuery({
    queryKey: ["quote", asset, amountPaise],
    queryFn: () => cryptoPaySdk.transactions.getQuote({ assetIn: asset, amountInPaise: amountPaise }),
    enabled: step === "QUOTE" && Number(amountPaise) > 0,
  });

  // Quote countdown
  React.useEffect(() => {
    if (step !== "QUOTE") return;
    setQuoteExpiry(30);
    const t = setInterval(() => {
      setQuoteExpiry((s) => {
        if (s <= 1) { refetchQuote(); return 30; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step, asset, amountPaise]);

  const createTx = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        merchantId: merchantId || "11111111-1111-1111-1111-111111111111",
        assetIn: asset,
        amountInPaise: amountPaise,
        merchantUpiVpa: vpa,
      };
      if (qrPayload) payload.qrPayload = qrPayload;
      if (wallets?.data?.[0]?.id) payload.walletId = wallets.data[0].id;
      return cryptoPaySdk.transactions.simulateTransaction("new", payload);
    },
    onSuccess: async (data: { id: string }) => {
      setTxId(data.id);
      setStep("PROCESSING");
      setTxStatus("ROUTING_STELLAR");
      const poll = setInterval(async () => {
        try {
          const tx = await cryptoPaySdk.transactions.getTransaction(data.id);
          setTxStatus(tx.status);
          if (tx.status === "COMPLETED") { clearInterval(poll); setStep("RESULT"); }
          else if (tx.status === "FAILED" || tx.status === "CANCELLED") {
            clearInterval(poll);
            setTxFailed(true);
            setTxFailMsg(tx.failureMessage || "Payment failed");
            setStep("RESULT");
          }
        } catch { /* ignore poll errors */ }
      }, 3000);
      setTimeout(() => {
        clearInterval(poll);
        setStep((cur) => {
          if (cur === "PROCESSING") { setTxFailed(true); setTxFailMsg("Payment timed out"); return "RESULT"; }
          return cur;
        });
      }, 60000);
    },
    onError: (err: { message?: string }) => {
      setTxFailed(true);
      setTxFailMsg(err.message || "Payment failed");
      setStep("RESULT");
    },
  });

  const handleScan = async (raw: string) => {
    const parsed = parseUpiQr(raw);
    if (!parsed.isValid && !isUpiVpa(raw)) return;
    const resolvedVpa = parsed.isValid ? parsed.upiVpa : raw;
    setVpa(resolvedVpa);
    setQrPayload(parsed.isValid ? raw : `upi://pay?pa=${resolvedVpa}&pn=${resolvedVpa}`);
    if (parsed.amount) setAmountPaise((parsed.amount * 100).toFixed(0));
    try {
      const m = await cryptoPaySdk.merchants.findByVpa(resolvedVpa);
      if (m) {
        setMerchantName(m.displayName);
        setMerchantId(m.id);
        const status = await cryptoPaySdk.stellar.getMerchantStatus(m.id);
        setMerchantApproved(status.isApproved);
      } else {
        setMerchantName(parsed.merchantName || resolvedVpa);
        setMerchantId(null);
        setMerchantApproved(false);
      }
    } catch {
      setMerchantName(parsed.merchantName || resolvedVpa);
      setMerchantId(null);
      setMerchantApproved(false);
    }
    setStep("MERCHANT_FOUND");
  };

  const processingIdx = txStatus === "ROUTING_STELLAR" ? 0 : txStatus === "SETTLING" ? 1 : 2;

  if (!isKycVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
        <span className="material-symbols-outlined text-6xl text-primary mb-6">verified_user</span>
        <h2 className="text-xl font-bold text-on-surface mb-3">Verification required</h2>
        <p className="text-sm text-on-surface-variant mb-6 max-w-xs">Complete identity verification before making payments.</p>
        <Link href="/profile/trust">
          <button className="bg-primary text-on-primary font-bold px-8 py-3 rounded-full">Go to Verification</button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ── SCAN ── */}
      {step === "SCAN" && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="absolute inset-0 overflow-hidden">
            <QrScanner onScanSuccess={handleScan} onScanError={() => {}} />
          </div>
          <div className="absolute inset-0 bg-black/50 pointer-events-none" />
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center gap-4 p-4 pt-safe z-10">
            <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="text-white font-semibold text-base">Scan QR</span>
          </div>
          {/* Viewfinder */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="relative w-[280px] h-[280px]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary-fixed" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary-fixed" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary-fixed" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary-fixed" />
            </div>
            <p className="absolute bottom-[calc(50%-180px)] text-white/80 text-sm">Point at any UPI QR code</p>
          </div>
          {/* Manual toggle */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center z-10">
            <button onClick={() => setShowManual(true)} className="text-white text-sm px-6 py-3 bg-white/20 rounded-full backdrop-blur-md">
              Enter UPI ID manually
            </button>
          </div>
        </div>
      )}

      {/* Manual VPA sheet */}
      <AnimatePresence>
        {step === "SCAN" && showManual && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowManual(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-[24px] p-6 z-[70] pb-safe">
              <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6" />
              <h2 className="text-base font-bold text-on-surface text-center mb-4">Enter UPI ID</h2>
              <input ref={inputRef} type="text" value={manualVpa} onChange={(e) => setManualVpa(e.target.value)}
                placeholder="merchant@upi"
                className="w-full border border-outline-variant rounded-[12px] p-4 font-mono mb-4 outline-none focus:border-primary text-on-surface bg-surface-container"
                onKeyDown={(e) => { if (e.key === "Enter" && manualVpa.trim()) { handleScan(manualVpa.trim()); setShowManual(false); setManualVpa(""); } }} />
              <button onClick={() => { if (manualVpa.trim()) { handleScan(manualVpa.trim()); setShowManual(false); setManualVpa(""); } }}
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-full">
                Continue
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MERCHANT_FOUND ── */}
      <AnimatePresence>
        {step === "MERCHANT_FOUND" && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setStep("SCAN")} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-[24px] p-6 z-[70] pb-safe">
              <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-lg text-on-surface">
                  {merchantName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-on-surface text-base">{merchantName}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${merchantApproved ? "bg-primary-container text-on-primary-container" : "bg-bg-error-container text-error"}`}>
                    {merchantApproved ? "Approved" : "Unverified"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                {(["XLM", "USDC"] as const).map((a) => (
                  <button key={a} onClick={() => setAsset(a)}
                    className={`flex-1 py-2 rounded-full border font-semibold text-sm transition-colors ${asset === a ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant"}`}>
                    {a} <span className="opacity-60 text-xs">{a === "XLM" ? balances?.xlm : balances?.usdc}</span>
                  </button>
                ))}
              </div>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-on-surface">₹</span>
                <input type="number" value={amountPaise ? (Number(amountPaise) / 100).toString() : ""}
                  onChange={(e) => { const v = parseFloat(e.target.value); setAmountPaise(isNaN(v) ? "" : (v * 100).toFixed(0)); }}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-4 border border-outline-variant rounded-[12px] text-2xl font-bold text-on-surface bg-surface-container outline-none focus:border-primary" />
              </div>
              <button onClick={() => setStep("QUOTE")} disabled={Number(amountPaise) <= 0}
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-full disabled:opacity-40">
                Get Quote
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── QUOTE ── */}
      {step === "QUOTE" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center gap-4 p-4 pt-safe border-b border-outline-variant">
            <button onClick={() => setStep("MERCHANT_FOUND")} className="p-2 rounded-full bg-surface-container text-on-surface">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="font-semibold text-on-surface">Payment Quote</span>
            <span className="ml-auto text-sm text-on-surface-variant">Expires in {quoteExpiry}s</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-surface-container rounded-[24px] p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Rate</span>
                <span className="font-mono text-on-surface">1 {asset} = ₹{quote?.rate ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">You pay</span>
                <span className="font-mono text-on-surface">{quote?.usdcAmount ?? "—"} {asset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Merchant receives</span>
                <span className="font-mono text-on-surface">₹{(Number(amountPaise) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Fees</span>
                <span className="font-mono text-on-surface">{quote?.fees ?? "₹0.50"}</span>
              </div>
              <div className="border-t border-outline-variant pt-3 flex justify-between items-center">
                <span className="font-semibold text-on-surface">STAR earned</span>
                <span className="bg-primary-container text-on-primary-container text-xs font-bold px-3 py-1 rounded-full">
                  +{quote?.starEarned ?? "25"} STAR
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 pb-safe border-t border-outline-variant">
            <button onClick={() => setStep("CONFIRM")} disabled={Number(amountPaise) <= 0}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-full disabled:opacity-40">
              Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRM ── */}
      {step === "CONFIRM" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center gap-4 p-4 pt-safe border-b border-outline-variant">
            <button onClick={() => setStep("QUOTE")} className="p-2 rounded-full bg-surface-container text-on-surface">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="font-semibold text-on-surface">Confirm Payment</span>
          </div>
          <div className="flex-1 p-6">
            <div className="bg-surface-container rounded-[24px] p-5 space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">To</span>
                <span className="font-semibold text-on-surface">{merchantName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Amount</span>
                <span className="font-semibold text-on-surface">₹{(Number(amountPaise) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Asset</span>
                <span className="font-semibold text-on-surface">{asset}</span>
              </div>
            </div>
            {!isAppUnlocked && (
              <p className="text-sm text-on-surface-variant text-center mb-4">Unlock the app to proceed</p>
            )}
          </div>
          <div className="p-4 pb-safe border-t border-outline-variant">
            <button onClick={() => setShowConfirm(true)} disabled={!isAppUnlocked}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-full disabled:opacity-40">
              Pay Now
            </button>
          </div>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {step === "PROCESSING" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-8" />
          <h2 className="font-bold text-xl text-on-surface mb-2">Processing on Stellar</h2>
          <p className="text-sm text-on-surface-variant mb-12">Do not close this app</p>
          <div className="flex items-center gap-2">
            {["Signing", "Broadcasting", "Confirming"].map((label, idx) => (
              <div key={label} className={`px-3 py-1.5 rounded-full font-bold text-xs border transition-colors ${
                processingIdx === idx ? "bg-primary text-on-primary border-primary"
                : processingIdx > idx ? "bg-primary-container text-on-primary-container border-primary-container"
                : "border-outline-variant text-on-surface-variant"}`}>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {step === "RESULT" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
          {txFailed ? (
            <div className="w-full max-w-sm bg-surface-container-lowest rounded-[24px] p-8 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
              <h2 className="font-bold text-xl text-on-surface mb-2">Payment Failed</h2>
              <p className="text-sm text-on-surface-variant mb-8">{txFailMsg}</p>
              <button onClick={() => { setTxFailed(false); setTxFailMsg(""); setStep("SCAN"); }}
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-full">
                Try Again
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm bg-surface-container-lowest rounded-[24px] p-8 flex flex-col items-center text-center">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                className="material-symbols-outlined text-6xl text-primary mb-4">check_circle</motion.span>
              <h2 className="font-bold text-xl text-on-surface mb-2">Payment Complete</h2>
              <p className="text-on-surface-variant mb-4">₹{(Number(amountPaise) / 100).toFixed(2)} paid to {merchantName}</p>
              <div className="w-full bg-primary-container rounded-[16px] p-4 mb-6">
                <div className="font-bold text-on-primary-container">+{quote?.starEarned ?? "25"} STAR Earned</div>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => router.push("/dashboard")} className="flex-1 py-3 rounded-full border border-outline-variant text-on-surface font-bold">Done</button>
                <Link href={`/history/${txId}`} className="flex-1">
                  <button className="w-full py-3 rounded-full bg-primary text-on-primary font-bold">View Receipt</button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showConfirm && (
          <PaymentConfirm
            amount={(Number(amountPaise) / 100).toFixed(2)}
            merchantName={merchantName}
            starReward={String(quote?.starEarned ?? "25")}
            onConfirmed={() => { setShowConfirm(false); createTx.mutate(); }}
            onCancelled={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
