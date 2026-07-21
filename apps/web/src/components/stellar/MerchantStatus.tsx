"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";

interface MerchantStatusProps {
  merchantId: string;
  className?: string;
}

function Row({ icon, color, label, extra }: { icon: string; color: string; label: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
      <span className="text-[14px] font-medium text-on-background">{label}</span>
      {extra}
    </div>
  );
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
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant animate-spin">
          progress_activity
        </span>
        <span className="text-[14px] text-on-surface-variant">Checking…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={className}>
        <Row icon="help" color="text-on-surface-variant" label="Status unknown" />
      </div>
    );
  }

  const onChainData = data.onChainData;

  if (data.isApproved) {
    return (
      <div className={className}>
        <Row
          icon="check_circle"
          color="text-primary"
          label="On-chain: Approved"
          extra={
            onChainData && (
              <span className="text-[11px] font-mono text-on-surface-variant ml-1">
                ID: {onChainData.id?.slice(0, 8)}…
              </span>
            )
          }
        />
      </div>
    );
  }

  const status = onChainData?.status || "UNKNOWN";

  if (status === "PENDING") {
    return (
      <div className={className}>
        <Row icon="schedule" color="text-tertiary" label="On-chain: Pending Review" />
      </div>
    );
  }
  if (status === "SUSPENDED") {
    return (
      <div className={className}>
        <Row icon="error" color="text-error" label="On-chain: Suspended" />
      </div>
    );
  }
  if (status === "REJECTED") {
    return (
      <div className={className}>
        <Row icon="cancel" color="text-error" label="On-chain: Rejected" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Row icon="schedule" color="text-on-surface-variant" label="Not registered on-chain" />
    </div>
  );
}
