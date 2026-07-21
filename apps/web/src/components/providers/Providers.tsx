"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import { initializeSdk } from "@cryptopay/sdk";
import { StellarWalletProvider } from "./StellarWalletProvider";
import { AppShell } from "../layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { usePathname, useRouter } from "next/navigation";

import { useAppStore } from "../../lib/store";

const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return url.startsWith("http") ? url : `https://${url}`;
};

// Initialize SDK with getToken for JWT auth
const sdk = initializeSdk({
  baseUrl: `${getApiUrl()}/api/v1`,
  getToken: () => {
    if (typeof window === "undefined") return null;
    return useAppStore.getState().accessToken || null;
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StellarWalletProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGate>{children}</AuthGate>
      </QueryClientProvider>
    </StellarWalletProvider>
  );
}

// Public routes accessible without authentication
const PUBLIC_ROUTES = ["/"];
// Routes that require auth but must remain reachable while KYC is incomplete
const KYC_ROUTES = ["/kyc"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { accessToken, kycStatus, setKycStatus } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  // Fetch real KYC status on every authenticated load
  const { data: me } = useQuery({
    queryKey: ["me", accessToken],
    queryFn: () => cryptoPaySdk.auth.getCurrentUser(),
    enabled: !!accessToken,
  });

  React.useEffect(() => {
    if (me?.kycStatus) setKycStatus(me.kycStatus);
  }, [me, setKycStatus]);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isKycRoute = KYC_ROUTES.some((r) => pathname.startsWith(r));

  // Not logged in → force to splash/connect-wallet
  React.useEffect(() => {
    if (!accessToken && !isPublic) router.replace("/");
  }, [accessToken, isPublic, router]);

  // Logged in but KYC not verified → force to KYC flow
  const kycVerified = kycStatus === "VERIFIED";
  React.useEffect(() => {
    if (accessToken && !kycVerified && !isKycRoute && !isPublic) {
      router.replace("/kyc");
    }
  }, [accessToken, kycVerified, isKycRoute, isPublic, router]);

  // Public route (splash) renders bare, no shell
  if (isPublic) return <>{children}</>;

  return <AppShell>{children}</AppShell>;
}
