"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useStellarWallet } from "../../components/providers/StellarWalletProvider";
import { hasUsdcTrustline, addUsdcTrustline } from "../../lib/trustline";
import { getAddress, signTransaction } from "@stellar/freighter-api";

function AssetRow({ icon, name, balance, symbol, usdValue, showTrustline, onAddTrustline }: {
  icon: string; name: string; balance: string; symbol: string; usdValue?: string;
  showTrustline?: boolean; onAddTrustline?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-outline-variant last:border-0">
      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-lg font-bold text-on-surface shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-on-surface text-sm">{name}</div>
        {usdValue && <div className="text-xs text-on-surface-variant">{usdValue}</div>}
      </div>
      <div className="text-right">
        <div className="font-mono font-bold text-on-surface text-sm">{balance} {symbol}</div>
        {showTrustline && (
          <button onClick={onAddTrustline} className="text-xs text-primary font-semibold mt-0.5">
            Add Trustline
          </button>
        )}
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { publicKey, connect, balances } = useStellarWallet();
  const [hasTrustline, setHasTrustline] = React.useState<boolean | null>(null);

  const { data: wallets } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  const { data: horizonBalances } = useQuery({
    queryKey: ["horizon-balances", publicKey],
    queryFn: async () => {
      const { address } = await getAddress();
      if (!address) return { xlm: "0.00", usdc: "0.00" };
      const { getWalletBalances } = await import("../../lib/horizon");
      return getWalletBalances(address);
    },
    enabled: !!publicKey,
    refetchInterval: 30000,
  });

  const { data: starBalance } = useQuery({
    queryKey: ["star-balance", publicKey],
    queryFn: () => cryptoPaySdk.stellar.getStarBalance(publicKey!),
    enabled: !!publicKey,
    refetchInterval: 30000,
  });

  React.useEffect(() => {
    if (!publicKey) return;
    hasUsdcTrustline(publicKey).then(setHasTrustline);
  }, [publicKey]);

  const handleAddTrustline = async () => {
    if (!publicKey) return;
    const xdr = await addUsdcTrustline(publicKey);
    const { signedTxXdr: signedTransaction } = await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
    const { Horizon } = await import("@stellar/stellar-sdk");
    const server = new Horizon.Server("https://horizon-testnet.stellar.org");
    await server.submitTransaction(await (await import("@stellar/stellar-sdk")).TransactionBuilder.fromXDR(signedTransaction, "Test SDF Network ; September 2015"));
    setHasTrustline(true);
  };

  const shortAddress = publicKey ? publicKey.slice(0, 6) + "..." + publicKey.slice(-4) : "";
  const walletList = wallets?.data ?? [];

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">account_balance_wallet</span>
        <h2 className="font-bold text-xl text-on-surface mb-2">No Wallet Connected</h2>
        <p className="text-sm text-on-surface-variant mb-6">Connect a Freighter wallet to get started.</p>
        <button onClick={connect} className="bg-primary text-on-primary font-bold px-8 py-3 rounded-full">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-on-surface">Wallet</h1>
        <Link href="/wallet/manage">
          <button className="p-2 rounded-full bg-surface-container text-on-surface">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </Link>
      </div>

      {/* Hero card */}
      <div className="bg-primary rounded-[24px] p-6 text-on-primary">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold bg-primary-container text-on-primary-container px-3 py-1 rounded-full">
            Stellar Testnet
          </span>
          <span className="text-xs opacity-70 font-mono">{shortAddress}</span>
        </div>
        <div className="text-3xl font-bold mb-1">
          {horizonBalances?.usdc ?? "0.00"} <span className="text-lg opacity-70">USDC</span>
        </div>
        <div className="text-sm opacity-70">Total balance</div>
      </div>

      {/* Assets */}
      <div className="bg-surface-container-lowest rounded-[24px] p-4">
        <h2 className="font-semibold text-on-surface mb-2 text-sm">Assets</h2>
        <AssetRow icon="✦" name="Stellar Lumens" symbol="XLM" balance={horizonBalances?.xlm ?? "0.00"} />
        <AssetRow
          icon="$" name="USD Coin" symbol="USDC" balance={horizonBalances?.usdc ?? "0.00"}
          showTrustline={hasTrustline === false}
          onAddTrustline={handleAddTrustline}
        />
        <AssetRow icon="⭐" name="STAR Rewards" symbol="STAR" balance={starBalance?.starBalanceFormatted ?? "0"} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/wallet/onramp">
          <div className="bg-surface-container rounded-[16px] p-4 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
            <span className="font-semibold text-on-surface text-sm">Deposit</span>
          </div>
        </Link>
        <Link href="/wallet/offramp">
          <div className="bg-surface-container rounded-[16px] p-4 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">arrow_circle_up</span>
            <span className="font-semibold text-on-surface text-sm">Withdraw</span>
          </div>
        </Link>
      </div>

      {/* Connected wallets */}
      <div className="bg-surface-container-lowest rounded-[24px] p-4">
        <h2 className="font-semibold text-on-surface mb-3 text-sm">Connected Wallets</h2>
        {walletList.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-4">No wallets connected</p>
        ) : (
          walletList.map((w) => (
            <div key={w.id} className="flex items-center gap-3 py-2 border-b border-outline-variant last:border-0">
              <span className="material-symbols-outlined text-on-surface-variant">account_balance_wallet</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-on-surface truncate">{w.label || "Wallet"}</div>
                <div className="text-xs font-mono text-on-surface-variant">{w.publicKey ? `${w.publicKey.slice(0, 8)}...${w.publicKey.slice(-4)}` : "—"}</div>
              </div>
              {w.isPrimary && (
                <span className="text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-semibold">Primary</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
