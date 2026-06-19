"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import freighterApi from "@stellar/freighter-api";
const { isConnected, requestAccess, getAddress } = freighterApi;
import { fetchBalances, BalanceMap, getStarBalanceFromContract } from "@/lib/stellar";
import { useAppStore } from "@/lib/store";

interface StellarWalletContextType {
  publicKey: string | null;
  isWalletInstalled: boolean;
  isConnecting: boolean;
  balances: BalanceMap;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
}

const StellarWalletContext = createContext<StellarWalletContextType | undefined>(undefined);

export function StellarWalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balances, setBalances] = useState<BalanceMap>({ XLM: "0.00", USDC: "0.00", STAR: "0.00" });

  useEffect(() => {
    // Check if Freighter is installed
    const checkFreighter = async () => {
      if (await isConnected()) {
        setIsWalletInstalled(true);
      }
    };
    checkFreighter();
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) return;
    const isValidStellarAddress = /^G[A-Z2-7]{55}$/.test(publicKey);
    if (!isValidStellarAddress) {
      setBalances({ XLM: "100.00", USDC: "50.00", STAR: "150.00" });
      return;
    }
    try {
      const b = await fetchBalances(publicKey);
      const starBal = await getStarBalanceFromContract(publicKey);
      b.STAR = starBal;
      setBalances(b);
    } catch (error) {
      console.error("Failed to fetch balances", error);
    }
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      refreshBalances();
    } else {
      setBalances({ XLM: "0.00", USDC: "0.00", STAR: "0.00" });
    }
  }, [publicKey, refreshBalances]);

  const { currentUserId, isDemoMode } = useAppStore();

  const connect = async () => {
    setIsConnecting(true);
    try {
      if (!isWalletInstalled) {
        if (isDemoMode) {
          // Fallback for demo when no wallet is installed
          setPublicKey("GBRP4ZDXSSQAJTZT25ZBQ55ZBQ55ZBQ55ZBQ55ZBQ55ZBQ55ZBQ55ZBQ");
          return;
        } else {
          throw new Error("Freighter wallet is not installed. Please install Freighter extension.");
        }
      }
      
      const access = await requestAccess();
      if (access) {
        const result = await getAddress();
        if (result && !result.error && result.address) {
          setPublicKey(result.address);
        } else {
          throw new Error(result?.error || "Failed to get wallet address");
        }
      } else {
        throw new Error("Access denied by user");
      }
    } catch (e: any) {
      console.error("Wallet connection failed", e);
      alert(e.message || "Failed to connect to Freighter wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setPublicKey(null);
  };

  return (
    <StellarWalletContext.Provider 
      value={{
        publicKey,
        isWalletInstalled,
        isConnecting,
        balances,
        connect,
        disconnect,
        refreshBalances
      }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet() {
  const context = useContext(StellarWalletContext);
  if (context === undefined) {
    throw new Error("useStellarWallet must be used within a StellarWalletProvider");
  }
  return context;
}
