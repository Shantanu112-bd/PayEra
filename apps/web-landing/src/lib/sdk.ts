"use client";

import { initializeSdk, cryptoPaySdk, type CryptoPaySdk } from "@cryptopay/sdk";
import { getToken } from "./store";

/*
  We reuse the shared, provider-agnostic `@cryptopay/sdk` rather than
  reimplementing every endpoint — it already knows the /api/v1 envelope,
  the ramp provider abstraction, and the auth flow.

  We re-initialize it so its getToken() reads OUR single store (which
  persists to the same `payra-auth-storage` key the SDK's own default
  reads anyway — so this is belt-and-suspenders, not a second source).
*/

function apiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
  return `${withProto}/api/v1`;
}

let initialized = false;

export function ensureSdk(): CryptoPaySdk {
  if (!initialized && typeof window !== "undefined") {
    initializeSdk({
      baseUrl: apiBaseUrl(),
      getToken: () => getToken(),
    });
    initialized = true;
  }
  return cryptoPaySdk;
}

// The singleton pages/components import directly.
export { cryptoPaySdk as sdk };
