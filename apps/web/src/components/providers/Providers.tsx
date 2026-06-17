"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import { initializeSdk } from "@cryptopay/sdk";
import { StellarWalletProvider } from "./StellarWalletProvider";

// Demo User ID — seeded in DB, used as the mock-auth identity
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

// Initialize SDK with demo auth header so all requests pass the MockAuthGuard
const sdk = initializeSdk({
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1`,
  defaultHeaders: {
    "x-user-id": DEMO_USER_ID,
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
