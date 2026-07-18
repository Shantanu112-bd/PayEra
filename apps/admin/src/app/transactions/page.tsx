"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Transaction } from "@cryptopay/types";

export default function AdminTransactionsPage() {
  const [page, setPage] = React.useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-transactions", page],
    queryFn: () => cryptoPaySdk.admin.listTransactions({ page, limit: 20 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-gray-500">Monitor platform-wide payments and settlements.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">TxID</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Asset</th>
                  <th className="px-6 py-3 font-medium">Merchant ID</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data?.map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">
                      {tx.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">{tx.amountInPaise}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono">{tx.assetIn}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {tx.merchantId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        tx.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        tx.status === "FAILED" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {tx.status}
                      </span>
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
