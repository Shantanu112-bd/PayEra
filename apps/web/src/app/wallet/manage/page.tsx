"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useStellarWallet } from "../../../components/providers/StellarWalletProvider";
import { hasUsdcTrustline, addUsdcTrustline } from "../../../lib/trustline";
import { signTransaction } from "@stellar/freighter-api";

export default function ManageWalletsPage() {
  const qc = useQueryClient();
  const { publicKey, connect } = useStellarWallet();
  const [hasTrustline, setHasTrustline] = React.useState<boolean | null>(null);
  const [trustlineLoading, setTrustlineLoading] = React.useState(false);

  const { data: wallets, isLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  React.useEffect(() => {
    if (!publicKey) return;
    hasUsdcTrustline(publicKey).then(setHasTrustline);
  }, [publicKey]);

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => cryptoPaySdk.wallets.disconnect(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
  });

  const handleAddTrustline = async () => {
    if (!publicKey) return;
    setTrustlineLoading(true);
    try {
      const xdr = await addUsdcTrustline(publicKey);
      const { signedTxXdr: signedTransaction } = await signTransaction(xdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });
      const { Horizon, TransactionBuilder } = await import("@stellar/stellar-sdk");
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      await server.submitTransaction(
        TransactionBuilder.fromXDR(signedTransaction, "Test SDF Network ; September 2015")
      );
      setHasTrustline(true);
    } catch (e) {
      console.error(e);
    } finally {
      setTrustlineLoading(false);
    }
  };

  const walletList = wallets?.data ?? [];

  return (
    <div className="space-y-4 pb-8">
      {/* Top bar */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/wallet">
          <button className="p-2 rounded-full bg-surface-container text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </Link>
        <h1 className="text-xl font-bold text-on-surface">Manage Wallets</h1>
      </div>

      {/* Connected wallets */}
      <div className="bg-surface-container-lowest rounded-[24px] p-4">
        <h2 className="font-semibold text-on-surface text-sm mb-3">Connected Wallets</h2>
        {isLoading ? (
          <div className="text-sm text-on-surface-variant text-center py-4">Loading…</div>
        ) : walletList.length === 0 ? (
          <div className="text-sm text-on-surface-variant text-center py-4">No wallets connected</div>
        ) : (
          walletList.map((w) => (
            <div key={w.id} className="flex items-center gap-3 py-3 border-b border-outline-variant last:border-0">
              <span className="material-symbols-outlined text-on-surface-variant">account_balance_wallet</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-on-surface text-sm">{w.label || "Wallet"}</span>
                  {w.isPrimary && (
                    <span className="text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-semibold">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-on-surface-variant">
                  {w.publicKey ? `${w.publicKey.slice(0, 8)}...${w.publicKey.slice(-4)}` : "—"}
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Disconnect this wallet?")) disconnectMutation.mutate(w.id);
                }}
                disabled={disconnectMutation.isPending}
                className="p-2 rounded-full bg-bg-error-container text-error disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">link_off</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Connect new wallet */}
      <button
        onClick={connect}
        className="w-full bg-primary text-on-primary font-bold py-4 rounded-full flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">add</span>
        Connect New Wallet
      </button>

      {/* Trustline section */}
      {publicKey && (
        <div className="bg-surface-container-lowest rounded-[24px] p-4">
          <h2 className="font-semibold text-on-surface text-sm mb-3">USDC Trustline</h2>
          {hasTrustline === null ? (
            <div className="text-sm text-on-surface-variant">Checking…</div>
          ) : hasTrustline ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
              <span className="text-on-surface">USDC trustline active</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Add a USDC trustline to receive and hold USDC in your Stellar wallet.
              </p>
              <button
                onClick={handleAddTrustline}
                disabled={trustlineLoading}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-full disabled:opacity-40"
              >
                {trustlineLoading ? "Adding…" : "Add USDC Trustline"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
