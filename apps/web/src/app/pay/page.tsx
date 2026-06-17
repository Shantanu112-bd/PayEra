"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { PaymentSuccess, Button, Skeleton } from "@cryptopay/ui";
import { QrCode, ArrowRight, ArrowLeft, Star, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../lib/store";

type PayStep = "SCAN" | "QUOTE" | "ASSET_SELECTION" | "CONFIRM" | "PROCESSING" | "SUCCESS" | "REWARD";

// Hardcoded merchant details for demo flow
const DEMO_MERCHANT_ID = "11111111-1111-1111-1111-111111111111"; // Mock UUID
const DEMO_VPA = "chaipoint@upi";
const DEMO_AMOUNT_PAISE = "20000"; // 200 INR

export default function PayPage() {
  const router = useRouter();
  const { currentUserId } = useAppStore();
  const [step, setStep] = React.useState<PayStep>("SCAN");
  const [selectedAsset, setSelectedAsset] = React.useState<"USDC" | "XLM">("USDC");
  const [transactionId, setTransactionId] = React.useState<string | null>(null);

  // Fetch Quote when entering QUOTE or CONFIRM states
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ["quote", selectedAsset, DEMO_AMOUNT_PAISE],
    queryFn: () => cryptoPaySdk.transactions.getQuote({ assetIn: selectedAsset, amountInPaise: DEMO_AMOUNT_PAISE }),
    enabled: step === "QUOTE" || step === "CONFIRM" || step === "ASSET_SELECTION",
  });

  // Fetch Wallets for Asset Selection
  const { data: wallets } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  // Transaction Creation Mutation
  const createTxMutation = useMutation({
    mutationFn: () => cryptoPaySdk.transactions.createTransaction({
      merchantId: DEMO_MERCHANT_ID,
      assetIn: selectedAsset,
      amountInPaise: DEMO_AMOUNT_PAISE,
      merchantUpiVpa: DEMO_VPA,
      ...(wallets?.data?.[0]?.id ? { walletId: wallets.data[0].id } : {}),
    }),
    onSuccess: async (data: any) => {
      setTransactionId(data.id);
      setStep("PROCESSING");
      // Fast-forward processing via simulate
      try {
        await cryptoPaySdk.transactions.simulateTransaction(data.id);
      } catch (e) {
        console.warn("Simulation failed, likely due to mock DB state", e);
      }
      // Wait for dramatic effect
      setTimeout(() => {
        setStep("SUCCESS");
      }, 2000);
    },
    onError: (err) => {
      console.error("Tx Creation Failed", err);
      alert("Payment failed: " + err.message);
      setStep("SCAN");
    }
  });

  // Handlers
  const handleScan = () => {
    setStep("QUOTE");
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
            <div className="bg-ink rounded-[20px] p-8 relative overflow-hidden">
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white" />
              
              {/* Scan line */}
              <motion.div 
                className="absolute left-6 right-6 h-[1px] bg-white/80"
                animate={{ top: ["15%", "85%", "15%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />

              <div className="text-center py-12 relative z-10">
                <div className="mx-auto mb-6 w-20 h-20 border-[1.5px] border-white/30 rounded-[16px] flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white font-[family-name:var(--font-ibm-plex-mono)]">Scan to Pay</h2>
                <p className="text-white/60 mb-8 text-sm">
                  Scan any merchant's UPI QR code to instantly pay with your crypto wallet.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <button onClick={handleScan} className="btn-accent w-full !py-3.5">
                USE DEMO QR →
              </button>
              <button className="btn-primary w-full !py-3">
                Enter code manually
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
                    <span className="font-[family-name:var(--font-ibm-plex-mono)] font-bold text-sm">CP</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight font-[family-name:var(--font-ibm-plex-mono)]">Chai Point</h2>
                    <span className="text-[11px] border-[1.5px] border-ink rounded-[50px] px-2 py-0.5 font-[family-name:var(--font-ibm-plex-mono)]">QR Verified</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Amount */}
                <div className="text-center">
                  <p className="text-xs text-muted uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)] mb-2">Amount</p>
                  <p className="text-5xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink">₹500.00</p>
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
                      {quoteLoading ? <Skeleton className="h-4 w-20 inline-block" /> : `1 ${selectedAsset} = ${(200 / (quote?.usdcAmount || 2.40)).toFixed(2)} INR`}
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
                      +25 ⭐ STAR
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button 
                  onClick={() => createTxMutation.mutate()}
                  disabled={createTxMutation.isPending}
                  className="btn-accent w-full !py-4 !text-base"
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

        {/* STEP 5: SUCCESS (Window Frame) */}
        {(step === "SUCCESS" || step === "REWARD") && (
          <motion.div key="success" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
            <PaymentSuccess 
              amount="500" 
              currency="INR" 
              merchantName="Chai Point" 
              onDone={() => router.push("/dashboard")}
              starEarned={25}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
