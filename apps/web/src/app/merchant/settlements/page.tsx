"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { Transaction } from "@cryptopay/types";

export default function SettlementsDashboard() {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  
  const { data: transactionsRes, isLoading } = useQuery({
    queryKey: ["merchant-settlements"],
    // Fetch all transactions to see their settlement statuses
    queryFn: () => cryptoPaySdk.transactions.listTransactions(),
  });

  const transactions = transactionsRes?.data || [];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(transactions.map((tx: Transaction) => tx.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleReconcile = () => {
    alert(`[MOCK ONLY] Cannot reconcile ${selectedIds.length} transactions. The backend lacks a batch settlement update endpoint. Please implement POST /settlements/batch.`);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/merchant" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-400" />
              Settlements
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Track your bank payouts and reconciliation status.</p>
          </div>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-medium">
              Demo Only (Requires Backend)
            </span>
            <button 
              onClick={handleReconcile}
              className="bg-emerald-600/50 hover:bg-emerald-700/50 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors border border-emerald-500/50"
            >
              Mark Reconciled ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-white">
            <thead className="text-xs text-muted-foreground uppercase bg-black/40 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={transactions.length > 0 && selectedIds.length === transactions.length}
                    className="rounded bg-black border-white/20 text-emerald-500 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Settlement Amount</th>
                <th className="px-6 py-4">VPA (Rails)</th>
                <th className="px-6 py-4">Bank Ref</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No settlements found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: Transaction) => {
                  const settlement = tx.settlementInstruction;
                  const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-";
                  const amount = settlement ? `₹${(Number(settlement.amountPaise) / 100).toFixed(2)}` : "-";
                  const status = settlement?.status || "PENDING";
                  
                  let statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  if (status === "CONFIRMED") statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  if (status === "FAILED") statusColor = "text-red-400 bg-red-500/10 border-red-500/20";

                  return (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(tx.id)}
                          onChange={() => handleSelect(tx.id)}
                          className="rounded bg-black border-white/20 text-emerald-500 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{tx.publicId || tx.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">{date}</td>
                      <td className="px-6 py-4 font-bold">{amount}</td>
                      <td className="px-6 py-4 font-mono text-xs">{tx.merchantUpiVpa || "-"}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{settlement?.mockReference || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
