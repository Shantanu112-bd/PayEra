"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle, ShieldAlert } from "lucide-react";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => cryptoPaySdk.users.getProfile(id),
  });

  // Admin status update mutations
  const updateStatusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "SUSPENDED" | "DELETED") => {
      if (status === "ACTIVE") return cryptoPaySdk.users.activate(id);
      if (status === "SUSPENDED") return cryptoPaySdk.users.suspend(id);
      return cryptoPaySdk.users.softDelete(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user", id] }),
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse text-gray-500">Loading user details...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-gray-500 space-y-4">
        <div>User not found.</div>
        <button onClick={() => router.back()} className="text-indigo-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/users" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.displayName || "Unknown User"}</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">ID: {user.id}</p>
          </div>
          <div className="flex gap-2">
            {user.status === "ACTIVE" ? (
              <button 
                onClick={() => updateStatusMutation.mutate("SUSPENDED")}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 flex items-center gap-2"
              >
                <Ban className="w-4 h-4" /> Suspend
              </button>
            ) : user.status === "SUSPENDED" ? (
              <button 
                onClick={() => updateStatusMutation.mutate("ACTIVE")}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Activate
              </button>
            ) : null}
            <button 
              onClick={() => {
                if(window.confirm("Are you sure you want to delete this user?")) {
                  updateStatusMutation.mutate("DELETED");
                }
              }}
              disabled={updateStatusMutation.isPending}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Profile Details</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <span className="block text-gray-500 mb-1">Display Name</span>
              <span className="font-medium">{user.displayName || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Role</span>
              <span className="font-medium font-mono bg-gray-50 px-2 py-1 rounded">{user.role}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Email</span>
              <span className="font-medium">{user.email || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Phone (E164)</span>
              <span className="font-medium">{user.phoneE164 || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Status</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold inline-block ${
                user.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                user.status === "SUSPENDED" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {user.status}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Joined</span>
              <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Compliance & KYC</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="col-span-2">
              <span className="block text-gray-500 mb-1">KYC Status</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                user.kycStatus === "APPROVED" ? "bg-green-100 text-green-700" :
                user.kycStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {user.kycStatus || "NOT_STARTED"}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Referral Code</span>
              <span className="font-medium font-mono">{user.referralCode || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Last Login</span>
              <span className="font-medium">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
