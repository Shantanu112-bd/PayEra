"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useWallet } from "@/components/app/WalletProvider";
import { sdk, ensureSdk } from "@/lib/sdk";
import { useAuth } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { connect, isConnecting, isWalletInstalled, error } = useWallet();
  const setTokens = useAuth((s) => s.setTokens);
  const setCurrentUser = useAuth((s) => s.setCurrentUser);
  const [mockEmail, setMockEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const onWallet = async () => {
    setLocalErr("");
    try {
      await connect();
      router.replace("/wallet");
    } catch {
      /* error surfaced via context */
    }
  };

  const onMock = async () => {
    setLocalErr("");
    setBusy(true);
    try {
      ensureSdk();
      const res = await sdk.auth.mockLogin({
        email: mockEmail || "demo@payera.app",
        displayName: mockEmail ? mockEmail.split("@")[0] || "Demo User" : "Demo User",
      });
      setTokens(res.auth.accessToken, res.auth.refreshToken);
      if (res.user)
        setCurrentUser(res.user.id, res.user.displayName || "Demo User");
      router.replace("/wallet");
    } catch (e: unknown) {
      setLocalErr(e instanceof Error ? e.message : "Mock login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass-strong rounded-3xl p-8">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2">
            <Icon icon="ph:lightning-fill" className="text-lg text-white" />
          </span>
          <span className="text-xl font-semibold tracking-tight">PayEra</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Sign in with your Stellar wallet to continue.
        </p>

        <button
          onClick={onWallet}
          disabled={isConnecting}
          className="focus-ring mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        >
          {isConnecting ? (
            <Icon icon="ph:circle-notch-bold" className="spinner text-lg" />
          ) : (
            <Icon icon="ph:wallet-bold" className="text-lg" />
          )}
          {isConnecting ? "Connecting…" : "Connect Freighter"}
        </button>

        {!isWalletInstalled && (
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 text-xs text-fg-muted hover:text-fg"
          >
            <Icon icon="ph:download-simple" />
            Freighter not detected — install the extension
          </a>
        )}

        {(error || localErr) && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
            <Icon icon="ph:warning-circle-bold" />
            {error || localErr}
          </p>
        )}

        {/* Sandbox-only dev path */}
        <div className="my-6 flex items-center gap-3 text-xs text-fg-dim">
          <span className="h-px flex-1 bg-hairline" />
          sandbox
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <div className="space-y-2">
          <input
            value={mockEmail}
            onChange={(e) => setMockEmail(e.target.value)}
            placeholder="demo@payera.app"
            className="focus-ring w-full rounded-xl border border-hairline bg-surface-1 px-4 py-3 text-sm outline-none placeholder:text-fg-dim"
          />
          <button
            onClick={onMock}
            disabled={busy}
            className="focus-ring w-full rounded-xl border border-hairline-strong py-3 text-sm font-medium text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Continue with demo account"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-fg-muted">
        New here?{" "}
        <Link href="/signup" className="text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
