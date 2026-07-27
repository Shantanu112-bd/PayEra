"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { sdk, ensureSdk } from "@/lib/sdk";
import { useAuth } from "@/lib/store";
import {
  connectFreighter,
  isFreighterInstalled,
  signMessageWithFreighter,
} from "@/lib/freighter";
import { fetchBalances, type Balances } from "@/lib/stellar";

/*
  Wallet context — the one place the app talks to Freighter + the auth flow.

  connect() runs the SEP-10-style challenge/sign/login and stores the JWT in
  the single auth store. Balance reads are read-only from Horizon/Soroban.
  Everything degrades gracefully when Freighter is absent.
*/

interface WalletCtx {
  publicKey: string | null;
  isWalletInstalled: boolean;
  isConnecting: boolean;
  error: string | null;
  balances: Balances;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
}

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isWalletInstalled, setInstalled] = useState(false);
  const [isConnecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balances>({
    XLM: "0.00",
    USDC: "0.00",
    STAR: "0.00",
  });
  const restored = useRef(false);

  const setKycStatus = useAuth((s) => s.setKycStatus);
  const setTokens = useAuth((s) => s.setTokens);
  const setCurrentUser = useAuth((s) => s.setCurrentUser);
  const clearTokens = useAuth((s) => s.clearTokens);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) return;
    setBalances(await fetchBalances(publicKey));
  }, [publicKey]);

  // Detect Freighter + silently restore the address if access was granted.
  useEffect(() => {
    ensureSdk();
    let cancelled = false;
    (async () => {
      const installed = await isFreighterInstalled();
      if (cancelled) return;
      setInstalled(installed);
      if (installed && !restored.current) {
        restored.current = true;
        try {
          const api = await import("@stellar/freighter-api");
          const res = await api.getAddress();
          const addr =
            typeof res === "object" ? res.address : (res as string);
          if (addr && !cancelled) setPublicKey(addr);
        } catch {
          /* not yet authorized — connect() will prompt */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      ensureSdk();
      const address = await connectFreighter();
      setPublicKey(address);

      // SEP-10-style challenge signed by the user's wallet.
      const challenge = await sdk.auth.walletChallenge({
        address,
        network: "STELLAR",
        provider: "FREIGHTER",
      });
      const signature = await signMessageWithFreighter(
        challenge.message,
        address
      );
      const res = await sdk.auth.walletLogin({
        address,
        network: "STELLAR",
        provider: "FREIGHTER",
        nonce: challenge.nonce,
        signature,
      });

      setTokens(res.auth.accessToken, res.auth.refreshToken);
      if (res.user) {
        setCurrentUser(
          res.user.id,
          res.user.displayName || res.user.email || "PayEra user"
        );
      }

      // Pull KYC status so guards downstream can gate correctly.
      try {
        const kyc = await sdk.kyc.getStatus();
        setKycStatus((kyc?.kycStatus as never) ?? null);
      } catch {
        /* non-fatal */
      }

      await refreshBalances();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
      throw e;
    } finally {
      setConnecting(false);
    }
  }, [refreshBalances, setTokens, setCurrentUser, setKycStatus]);

  const disconnect = useCallback(() => {
    clearTokens();
    setPublicKey(null);
    setBalances({ XLM: "0.00", USDC: "0.00", STAR: "0.00" });
  }, [clearTokens]);

  return (
    <Ctx.Provider
      value={{
        publicKey,
        isWalletInstalled,
        isConnecting,
        error,
        balances,
        connect,
        disconnect,
        refreshBalances,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
