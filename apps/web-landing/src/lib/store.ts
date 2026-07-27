"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  SINGLE SOURCE OF TRUTH for auth.

  The whole 401 class of bugs came from having more than one place that
  "knew" the JWT. Here there is exactly one: this zustand store, persisted
  to localStorage under the key `payra-auth-storage` with the token living
  at `state.accessToken`.

  That key + shape is intentional — it is byte-for-byte what
  `@cryptopay/sdk`'s global `cryptoPaySdk` reads in getToken():

      JSON.parse(localStorage.getItem("payra-auth-storage")).state.accessToken

  So the SDK singleton and this store never disagree about who is logged in.
  Never read the token from anywhere else; call useAuth()/getToken() only.
*/

export type KycStatus = "PENDING" | "APPROVED" | "VERIFIED" | "REJECTED" | null;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentUserId: string | null;
  currentUserDisplayName: string | null;
  kycStatus: KycStatus;

  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  setCurrentUser: (id: string, displayName: string) => void;
  setKycStatus: (status: KycStatus) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      currentUserId: null,
      currentUserDisplayName: null,
      kycStatus: null,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      clearTokens: () =>
        set({
          accessToken: null,
          refreshToken: null,
          currentUserId: null,
          currentUserDisplayName: null,
          kycStatus: null,
        }),
      setCurrentUser: (currentUserId, currentUserDisplayName) =>
        set({ currentUserId, currentUserDisplayName }),
      setKycStatus: (kycStatus) => set({ kycStatus }),
    }),
    {
      name: "payra-auth-storage",
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        currentUserId: s.currentUserId,
        currentUserDisplayName: s.currentUserDisplayName,
        kycStatus: s.kycStatus,
      }),
    }
  )
);

/** Non-hook token read — same source the SDK uses. */
export function getToken(): string | null {
  return useAuth.getState().accessToken;
}
