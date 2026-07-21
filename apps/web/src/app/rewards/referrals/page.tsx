"use client";

import * as React from "react";
import { ArrowLeft, Copy, Users, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@cryptopay/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";

export default function ReferralsPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState("");

  // Fetch referrals to see if we have generated one (using list or stats)
  // For the sake of the page, let's just use a mutation to generate it if missing, or use user profile.
  // We can fetch profile to see if they have referralCode set.
  const { data: userProfile } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: () => cryptoPaySdk.auth.getCurrentUser()
  });

  const { data: stats } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: () => cryptoPaySdk.referrals.getReferralStats()
  });
  
  const { data: referrals } = useQuery({
    queryKey: ["referral-list"],
    queryFn: () => cryptoPaySdk.referrals.listReferrals()
  });

  const generateMutation = useMutation({
    mutationFn: () => cryptoPaySdk.referrals.generateReferralCode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
      alert("Referral code generated!");
    }
  });

  const acceptMutation = useMutation({
    mutationFn: (code: string) => cryptoPaySdk.referrals.accept({ code }),
    onSuccess: () => {
      setInviteCode("");
      alert("Referral code accepted successfully!");
    },
    onError: (err: any) => {
      alert("Failed to accept referral code. It may be invalid or already used.");
    }
  });

  const referralCode = userProfile?.referralCode || "";

  const copyToClipboard = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(`https://cryptopay.network/join?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <Link href="/rewards" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Refer & Earn</h1>
          <p className="text-muted-foreground mt-1 text-sm">Earn 500 STAR tokens for every friend who makes a payment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard title="Total Referrals" value={stats?.totalReferrals?.toString() || "0"} icon={<Users className="text-blue-400 h-5 w-5" />} />
        <MetricCard title="STAR Earned" value={stats?.totalStarEarned || "0"} icon={<Star className="text-amber-400 h-5 w-5" />} />
      </div>

      <div className="bg-[#111111] rounded-xl border border-white/10 p-6 md:p-8 flex flex-col items-center text-center space-y-6">
        <div className="h-16 w-16 bg-blue-600/20 rounded-full flex items-center justify-center">
          <Users className="h-8 w-8 text-blue-400" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-semibold text-white">Share your link</h2>
          <p className="text-muted-foreground text-sm">
            When your friends join CryptoPay using your link and make their first transaction, you both get 500 STAR.
          </p>
        </div>
        
        {referralCode ? (
          <div className="flex items-center gap-2 w-full max-w-md bg-black border border-white/10 rounded-lg p-2">
            <code className="flex-1 text-blue-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap pl-2">
              https://cryptopay.network/join?ref={referralCode}
            </code>
            <button 
              onClick={copyToClipboard}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              {copied ? "Copied!" : <><Copy className="h-4 w-4" /> Copy</>}
            </button>
          </div>
        ) : (
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Generate Referral Code
          </button>
        )}
      </div>

      <div className="bg-[#111111] rounded-xl border border-white/10 p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div>
          <h3 className="font-semibold text-lg text-white">Have an invite code?</h3>
          <p className="text-muted-foreground text-sm">Enter a friend's code to link your accounts.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input 
            type="text" 
            placeholder="e.g. CRYPTO-2026-X8F"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="flex-1 sm:w-48 bg-black border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            onClick={() => acceptMutation.mutate(inviteCode)}
            disabled={!inviteCode || acceptMutation.isPending}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="font-semibold text-lg text-white">Recent Referrals</h3>
        <div className="bg-[#111111] rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
          {referrals?.data?.length ? (
            referrals.data.map((ref: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground">
                    {(ref.invitedUser || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">@{ref.invitedUser || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ref.qualifiedAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  {ref.status === "COMPLETED" ? (
                    <p className="font-bold text-emerald-400">+{ref.rewardAmountStar} STAR</p>
                  ) : (
                    <p className="font-medium text-muted-foreground">Pending payment</p>
                  )}
                  <p className="text-xs text-muted-foreground">{ref.status}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No referrals yet. Share your code to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
