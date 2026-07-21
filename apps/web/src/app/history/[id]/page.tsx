"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import Link from "next/link";
import { ArrowLeft, Ban } from "lucide-react";
import { TransactionStatusDisplay } from "@/components/stellar/TransactionStatus";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: transaction, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => cryptoPaySdk.transactions.getTransaction(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cryptoPaySdk.transactions.cancelTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["transaction-status", id] });
    }
  });

  if (isLoading) {
    return <div className="p-8 max-w-2xl mx-auto animate-pulse">Loading transaction...</div>;
  }

  if (!transaction) {
    return (
      <div className="p-8 text-center text-gray-500 space-y-4 max-w-2xl mx-auto">
        <div>Transaction not found.</div>
        <button onClick={() => router.back()} className="text-indigo-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  // Only allow cancellation if status is not final
  const isCancellable = ["CREATED", "QUOTED", "AUTHORIZED"].includes(transaction.status);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <Link href="/history" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transaction Details</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">{transaction.publicId}</p>
          </div>
          <div className="text-3xl font-bold font-mono text-ink">
            ₹{(Number(transaction.amountInPaise) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {isCancellable && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel this transaction?")) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2"
            >
              <Ban className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Render the extracted TransactionStatus component */}
      <TransactionStatusDisplay transactionId={id} />

      {/* Additional Details that might not be in the status component */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold">Metadata</h2>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <span className="block text-gray-500 mb-1">Merchant</span>
            <span className="font-medium truncate block">{transaction.merchantId}</span>
          </div>
          <div>
            <span className="block text-gray-500 mb-1">Created At</span>
            <span className="font-medium">{new Date(transaction.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="block text-gray-500 mb-1">Network Fee</span>
            <span className="font-medium font-mono">{transaction.networkFeePaise ? `₹${(Number(transaction.networkFeePaise)/100).toFixed(2)}` : "-"}</span>
          </div>
          <div>
            <span className="block text-gray-500 mb-1">Payment Rail</span>
            <span className="font-medium">{transaction.rail}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
