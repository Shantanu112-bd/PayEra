"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import { initializeSdk, cryptoPaySdk } from "@cryptopay/sdk";
import { useAdminStore } from "../../lib/store";

const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return url.startsWith("http") ? url : `https://${url}`;
};

// Initialize SDK with getToken for JWT auth
initializeSdk({
  baseUrl: `${getApiUrl()}/api/v1`,
  getToken: () => {
    if (typeof window === "undefined") return null;
    return useAdminStore.getState().accessToken || null;
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthWrapper>{children}</AdminAuthWrapper>
    </QueryClientProvider>
  );
}

function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const { accessToken, setAuth } = useAdminStore();
  const [isInitializing, setIsInitializing] = React.useState(!accessToken);

  React.useEffect(() => {
    if (!accessToken) {
      // Auto mock login for admin in demo environment
      cryptoPaySdk.auth
        .mockLogin({ email: "admin@cryptopay.network", role: "ADMIN" })
        .then((res) => {
          setAuth(res.auth.accessToken);
          setIsInitializing(false);
        })
        .catch(console.error);
    } else {
      setIsInitializing(false);
    }
  }, [accessToken, setAuth]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-500">
        Loading Admin...
      </div>
    );
  }

  return <>{children}</>;
}
