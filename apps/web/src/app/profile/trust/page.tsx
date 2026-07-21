"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useAppStore } from "../../../lib/store";
import { useStellarWallet } from "../../../components/providers/StellarWalletProvider";
import { TopBar } from "../../../components/layout/TopBar";

export default function TrustCenterPage() {
  const router = useRouter();
  const { clearTokens } = useAppStore();
  const { disconnect } = useStellarWallet();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleExportData = async () => {
    setIsExporting(true);
    setMsg(null);
    try {
      // SDK attaches the bearer token automatically (reads payra-auth-storage → state.accessToken)
      const data = await cryptoPaySdk.users.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payera-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ ok: true, text: "Your data archive was downloaded." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Failed to export data." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    setIsDeleting(true);
    setMsg(null);
    try {
      await cryptoPaySdk.users.deleteMyAccount();
      cryptoPaySdk.auth.logout();
      disconnect();
      clearTokens();
      router.replace("/");
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Failed to delete account." });
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/profile" title="Trust & Security" />

      <div className="px-[20px] space-y-5 pt-1">
        {msg && (
          <div className={`rounded-[16px] px-4 py-3 text-[13px] ${msg.ok ? "bg-secondary-container text-primary" : "bg-error-container text-error"}`}>
            {msg.text}
          </div>
        )}

        {/* Export */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">download</span>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-on-background">Export Your Data</p>
              <p className="text-[12px] text-on-surface-variant">Profile, wallets and transaction history</p>
            </div>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full py-3 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isExporting ? "Exporting…" : "Download JSON Archive"}
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-surface-container-lowest border border-error/30 rounded-[24px] p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-error text-[20px]">warning</span>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-error">Danger Zone</p>
              <p className="text-[12px] text-on-surface-variant">Permanently delete your account and data</p>
            </div>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full py-3 rounded-full bg-error text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isDeleting ? "Deleting…" : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
