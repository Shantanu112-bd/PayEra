"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../components/layout/TopBar";

export default function MerchantQrCodesPage() {
  const [amount, setAmount] = useState("");
  const [storeId, setStoreId] = useState("");

  const { data: merchant, isLoading } = useQuery({
    queryKey: ["my-merchant"],
    queryFn: () => cryptoPaySdk.merchants.getMyMerchant(),
  });

  const createQrMutation = useMutation({
    mutationFn: () => {
      if (!merchant) throw new Error("No merchant loaded");
      const payload: { amount?: string; storeId?: string } = {};
      if (amount) payload.amount = amount;
      if (storeId) payload.storeId = storeId;
      return cryptoPaySdk.merchants.createQrCode(merchant.id, payload);
    },
    onSuccess: () => {
      setAmount("");
      setStoreId("");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="QR Codes" />
        <div className="flex justify-center pt-20">
          <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="QR Codes" />
        <p className="px-[20px] pt-8 text-center text-on-surface-variant">Merchant profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/merchant" title="QR Codes" />

      <div className="px-[20px] pt-1 space-y-5">
        <p className="text-[14px] text-on-surface-variant">Generate UPI QR codes for your stores.</p>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">add_circle</span>
            <p className="text-[16px] font-bold text-on-background">Generate New QR</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-on-surface-variant">Amount (Optional)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-surface-container rounded-[14px] px-4 py-3 text-[15px] text-on-background outline-none border border-outline-variant focus:border-primary"
            />
            <p className="text-[12px] text-on-surface-variant">Leave blank for dynamic amount entered by the customer.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-on-surface-variant">Store ID / Register ID</label>
            <input
              type="text"
              placeholder="e.g. STORE_1_REG_1"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full bg-surface-container rounded-[14px] px-4 py-3 text-[15px] text-on-background outline-none border border-outline-variant focus:border-primary"
            />
          </div>

          <button
            onClick={() => createQrMutation.mutate()}
            disabled={createQrMutation.isPending}
            className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">
              {createQrMutation.isPending ? "progress_activity" : "qr_code_2"}
            </span>
            Generate QR
          </button>

          {createQrMutation.isSuccess && (
            <p className="text-primary text-[13px] text-center">QR code generated successfully.</p>
          )}
          {createQrMutation.isError && (
            <p className="text-error text-[13px] text-center">
              {(createQrMutation.error as Error).message || "Failed to generate QR."}
            </p>
          )}
        </div>

        <div className="bg-surface-container rounded-[24px] border border-dashed border-outline-variant flex flex-col items-center justify-center py-12 text-center">
          <span className="material-symbols-outlined text-on-surface-variant text-[40px] mb-2">qr_code_2</span>
          <p className="text-[15px] font-semibold text-on-background">Your generated QRs</p>
          <p className="text-[13px] text-on-surface-variant">They will appear here once generated.</p>
        </div>
      </div>
    </div>
  );
}
