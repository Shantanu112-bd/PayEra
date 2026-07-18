"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Loader2, Save, Store, Mail, MapPin } from "lucide-react";
import { MerchantStatus } from "@/components/stellar/MerchantStatus";

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
      alert("Profile updated successfully!");
    }
  });

  if (isLoading) {
    return <div className="p-8 max-w-3xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!merchant) {
    return <div className="p-8 max-w-3xl mx-auto text-center text-gray-500">Merchant profile not found. Are you registered?</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Merchant Settings</h1>
        <p className="text-gray-500 mt-1">Manage your business profile and compliance status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border-[1.5px] border-black rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Store className="w-5 h-5" /> Business Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Display Name</label>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Legal Name</label>
                <input
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleChange}
                  disabled
                  className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Default UPI VPA</label>
                <input
                  name="defaultUpiVpa"
                  value={formData.defaultUpiVpa}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            </div>

            <h2 className="text-lg font-bold flex items-center gap-2 pt-4 border-t border-gray-100">
              <MapPin className="w-5 h-5" /> Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">City</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">State</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Country</label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Postal Code</label>
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <MerchantStatus merchantId={merchant.id} />
        </div>
      </div>
    </div>
  );
}
