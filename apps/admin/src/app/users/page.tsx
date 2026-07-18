"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import Link from "next/link";
import { User } from "@cryptopay/types";

export default function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => cryptoPaySdk.admin.listUsers({ page, limit: 20 }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-gray-500">Manage all consumer and merchant operators.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email / Phone</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">KYC Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data?.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.displayName || "Unknown"}</td>
                    <td className="px-6 py-4 text-gray-500">{user.email || user.phoneE164 || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-mono">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        user.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                        user.status === "SUSPENDED" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.kycStatus || "NOT_STARTED"}</td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/users/${user.id}`}
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
