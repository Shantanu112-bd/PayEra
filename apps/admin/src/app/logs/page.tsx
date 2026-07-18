"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";

export default function AdminLogsPage() {
  const [page, setPage] = React.useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", page],
    queryFn: () => cryptoPaySdk.admin.listLogs({ page, limit: 30 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-gray-500">Security and action history for the CryptoPay network.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Actor User ID</th>
                  <th className="px-6 py-3 font-medium">Target</th>
                  <th className="px-6 py-3 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-xs text-indigo-700 bg-indigo-50/50">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {log.actorUserId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {log.targetType}: {log.targetId ? `${log.targetId.substring(0, 8)}...` : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-[10px] break-all max-w-xs">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
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
