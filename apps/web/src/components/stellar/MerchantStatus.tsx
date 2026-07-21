"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { CheckCircle, AlertCircle, Clock, HelpCircle } from "lucide-react";

interface MerchantStatusProps {
  merchantId: string;
  className?: string;
}

export function MerchantStatus({ merchantId, className = "" }: MerchantStatusProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["merchant-status", merchantId],
    queryFn: () => cryptoPaySdk.stellar.getMerchantStatus(merchantId),
    enabled: !!merchantId,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Checking...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <HelpCircle className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-500">Status unknown</span>
      </div>
    );
  }

  const isApproved = data.isApproved;
  const onChainData = data.onChainData;

  if (isApproved) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <CheckCircle className="w-5 h-5 text-[#A3B359]" />
        <span className="text-sm font-medium text-[#1A1A1A]">On-chain: Approved</span>
        {onChainData && (
          <span className="text-[10px] font-mono text-gray-400 ml-1">
            ID: {onChainData.id?.slice(0, 8)}...
          </span>
        )}
      </div>
    );
  }

  // Check if merchant exists on-chain but not approved
  const status = onChainData?.status || "UNKNOWN";

  if (status === "PENDING") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-5 h-5 text-yellow-500" />
        <span className="text-sm font-medium text-yellow-600">On-chain: Pending Review</span>
      </div>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <span className="text-sm font-medium text-orange-600">On-chain: Suspended</span>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium text-red-600">On-chain: Rejected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-5 h-5 text-gray-400" />
      <span className="text-sm font-medium text-gray-500">Not registered on-chain</span>
    </div>
  );
}