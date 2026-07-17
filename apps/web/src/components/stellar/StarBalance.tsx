"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { getAddress } from "@stellar/freighter-api";
import { Sparkles, RefreshCw, ExternalLink } from "lucide-react";

export function StarBalance() {
  const [userAddress, setUserAddress] = React.useState<string | null>(null);

  React.useEffect(() => {
    getAddress().then(({ address }) => {
      if (address) setUserAddress(address);
    });
  }, []);

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["star-balance", userAddress],
    queryFn: () => cryptoPaySdk.stellar.getStarBalance(userAddress!),
    enabled: !!userAddress,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  if (!userAddress) return null;

  const balance = data?.starBalance || "0";
  const balanceNum = Number(balance);

  return (
    <div className="bg-white border-[1.5px] border-black rounded-[16px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#C5D483] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-mono font-bold text-[14px]">STAR Balance</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-black transition-colors"
          aria-label="Refresh balance"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="font-mono font-bold text-[36px] text-black mb-1">
        {balanceNum.toLocaleString()}
      </div>
      <div className="text-[12px] text-gray-500 mb-3">
        {balanceNum > 0 ? `≈ $${(balanceNum * 0.01).toFixed(2)} USD` : "Earn STAR by making payments"}
      </div>

      {error && (
        <div className="text-[11px] text-red-500 flex items-center gap-1">
          <span>Failed to load balance</span>
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      <button
        onClick={() => window.open(
          `https://stellar.expert/explorer/testnet/account/${userAddress}`,
          "_blank"
        )}
        className="w-full flex items-center justify-center gap-2 text-[12px] font-bold text-gray-500 hover:text-black py-2 border-t-[1.5px] border-gray-200"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View on Stellar Explorer
      </button>
    </div>
  );
}