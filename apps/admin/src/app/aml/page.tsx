"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Loader2, ShieldAlert, ShieldCheck, Shield, Search, AlertTriangle } from "lucide-react";
import { Skeleton } from "@cryptopay/ui";

export default function AmlDashboardPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [addressToScreen, setAddressToScreen] = React.useState("");

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["aml-screen", addressToScreen],
    queryFn: () => cryptoPaySdk.aml.screenWallet(addressToScreen),
    enabled: !!addressToScreen,
    retry: false,
  });

  const handleScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setAddressToScreen(searchInput.trim());
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          AML Risk Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Screen Stellar wallets against sanctioned lists and suspicious activity patterns.
        </p>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl p-6">
        <form onSubmit={handleScreen} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Enter Stellar Wallet Address (e.g. GBRP4...)" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
          <button 
            type="submit"
            disabled={!searchInput.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Screen Address"}
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4 text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold mb-1">Screening Failed</h3>
            <p className="text-sm">{(error as any)?.message || "Failed to retrieve AML screening results. Ensure the address is valid."}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {result.isHighRisk ? (
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {result.isHighRisk ? "High Risk Detected" : "Low Risk (Clear)"}
                </h2>
                <p className="text-xs text-muted-foreground font-mono">{result.address}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{result.score}/100</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Risk Score</div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-white">Screening Flags</h3>
            {result.flags.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-muted-foreground text-center">
                No suspicious activity or sanctions flags found for this address.
              </div>
            ) : (
              <ul className="space-y-2">
                {result.flags.map((flag: string, i: number) => (
                  <li key={i} className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-medium flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4" />
                    {flag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
