"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../components/layout/TopBar";

function ReferralStatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    INVITED: "bg-surface-container text-on-surface-variant",
    QUALIFIED: "bg-secondary-container text-primary",
    REWARDED: "bg-primary text-on-primary",
    EXPIRED: "bg-error-container text-error",
    CANCELLED: "bg-error-container text-error",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-surface-container text-on-surface-variant"}`}>
      {status}
    </span>
  );
}

export default function ReferralsPage() {
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [acceptMsg, setAcceptMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [generateMsg, setGenerateMsg] = React.useState<string | null>(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => cryptoPaySdk.auth.getCurrentUser(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: () => cryptoPaySdk.referrals.getReferralStats(),
  });

  const { data: referrals, isLoading: listLoading } = useQuery({
    queryKey: ["referral-list"],
    queryFn: () => cryptoPaySdk.referrals.listReferrals({ page: 1, limit: 20 }),
  });

  const referralCode = (user as any)?.referralCode ?? (stats as any)?.referralCode ?? "";
  const shareUrl = referralCode
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://payra.app"}/join?ref=${referralCode}`
    : "";

  const generateMutation = useMutation({
    mutationFn: () => cryptoPaySdk.referrals.generateReferralCode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
      setGenerateMsg("Referral code generated!");
    },
    onError: () => setGenerateMsg("Failed to generate code. Try again."),
  });

  const acceptMutation = useMutation({
    mutationFn: (code: string) => cryptoPaySdk.referrals.accept({ code }),
    onSuccess: () => {
      setInviteCode("");
      setAcceptMsg({ ok: true, text: "Code applied successfully!" });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
    },
    onError: () => setAcceptMsg({ ok: false, text: "Invalid or already used code." }),
  });

  const handleShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share({ title: "Join PayEra", url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const list: any[] = (referrals as any)?.data ?? [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/rewards" title="Referrals" />

      <div className="px-[20px] pt-2 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Invited", value: (stats as any)?.invited ?? (stats as any)?.totalReferrals ?? 0 },
            { label: "Qualified", value: (stats as any)?.qualified ?? 0 },
            { label: "Rewarded", value: (stats as any)?.rewarded ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-[20px] p-4 text-center border border-outline-variant">
              {statsLoading ? (
                <div className="h-7 w-10 mx-auto animate-pulse bg-surface-container-high rounded-[8px]" />
              ) : (
                <p className="text-[24px] font-bold text-primary">{s.value}</p>
              )}
              <p className="text-[12px] text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Referral code card */}
        <div className="bg-surface-container-lowest rounded-[24px] p-5 border border-outline-variant space-y-4">
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide">Your Referral Code</p>
          {userLoading ? (
            <div className="h-12 animate-pulse bg-surface-container-high rounded-[12px]" />
          ) : referralCode ? (
            <>
              <div className="bg-secondary-container rounded-[16px] px-4 py-3 text-center">
                <span className="text-[22px] font-bold text-primary tracking-widest">{referralCode}</span>
              </div>
              <button
                onClick={handleShare}
                className="w-full bg-primary text-on-primary rounded-full py-3 text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                {copied ? "Copied!" : "Share"}
              </button>
            </>
          ) : (
            <>
              {generateMsg && <p className="text-[13px] text-on-surface-variant">{generateMsg}</p>}
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full bg-primary text-on-primary rounded-full py-3 text-[15px] font-semibold disabled:opacity-50"
              >
                {generateMutation.isPending ? "Generating…" : "Generate Code"}
              </button>
            </>
          )}
        </div>

        {/* Accept code */}
        <div className="bg-surface-container-lowest rounded-[24px] p-5 border border-outline-variant space-y-3">
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide">Have an Invite Code?</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter code"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value); setAcceptMsg(null); }}
              className="flex-1 bg-surface-container rounded-[12px] px-4 py-2.5 text-[14px] text-on-background outline-none border border-outline-variant focus:border-primary"
            />
            <button
              onClick={() => acceptMutation.mutate(inviteCode)}
              disabled={!inviteCode.trim() || acceptMutation.isPending}
              className="bg-primary text-on-primary rounded-full px-5 py-2.5 text-[14px] font-semibold disabled:opacity-50"
            >
              {acceptMutation.isPending ? "…" : "Apply"}
            </button>
          </div>
          {acceptMsg && (
            <p className={`text-[13px] ${acceptMsg.ok ? "text-primary" : "text-error"}`}>{acceptMsg.text}</p>
          )}
        </div>

        {/* Referral list */}
        <div>
          <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Your Referrals</p>
          <div className="bg-surface-container-lowest rounded-[24px] overflow-hidden divide-y divide-outline-variant">
            {listLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="animate-pulse bg-surface-container-high rounded-[10px] h-10 w-full" />
                </div>
              ))
            ) : list.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px]">group_add</span>
                <p className="text-[14px]">No referrals yet</p>
              </div>
            ) : (
              list.map((ref: any, i: number) => (
                <div key={ref.id ?? i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0 text-primary font-bold text-[14px]">
                    {(ref.invitedUser ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-on-background truncate">
                      {ref.invitedUser ?? "Anonymous"}
                    </p>
                    <p className="text-[12px] text-on-surface-variant">
                      {ref.qualifiedAt ? new Date(ref.qualifiedAt).toLocaleDateString() : "Pending"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {ref.rewardAmountStar ? (
                      <span className="text-[13px] font-bold text-primary">+{ref.rewardAmountStar} STAR</span>
                    ) : null}
                    <ReferralStatusChip status={ref.status ?? "INVITED"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
