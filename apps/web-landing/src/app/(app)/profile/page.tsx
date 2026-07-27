"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useWallet } from "@/components/app/WalletProvider";
import { useAuth } from "@/lib/store";
import { sdk } from "@/lib/sdk";
import {
  Card,
  PageTitle,
  Button,
  ConnectPrompt,
  Spinner,
  StatusPill,
} from "@/components/app/ui";
import { shortAddr } from "@/lib/format";

export default function ProfilePage() {
  const router = useRouter();
  const { publicKey, connect, disconnect } = useWallet();
  const displayName = useAuth((s) => s.currentUserDisplayName);
  const kycStatus = useAuth((s) => s.kycStatus);
  const setKycStatus = useAuth((s) => s.setKycStatus);

  const [ref, setRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    sdk.kyc
      .getStatus()
      .then((k) => {
        setKycStatus((k?.kycStatus as never) ?? null);
        setRef(k?.kycReference ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [publicKey, setKycStatus]);

  const startKyc = async () => {
    setStarting(true);
    setError("");
    try {
      const { verificationUrl } = await sdk.kyc.start();
      if (verificationUrl) {
        window.open(verificationUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start verification.");
    } finally {
      setStarting(false);
    }
  };

  const signOut = () => {
    disconnect();
    router.push("/login");
  };

  const copyAddr = () => {
    if (!publicKey) return;
    navigator.clipboard?.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!publicKey) {
    return (
      <>
        <PageTitle title="Profile" subtitle="Your account and verification" />
        <Card><ConnectPrompt onConnect={connect} /></Card>
      </>
    );
  }

  const verified = ["APPROVED", "VERIFIED"].includes(
    (kycStatus || "").toUpperCase()
  );

  return (
    <>
      <PageTitle title="Profile" subtitle="Account and verification" />

      {/* Identity */}
      <Card className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-2xl font-semibold text-white">
          {(displayName || "P").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">
            {displayName || "PayEra user"}
          </div>
          <button
            onClick={copyAddr}
            className="focus-ring mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
          >
            <Icon icon={copied ? "ph:check" : "ph:copy"} />
            {copied ? "Copied" : shortAddr(publicKey, 8, 6)}
          </button>
        </div>
      </Card>

      {/* KYC */}
      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Icon icon="ph:identification-badge-bold" className="text-brand" />
            Identity verification
          </div>
          {loading ? (
            <Spinner className="text-base" />
          ) : (
            <StatusPill status={kycStatus || "UNVERIFIED"} />
          )}
        </div>

        {verified ? (
          <p className="mt-3 text-sm text-fg-muted">
            Your identity is verified. You have full access to deposits and
            withdrawals.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-fg-muted">
              Verify your identity to raise limits and enable withdrawals.
              Verification runs with our KYC partner in a secure window.
            </p>
            <div className="mt-4">
              <Button onClick={startKyc} disabled={starting}>
                {starting ? (
                  <Spinner className="mx-auto text-base" />
                ) : (
                  "Start verification"
                )}
              </Button>
            </div>
          </>
        )}

        {ref && (
          <p className="mt-3 text-xs text-fg-muted">
            Reference <span className="font-mono">{ref}</span>
          </p>
        )}
        {error && (
          <p className="mt-3 flex items-center gap-2 text-sm text-danger">
            <Icon icon="ph:warning-circle-bold" /> {error}
          </p>
        )}
      </Card>

      {/* Environment notice */}
      <Card className="mt-4 border-hairline bg-surface-1/50">
        <div className="flex items-start gap-3 text-sm text-fg-muted">
          <Icon icon="ph:flask-bold" className="mt-0.5 text-brand-glow" />
          <p>
            This is a sandbox build running on the Stellar testnet. Balances and
            transfers use test funds only.
          </p>
        </div>
      </Card>

      {/* Sign out */}
      <div className="mt-4">
        <Button variant="danger" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </>
  );
}
