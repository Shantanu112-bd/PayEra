"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../components/layout/TopBar";
import { MerchantStatus } from "../../../components/stellar/MerchantStatus";

const inputCls =
  "w-full bg-surface-container rounded-[14px] px-4 py-3 text-[15px] text-on-background outline-none border border-outline-variant focus:border-primary";
const disabledInputCls =
  "w-full bg-surface-container rounded-[14px] px-4 py-3 text-[15px] text-on-surface-variant border border-outline-variant cursor-not-allowed";

export default function MerchantProfilePage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    displayName: "",
    legalName: "",
    defaultUpiVpa: "",
    category: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const { data: merchant, isLoading } = useQuery({
    queryKey: ["my-merchant"],
    queryFn: () => cryptoPaySdk.merchants.getMyMerchant(),
  });

  useEffect(() => {
    if (merchant) {
      setFormData({
        displayName: merchant.displayName || "",
        legalName: merchant.legalName || "",
        defaultUpiVpa: merchant.defaultUpiVpa || "",
        category: merchant.category || "",
        city: merchant.city || "",
        state: merchant.state || "",
        country: merchant.country || "",
        postalCode: merchant.postalCode || "",
      });
    }
  }, [merchant]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof formData>) => {
      if (!merchant) throw new Error("No merchant loaded");
      return cryptoPaySdk.merchants.updateMerchant(merchant.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-merchant"] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="Merchant Settings" />
        <div className="flex justify-center pt-20">
          <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant" title="Merchant Settings" />
        <p className="px-[20px] pt-8 text-center text-on-surface-variant">
          Merchant profile not found. Are you registered?
        </p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/merchant" title="Merchant Settings" />

      <form onSubmit={handleSubmit} className="px-[20px] pt-1 space-y-5">
        {/* On-chain status */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5">
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
            Compliance Status
          </p>
          <MerchantStatus merchantId={merchant.id} />
        </div>

        {/* Business info */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
            <p className="text-[16px] font-bold text-on-background">Business Information</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-on-surface-variant">Display Name</label>
            <input name="displayName" value={formData.displayName} onChange={handleChange} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-on-surface-variant">Legal Name</label>
            <input name="legalName" value={formData.legalName} disabled className={disabledInputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-on-surface-variant">Default UPI VPA</label>
            <input name="defaultUpiVpa" value={formData.defaultUpiVpa} onChange={handleChange} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-on-surface-variant">Category</label>
            <input name="category" value={formData.category} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        {/* Location */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            <p className="text-[16px] font-bold text-on-background">Location</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-on-surface-variant">City</label>
              <input name="city" value={formData.city} onChange={handleChange} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-on-surface-variant">State</label>
              <input name="state" value={formData.state} onChange={handleChange} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-on-surface-variant">Country</label>
              <input name="country" value={formData.country} onChange={handleChange} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-on-surface-variant">Postal Code</label>
              <input name="postalCode" value={formData.postalCode} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        {updateMutation.isSuccess && <p className="text-primary text-[13px]">Profile updated successfully.</p>}
        {updateMutation.isError && (
          <p className="text-error text-[13px]">{(updateMutation.error as Error).message || "Failed to update."}</p>
        )}

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">
            {updateMutation.isPending ? "progress_activity" : "save"}
          </span>
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
