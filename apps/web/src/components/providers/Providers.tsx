"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import { initializeSdk } from "@cryptopay/sdk";
import { StellarWalletProvider } from "./StellarWalletProvider";

// Demo User ID — kept for reference if needed
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return url.startsWith("http") ? url : `https://${url}`;
};

// Initialize SDK with getToken for JWT auth
const sdk = initializeSdk({
  baseUrl: `${getApiUrl()}/api/v1`,
  getToken: () => {
    if (typeof window === "undefined") return null;
    try {
      const storageStr = localStorage.getItem("payra-auth-storage");
      if (storageStr) {
        const parsed = JSON.parse(storageStr);
        return parsed?.state?.accessToken || null;
      }
    } catch (e) {
      console.error("Failed to parse auth storage", e);
    }
    return null;
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StellarWalletProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </StellarWalletProvider>
  );
}
