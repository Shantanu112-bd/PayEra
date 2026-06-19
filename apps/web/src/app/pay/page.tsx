"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { PaymentSuccess, Button, Skeleton } from "@cryptopay/ui";
import { ArrowLeft, Star, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../lib/store";
import { parseUpiQr, isUpiVpa } from "../../lib/upi-parser";
import dynamic from "next/dynamic";

const QrScanner = dynamic(
  () => import("../../components/payment/QrScanner").then((mod) => mod.QrScanner),
  { ssr: false }
);

type PayStep = "SCAN" | "QUOTE" | "ASSET_SELECTION" | "CONFIRM" | "PROCESSING" | "SUCCESS" | "REWARD";

export default function PayPage() {
  const router = useRouter();
  const { currentUserId } = useAppStore();
  const [step, setStep] = React.useState<PayStep>("SCAN");
  const [selectedAsset, setSelectedAsset] = React.useState<"USDC" | "XLM">("USDC");
  const [transactionId, setTransactionId] = React.useState<string | null>(null);

  // Scanned UPI QR states
  const [scannedVpa, setScannedVpa] = React.useState<string>("");
  const [scannedMerchantName, setScannedMerchantName] = React.useState<string>("");
  const [merchantId, setMerchantId] = React.useState<string | null>(null);
  const [amountPaise, setAmountPaise] = React.useState<string>("20000"); // Default 200 INR (20000 paise)
  const [qrPayload, setQrPayload] = React.useState<string>("");

  // Fetch Quote when entering QUOTE or CONFIRM states
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ["quote", selectedAsset, amountPaise],
    queryFn: () => cryptoPaySdk.transactions.getQuote({ assetIn: selectedAsset, amountInPaise: amountPaise }),
    enabled: step === "QUOTE" || step === "CONFIRM" || step === "ASSET_SELECTION",
  });

  // Fetch Wallets for Asset Selection
  const { data: wallets } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  // Transaction Creation Mutation
  const createTxMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        merchantId: merchantId || "11111111-1111-1111-1111-111111111111",
        assetIn: selectedAsset,
        amountInPaise: amountPaise,
        merchantUpiVpa: scannedVpa,
      };
      if (qrPayload) {
        payload.qrPayload = qrPayload;
      }
      if (wallets?.data?.[0]?.id) {
        payload.walletId = wallets.data[0].id;
      }
      return cryptoPaySdk.transactions.createTransaction(payload);
    },
    onSuccess: async (data: any) => {
      setTransactionId(data.id);
      setStep("PROCESSING");
      
      // Poll transaction status every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          const tx = await cryptoPaySdk.transactions.getTransaction(data.id);
          if (tx.status === "COMPLETED") {
            clearInterval(pollInterval);
            setStep("SUCCESS");
          } else if (tx.status === "FAILED" || tx.status === "CANCELLED") {
            clearInterval(pollInterval);
            alert("Payment failed: " + tx.failureMessage);
            setStep("SCAN");
          }
        } catch (e) {
          console.error("Poll error", e);
        }
      }, 2000);

      // Safety timeout after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        setStep((currentStep) => {
          if (currentStep === "PROCESSING") {
            alert("Payment timed out. Please try again.");
            return "SCAN";
          }
          return currentStep;
        });
      }, 60000);
    },
    onError: (err: any) => {
      console.error("Tx Creation Failed", err);
      alert("Payment failed: " + err.message);
      setStep("SCAN");
    }
  });

  // Handlers
  const handleScanSuccess = async (decodedText: string) => {
    console.log("QR Scan Success:", decodedText);
    
    const parsed = parseUpiQr(decodedText);
    if (!parsed.isValid && !isUpiVpa(decodedText)) {
      alert("Invalid QR code. Please scan a valid UPI QR code.");
      return;
    }

    const vpa = parsed.isValid ? parsed.upiVpa : decodedText;

    // Look up real merchant by VPA
    try {
      const merchant = await cryptoPaySdk.merchants.findByVpa(vpa);
      if (merchant) {
        setScannedVpa(vpa);
        setScannedMerchantName(merchant.displayName);
        setMerchantId(merchant.id); // real merchant ID from DB
      } else {
        // VPA not in our network yet — still allow payment with VPA only
        setScannedVpa(vpa);
        setScannedMerchantName(parsed.merchantName || vpa);
        setMerchantId(null); // will use VPA-only flow
      }
      setQrPayload(parsed.isValid ? decodedText : `upi://pay?pa=${vpa}&pn=${vpa}`);
      if (parsed.amount) {
        setAmountPaise((parsed.amount * 100).toFixed(0));
      }
      setStep("QUOTE");
    } catch (e) {
      console.error("Merchant lookup failed", e);
      setScannedVpa(vpa);
      setScannedMerchantName(parsed.isValid ? parsed.merchantName || vpa : vpa);
      setMerchantId(null);
      setQrPayload(parsed.isValid ? decodedText : `upi://pay?pa=${vpa}&pn=${vpa}`);
      if (parsed.amount) {
        setAmountPaise((parsed.amount * 100).toFixed(0));
      }
      setStep("QUOTE");
    }
  };

  const handleAssetSelect = (asset: "USDC" | "XLM") => {
    setSelectedAsset(asset);
    setStep("CONFIRM");
  };

  // Variants for Framer Motion
  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 min-h-[calc(100vh-140px)] flex flex-col justify-center relative">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: SCAN */}
        {step === "SCAN" && (
          <motion.div key="scan" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
            <div className="bg-ink rounded-[20px] p-6 relative overflow-hidden">
              <QrScanner
                onScanSuccess={handleScanSuccess}
                onScanError={(err) => {
                  console.error("Scanner Error:", err);
                }}
              />
            </div>
            <div className="mt-4 space-y-3">
              <button 
                onClick={() => {
                  const manualVpa = prompt("Enter UPI VPA manually (e.g. merchant@upi):");
                  if (manualVpa) {
                    handleScanSuccess(manualVpa);
                  }
                }}
                className="btn-primary w-full !py-3"
              >
                Enter VPA manually
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: QUOTE & CONFIRM */}
        {(step === "QUOTE" || step === "CONFIRM") && (
          <motion.div key="quote" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
            <div className="border-[1.5px] border-ink rounded-[20px] bg-white overflow-hidden">
              {/* Merchant header */}
              <div className="p-4 border-b border-ink flex items-center gap-3">
                <button onClick={() => setStep("SCAN")} className="w-8 h-8 rounded-full border-[1.5px] border-ink flex items-center justify-center hover:bg-ink hover:text-white transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-[1.5px] border-ink flex items-center justify-center">
                    <span className="font-[family-name:var(--font-ibm-plex-mono)] font-bold text-sm">
                      {scannedMerchantName ? scannedMerchantName.slice(0, 2).toUpperCase() : "MP"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight font-[family-name:var(--font-ibm-plex-mono)] truncate max-w-[180px]">
                      {scannedMerchantName || "Merchant"}
                    </h2>
                    <span className="text-[11px] border-[1.5px] border-ink rounded-[50px] px-2 py-0.5 font-[family-name:var(--font-ibm-plex-mono)]">QR Verified</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Amount Input */}
                <div className="text-center">
                  <p className="text-xs text-muted uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)] mb-2">Amount (INR)</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={(Number(amountPaise) / 100).toString()}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                          setAmountPaise((val * 100).toFixed(0));
                        } else {
                          setAmountPaise("0");
                        }
                      }}
                      className="text-5xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink text-center bg-transparent border-b border-dashed border-ink/35 focus:border-ink focus:outline-none w-44"
                    />
                  </div>
                </div>

                {/* Asset selection pills */}
                <div className="flex justify-center gap-2">
                  {(["USDC", "XLM"] as const).map((asset) => (
                    <button
                      key={asset}
                      onClick={() => { setSelectedAsset(asset); if (step !== "CONFIRM") setStep("CONFIRM"); }}
                      className={`px-4 py-2 rounded-[50px] border-[1.5px] border-ink text-sm font-semibold font-[family-name:var(--font-ibm-plex-mono)] transition-colors ${
                        selectedAsset === asset 
                          ? "bg-ink text-white" 
                          : "bg-transparent text-ink hover:bg-ink/5"
                      }`}
                    >
                      {asset}
                    </button>
                  ))}
                </div>

                {/* Quote breakdown */}
                <div className="border-[1.5px] border-ink rounded-[16px] p-4 space-y-3 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>You Pay</span>
                    <span className="text-ink font-[family-name:var(--font-ibm-plex-mono)] font-semibold">
                      {quoteLoading ? <Skeleton className="h-4 w-16 inline-block" /> : `${quote?.usdcAmount || "2.40"} ${selectedAsset}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Exchange Rate</span>
                    <span className="text-ink font-[family-name:var(--font-ibm-plex-mono)]">
                      {quoteLoading ? <Skeleton className="h-4 w-20 inline-block" /> : `1 ${selectedAsset} = ${(Number(amountPaise) / 100 / (quote?.usdcAmount || 2.40)).toFixed(2)} INR`}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Network Fee</span>
                    <span className="text-ink font-[family-name:var(--font-ibm-plex-mono)]">~0.00001 XLM</span>
                  </div>
                  <div className="border-t border-ink pt-3 flex justify-between items-center">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      <Star className="h-4 w-4" /> STAR Rewards
                    </span>
                    <span className="bg-lime border-[1.5px] border-ink rounded-[50px] px-3 py-1 font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink text-sm">
                      +{quoteLoading ? "..." : quote?.starReward || "0"} ⭐ STAR
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button 
                  onClick={() => createTxMutation.mutate()}
                  disabled={createTxMutation.isPending || Number(amountPaise) <= 0}
                  className="btn-accent w-full !py-4 !text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createTxMutation.isPending ? "PROCESSING..." : "CONFIRM PAYMENT →"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: ASSET SELECTION */}
        {step === "ASSET_SELECTION" && (
          <motion.div key="assets" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
            <div className="border-[1.5px] border-ink rounded-[20px] bg-white overflow-hidden">
              <div className="p-4 border-b border-ink flex items-center gap-3">
                <button onClick={() => setStep("QUOTE")} className="w-8 h-8 rounded-full border-[1.5px] border-ink flex items-center justify-center hover:bg-ink hover:text-white transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-lg font-bold font-[family-name:var(--font-ibm-plex-mono)]">Select Asset</h2>
              </div>
              <div className="p-4 space-y-2">
                {(["USDC", "XLM"] as const).map((asset) => (
                  <div 
                    key={asset} 
                    onClick={() => handleAssetSelect(asset)}
                    className={`flex items-center justify-between p-4 rounded-[16px] cursor-pointer transition-colors border-[1.5px] ${
                      selectedAsset === asset 
                        ? "border-ink bg-ink text-white" 
                        : "border-ink bg-white hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full border-[1.5px] flex items-center justify-center font-[family-name:var(--font-ibm-plex-mono)] font-bold ${
                        selectedAsset === asset ? "border-white text-white" : "border-ink text-ink"
                      }`}>
                        {asset[0]}
                      </div>
                      <div>
                        <p className="font-bold font-[family-name:var(--font-ibm-plex-mono)]">{asset}</p>
                        <p className={`text-xs ${selectedAsset === asset ? "text-white/60" : "text-muted"}`}>
                          Available: {asset === "USDC" ? "1,240.50" : "450.00"}
                        </p>
                      </div>
                    </div>
                    {selectedAsset === asset && <Check className="h-5 w-5" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: PROCESSING */}
        {step === "PROCESSING" && (
          <motion.div key="processing" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="spinner-border !w-20 !h-20 !border-[2px]" />
              <div>
                <h2 className="text-2xl font-bold mb-2 font-[family-name:var(--font-ibm-plex-mono)] text-ink">Processing Payment</h2>
                <p className="text-muted">Routing through the Stellar network...</p>
              </div>
              {/* Progress steps */}
              <div className="flex gap-2">
                {["Signing", "Broadcasting", "Confirming"].map((label, i) => (
                  <span key={label} className={`px-3 py-1.5 rounded-[50px] border-[1.5px] border-ink text-xs font-semibold font-[family-name:var(--font-ibm-plex-mono)] ${
                    i === 0 ? "bg-lime text-ink" : "bg-transparent text-muted"
                  }`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: SUCCESS */}
        {(step === "SUCCESS" || step === "REWARD") && (
          <motion.div key="success" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
            <PaymentSuccess 
              amount={(Number(amountPaise) / 100).toString()} 
              currency="INR" 
              merchantName={scannedMerchantName || "Chai Point"} 
              onDone={() => router.push("/dashboard")}
              starEarned={quoteLoading ? 0 : Number(quote?.starReward || 0)}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
