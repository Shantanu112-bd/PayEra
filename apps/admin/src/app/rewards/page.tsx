"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";

export default function AdminRewardsPage() {
  const [page, setPage] = React.useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-rewards", page],
    queryFn: () => cryptoPaySdk.admin.listRewards({ page, limit: 20 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
        <p className="text-sm text-gray-500">Monitor STAR token minting events.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading rewards...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Reward ID</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Amount (STAR)</th>
                  <th className="px-6 py-3 font-medium">TxID (Stellar)</th>
                  <th className="px-6 py-3 font-medium">User ID</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data?.map((reward: any) => (
                  <tr key={reward.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">
                      {reward.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(reward.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-yellow-600">
                      +{reward.starAmount}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {reward.onChainTxHash ? `${reward.onChainTxHash.substring(0, 8)}...` : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {reward.userId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        reward.status === "MINTED" ? "bg-green-100 text-green-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {reward.status}
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
