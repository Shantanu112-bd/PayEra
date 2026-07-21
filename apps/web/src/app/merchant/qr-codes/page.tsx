"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Loader2, Plus, QrCode } from "lucide-react";

export default function MerchantQrCodesPage() {
  const queryClient = useQueryClient();
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
      // In a real app we'd append to a list, but for now just clear
      setAmount("");
      setStoreId("");
      alert("QR Code generated successfully! (Mocked)");
    }
  });

  if (isLoading) {
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!merchant) {
    return <div className="p-8 text-center text-gray-500">Merchant profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Codes</h1>
        <p className="text-gray-500 mt-1">Generate UPI QR codes for your stores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border-[1.5px] border-black rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5" /> Generate New QR
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Amount (Optional)</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
              <p className="text-xs text-gray-500">Leave blank for dynamic amount input by user.</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Store ID / Register ID</label>
              <input
                type="text"
                placeholder="e.g. STORE_1_REG_1"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            <button
              onClick={() => createQrMutation.mutate()}
              disabled={createQrMutation.isPending}
              className="w-full mt-4 px-4 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createQrMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Generate QR
            </button>
          </div>
        </div>

        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-gray-500">
          <QrCode className="w-12 h-12 mb-4 text-gray-300" />
          <p className="font-medium text-gray-900 mb-1">Your generated QRs</p>
          <p className="text-sm">They will appear here once generated.</p>
        </div>
      </div>
    </div>
  );
}
