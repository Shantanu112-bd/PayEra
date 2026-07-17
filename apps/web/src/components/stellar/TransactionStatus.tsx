"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import {
  Circle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ExternalLink
} from "lucide-react";

type TransactionStatus =
  | "CREATED"
  | "QUOTED"
  | "AUTHORIZED"
  | "CONVERTING"
  | "ROUTING_STELLAR"
  | "SETTLING"
  | "REWARDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

interface TransactionStatusProps {
  transactionId: string;
  className?: string;
}

const STATUS_CONFIG: Record<TransactionStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  CREATED: { label: "Created", icon: <Circle className="w-4 h-4" />, color: "text-gray-500", bgColor: "bg-gray-100" },
  QUOTED: { label: "Quoted", icon: <Circle className="w-4 h-4" />, color: "text-blue-500", bgColor: "bg-blue-50" },
  AUTHORIZED: { label: "Authorized", icon: <Circle className="w-4 h-4" />, color: "text-blue-600", bgColor: "bg-blue-100" },
  CONVERTING: { label: "Converting", icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "text-yellow-500", bgColor: "bg-yellow-50" },
  ROUTING_STELLAR: { label: "Routing on Stellar", icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "text-purple-500", bgColor: "bg-purple-50" },
  SETTLING: { label: "Settling UPI", icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "text-orange-500", bgColor: "bg-orange-50" },
  REWARDING: { label: "Minting STAR", icon: <Sparkles className="w-4 h-4 animate-pulse" />, color: "text-green-500", bgColor: "bg-green-50" },
  COMPLETED: { label: "Completed", icon: <CheckCircle className="w-4 h-4" />, color: "text-[#A3B359]", bgColor: "bg-[#F0F2E8]" },
  FAILED: { label: "Failed", icon: <AlertCircle className="w-4 h-4" />, color: "text-red-500", bgColor: "bg-red-50" },
  CANCELLED: { label: "Cancelled", icon: <AlertCircle className="w-4 h-4" />, color: "text-gray-500", bgColor: "bg-gray-100" },
};

const STATUS_ORDER: TransactionStatus[] = [
  "CREATED", "QUOTED", "AUTHORIZED", "CONVERTING",
  "ROUTING_STELLAR", "SETTLING", "REWARDING", "COMPLETED"
];

export function TransactionStatusDisplay({ transactionId, className = "" }: TransactionStatusProps) {
  const { data: transaction, isLoading, error, refetch } = useQuery({
    queryKey: ["transaction-status", transactionId],
    queryFn: () => cryptoPaySdk.transactions.getTransaction(transactionId),
    enabled: !!transactionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const activeStatuses: TransactionStatus[] = [
        "CREATED", "QUOTED", "AUTHORIZED", "CONVERTING",
        "ROUTING_STELLAR", "SETTLING", "REWARDING"
      ];
      return activeStatuses.includes(data.status as TransactionStatus) ? 2000 : false;
    },
    staleTime: 2000,
  });

  const status = (transaction?.status as TransactionStatus) || "CREATED";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;
  const currentIndex = STATUS_ORDER.indexOf(status);
  const completedSteps = currentIndex >= 0 ? currentIndex + 1 : 1;

  if (isLoading) {
    return (
      <div className={`p-4 bg-white border-[1.5px] border-black rounded-[16px] ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-black" />
          <span className="font-medium text-black">Loading transaction...</span>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className={`p-4 bg-white border-[1.5px] border-black rounded-[16px] ${className}`}>
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Failed to load transaction</span>
          <button onClick={() => refetch()} className="ml-auto text-sm underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border-[1.5px] border-black rounded-[16px] ${className}`}>
      {/* Status Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor} border-[1.5px] border-black`}>
          {config.icon}
        </div>
        <div>
          <div className="font-bold text-[16px] text-black">{config.label}</div>
          <div className="text-[12px] text-gray-500 mt-0.5">
            {transaction.merchantId}
            {transaction.publicId && <span className="ml-2 font-mono">· {transaction.publicId}</span>}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-4">
        {STATUS_ORDER.slice(0, 7).map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const stepConfig = STATUS_CONFIG[step];

          return (
            <div key={step} className="flex items-center gap-3">
              <div className="relative flex-1">
                {index < 6 && (
                  <div
                    className="absolute top-2 left-0 right-0 h-[2px] z-0"
                    style={{
                      background: isCompleted ? "#A3B359" : "#E5E5E5",
                      left: index === 0 ? "12px" : "0",
                      right: index === 5 ? "12px" : "0",
                    }}
                  />
                )}
                <div className={`relative z-10 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? "bg-[#A3B359] border-[#A3B359]" : isCurrent ? "bg-white border-black" : "bg-white border-gray-300"}`}>
                  {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                  {isCurrent && !isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
              </div>
              <div className="w-28 text-[10px] font-medium text-center truncate" style={{ color: isCompleted ? "#A3B359" : isCurrent ? "#1A1A1A" : "#999" }}>
                {stepConfig.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details */}
      <div className="space-y-2 text-[13px] border-t-[1.5px] border-gray-200 pt-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Amount</span>
          <span className="font-bold font-mono text-black">₹{(Number(transaction.amountInPaise) / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Asset</span>
          <span className="font-bold font-mono text-black">{transaction.assetIn}</span>
        </div>
        {transaction.stellarTransactionHash && (
          <div className="flex justify-between">
            <span className="text-gray-500">Stellar Hash</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] truncate max-w-[160px] text-black">
                {transaction.stellarTransactionHash}
              </span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${transaction.stellarTransactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {transaction.failureMessage && (
        <div className="mt-3 p-3 bg-red-50 border-[1.5px] border-red-200 rounded-[8px]">
          <div className="flex items-center gap-2 text-red-600 text-[12px] font-medium mb-1">
            <AlertCircle className="w-4 h-4" />
            Failed
          </div>
          <div className="text-[12px] text-red-700">{transaction.failureMessage}</div>
        </div>
      )}
    </div>
  );
}