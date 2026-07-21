"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Merchant } from "@cryptopay/types";

export default function PendingMerchantsPage() {
  const queryClient = useQueryClient();
  
  const { data: merchants, isLoading } = useQuery({
    queryKey: ["admin-pending-merchants"],
    queryFn: () => cryptoPaySdk.admin.listPendingMerchants(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => cryptoPaySdk.admin.approveMerchant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pending-merchants"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => cryptoPaySdk.admin.rejectMerchant(id, "Rejected by admin"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pending-merchants"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pending Merchants</h1>
          <p className="text-sm text-gray-500">Review and approve new merchant applications.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading pending merchants...</div>
        ) : !merchants || merchants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending merchants to review.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Business Name</th>
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">VPA</th>
                  <th className="px-6 py-3 font-medium">Applied On</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {merchants.map((merchant: Merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{merchant.displayName}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{merchant.merchantCode}</td>
                    <td className="px-6 py-4 text-gray-500">{merchant.defaultUpiVpa || "-"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(merchant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => rejectMutation.mutate(merchant.id)}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                        className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-md font-medium text-xs disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveMutation.mutate(merchant.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-md font-medium text-xs disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
