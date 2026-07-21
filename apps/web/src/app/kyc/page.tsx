"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useAppStore } from "../../lib/store";
import { TopBar } from "../../components/layout/TopBar";

export default function KycPage() {
  const router = useRouter();
  const { kycStatus, setKycStatus } = useAppStore();
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: () => cryptoPaySdk.kyc.getStatus(),
    refetchInterval: kycStatus === "PENDING" ? 5000 : false,
  });

  useEffect(() => {
    if (data?.kycStatus) setKycStatus(data.kycStatus);
  }, [data, setKycStatus]);

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
      const res = await cryptoPaySdk.kyc.start();
      setKycStatus("PENDING");
      // If provider returns a hosted verification URL, open it
      if (res?.verificationUrl) window.open(res.verificationUrl, "_blank");
    } catch (e: any) {
      setError(e?.message || "Could not start verification");
    } finally {
      setStarting(false);
    }
  };

  const status = kycStatus || "NONE";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar title="Identity Verification" />
      <div className="flex-1 flex flex-col items-center justify-center px-[20px] gap-[24px] text-center pb-24">
        {(status === "NONE" || status === "NOT_STARTED") && (
          <>
            <div className="h-24 w-24 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl">badge</span>
            </div>
            <div>
              <h2 className="text-[24px] font-bold text-on-background">Verify Your Identity</h2>
              <p className="text-on-surface-variant mt-2 text-sm max-w-xs">
                Complete a quick KYC check to unlock payments, deposits and withdrawals.
              </p>
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full py-4 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-70 active:scale-[0.98] transition-transform"
            >
              {starting ? "Starting..." : "Start Verification"}
            </button>
          </>
        )}

        {(status === "PENDING" || status === "IN_REVIEW") && (
          <>
            <div className="h-24 w-24 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl animate-pulse">hourglass_top</span>
            </div>
            <div>
              <h2 className="text-[24px] font-bold text-on-background">Verification in Progress</h2>
              <p className="text-on-surface-variant mt-2 text-sm max-w-xs">
                We&apos;re reviewing your documents. This usually takes a few minutes — this page updates automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant text-xs">
              <span className="status-dot" />
              Checking status…
            </div>
          </>
        )}

        {status === "VERIFIED" && (
          <>
            <div className="h-24 w-24 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
            <div>
              <h2 className="text-[24px] font-bold text-on-background">Verification Complete</h2>
              <p className="text-on-surface-variant mt-2 text-sm max-w-xs">
                Your identity has been verified. You&apos;re all set.
              </p>
            </div>
            <button
              onClick={() => router.replace("/dashboard")}
              className="w-full py-4 rounded-full bg-primary text-on-primary font-semibold active:scale-[0.98] transition-transform"
            >
              Continue to App
            </button>
          </>
        )}

        {status === "REJECTED" && (
          <>
            <div className="h-24 w-24 rounded-full bg-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-5xl">cancel</span>
            </div>
            <div>
              <h2 className="text-[24px] font-bold text-on-background">Verification Failed</h2>
              <p className="text-on-surface-variant mt-2 text-sm max-w-xs">
                We couldn&apos;t verify your identity. Please review your details and try again.
              </p>
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full py-4 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-70 active:scale-[0.98] transition-transform"
            >
              {starting ? "Starting..." : "Try Again"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
