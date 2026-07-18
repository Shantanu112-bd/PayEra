"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import Link from "next/link";
import { Merchant } from "@cryptopay/types";

export default function AdminMerchantsPage() {
  const [page, setPage] = React.useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchants", page],
    queryFn: () => cryptoPaySdk.admin.listMerchants({ page, limit: 20 }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Merchants</h1>
          <p className="text-sm text-gray-500">Manage approved, pending, and suspended merchants.</p>
        </div>
        <Link 
          href="/merchants/pending" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          View Pending Queue
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading merchants...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Business Name</th>
                  <th className="px-6 py-3 font-medium">Merchant Code</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">KYC State</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data?.map((merchant: Merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{merchant.displayName}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{merchant.merchantCode}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        merchant.status === "APPROVED" ? "bg-green-100 text-green-700" :
                        merchant.status === "SUSPENDED" ? "bg-red-100 text-red-700" :
                        merchant.status === "REJECTED" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {merchant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">-</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(merchant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/merchants/${merchant.id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {data?.meta?.page ?? 1} of {data?.meta?.totalPages ?? 1}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={!data?.meta?.hasPreviousPage}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border border-gray-200 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              disabled={!data?.meta?.hasNextPage}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-gray-200 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
