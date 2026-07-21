"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: merchant, isLoading } = useQuery({
    queryKey: ["admin-merchant", id],
    queryFn: () => cryptoPaySdk.merchants.getMerchant(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => cryptoPaySdk.admin.approveMerchant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-merchant", id] }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => cryptoPaySdk.admin.rejectMerchant(id, "Rejected by admin"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-merchant", id] }),
  });

  const suspendMutation = useMutation({
    mutationFn: () => cryptoPaySdk.admin.suspendMerchant(id, "Suspended by admin"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-merchant", id] }),
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse text-gray-500">Loading merchant details...</div>;
  }

  if (!merchant) {
    return (
      <div className="p-8 text-center text-gray-500 space-y-4">
        <div>Merchant not found.</div>
        <button onClick={() => router.back()} className="text-indigo-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/merchants" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Merchants
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{merchant.displayName}</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">ID: {merchant.id}</p>
          </div>
          <div className="flex gap-2">
            {merchant.status === "PENDING" && (
              <>
                <button 
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </>
            )}
            {merchant.status === "APPROVED" && (
              <button 
                onClick={() => suspendMutation.mutate()}
                disabled={suspendMutation.isPending}
                className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Suspend
              </button>
            )}
            {merchant.status === "SUSPENDED" && (
              <button 
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
              >
                Restore Account
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Business Information</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <span className="block text-gray-500 mb-1">Legal Name</span>
              <span className="font-medium">{merchant.legalName}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Merchant Code</span>
              <span className="font-medium font-mono">{merchant.merchantCode}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Category</span>
              <span className="font-medium capitalize">{merchant.category || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Status</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold inline-block ${
                merchant.status === "APPROVED" ? "bg-green-100 text-green-700" :
                merchant.status === "SUSPENDED" ? "bg-red-100 text-red-700" :
                merchant.status === "REJECTED" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {merchant.status}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">GSTIN</span>
              <span className="font-medium font-mono">{merchant.gstin || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Joined</span>
              <span className="font-medium">{new Date(merchant.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Location & Settlement</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="col-span-2">
              <span className="block text-gray-500 mb-1">Default Settlement VPA</span>
              <span className="font-medium font-mono bg-gray-50 p-2 rounded block">{merchant.defaultUpiVpa || "Not configured"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">City</span>
              <span className="font-medium">{merchant.city || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">State</span>
              <span className="font-medium">{merchant.state || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Postal Code</span>
              <span className="font-medium">{merchant.postalCode || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Country</span>
              <span className="font-medium">{merchant.country || "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
