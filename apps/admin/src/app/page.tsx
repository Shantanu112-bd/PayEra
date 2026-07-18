"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Users, Store, ArrowLeftRight, Gift, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => cryptoPaySdk.admin.getOverview(),
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  const stats = [
    { name: "Total Users", value: overview?.users ?? 0, icon: Users, color: "text-blue-600" },
    { name: "Total Merchants", value: overview?.merchants ?? 0, icon: Store, color: "text-indigo-600" },
    { name: "Completed Transactions", value: overview?.completedTransactions ?? 0, icon: ArrowLeftRight, color: "text-green-600" },
    { name: "Failed Transactions", value: overview?.failedTransactions ?? 0, icon: AlertTriangle, color: "text-red-600" },
    { name: "Minted STAR", value: overview?.mintedRewardsStar ?? 0, icon: Gift, color: "text-yellow-600" },
    { name: "Pending Rewards", value: overview?.pendingRewards ?? 0, icon: ShieldCheck, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-sm text-gray-500">Monitor platform metrics and activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
