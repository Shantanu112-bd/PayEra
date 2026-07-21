"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../../components/layout/TopBar";

function MerchantLinker({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = React.useState("");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const { data: merchantsRes } = useQuery({
    queryKey: ["all-merchants"],
    queryFn: () => cryptoPaySdk.merchants.listMerchants(),
  });
  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => cryptoPaySdk.campaigns.getCampaign(campaignId),
  });

  const linkMutation = useMutation({
    mutationFn: (merchantId: string) => cryptoPaySdk.campaigns.addMerchant(campaignId, merchantId),
    onSuccess: () => {
      setSelected("");
      setMsg({ ok: true, text: "Merchant linked." });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
    },
    onError: () => setMsg({ ok: false, text: "Failed to link merchant." }),
  });

  const merchants: any[] = (merchantsRes as any)?.data ?? [];
  const linked: any[] = (campaign as any)?.merchants ?? [];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 space-y-4">
      <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide">Linked Merchants</p>

      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => { setSelected(e.target.value); setMsg(null); }}
          className="flex-1 bg-surface-container rounded-[12px] px-3 py-2.5 text-[14px] text-on-background outline-none border border-outline-variant focus:border-primary"
        >
          <option value="">Select merchant…</option>
          {merchants.map((m: any) => {
            const already = linked.some((lm: any) => lm.id === m.id);
            return (
              <option key={m.id} value={m.id} disabled={already}>
                {m.displayName || m.name || m.id}{already ? " (linked)" : ""}
              </option>
            );
          })}
        </select>
        <button
          onClick={() => linkMutation.mutate(selected)}
          disabled={!selected || linkMutation.isPending}
          className="bg-primary text-on-primary rounded-full px-5 text-[14px] font-semibold disabled:opacity-50"
        >
          {linkMutation.isPending ? "…" : "Link"}
        </button>
      </div>
      {msg && <p className={`text-[13px] ${msg.ok ? "text-primary" : "text-error"}`}>{msg.text}</p>}

      <div className="space-y-2">
        {linked.length === 0 ? (
          <p className="text-[13px] text-on-surface-variant text-center py-3">No merchants linked yet.</p>
        ) : (
          linked.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between bg-surface-container rounded-[12px] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-on-background truncate">{m.displayName || m.name || "Merchant"}</p>
                <p className="text-[11px] font-mono text-on-surface-variant truncate">{m.id}</p>
              </div>
              <span className="text-[11px] font-semibold bg-secondary-container text-primary px-2 py-0.5 rounded-full shrink-0">LINKED</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => cryptoPaySdk.campaigns.getCampaign(id),
  });
  const { data: analytics } = useQuery({
    queryKey: ["campaign-analytics", id],
    queryFn: () => cryptoPaySdk.campaigns.getCampaignAnalytics(id),
  });

  const actionMutation = useMutation({
    mutationFn: async (action: "activate" | "pause" | "complete") => {
      if (action === "activate") return cryptoPaySdk.campaigns.activateCampaign(id);
      if (action === "pause") return cryptoPaySdk.campaigns.pauseCampaign(id);
      return cryptoPaySdk.campaigns.completeCampaign(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaign", id] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant/campaigns" title="Campaign" />
        <div className="px-[20px] space-y-3 pt-2">
          {Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-surface-container-high rounded-[20px] h-24" />)}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant/campaigns" title="Campaign" />
        <div className="px-[20px] pt-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px]">search_off</span>
          <p className="text-[14px]">Campaign not found</p>
        </div>
      </div>
    );
  }

  const isActive = campaign.status === "ACTIVE";
  const metrics = [
    { label: "Budget", value: `${campaign.budgetStar} STAR` },
    { label: "Distributed", value: `${analytics?.totalDistributedSTAR ?? 0} STAR` },
    { label: "Participants", value: String(analytics?.participantCount ?? 0) },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar
        backHref="/merchant/campaigns"
        title="Campaign"
        actions={
          <Link href={`/merchant/campaigns/${id}/edit`} className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container text-on-surface">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </Link>
        }
      />

      <div className="px-[20px] space-y-5 pt-1">
        {/* Header */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[20px] font-bold text-on-background">{campaign.name}</p>
              <p className="text-[14px] text-primary font-semibold">+{campaign.rewardAmountStar} STAR reward</p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${isActive ? "bg-secondary-container text-primary" : "bg-surface-container text-on-surface-variant"}`}>
              {campaign.status}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-surface-container-lowest border border-outline-variant rounded-[20px] p-4 text-center">
              <p className="text-[18px] font-bold text-on-background leading-tight">{m.value}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isActive ? (
            <button
              onClick={() => actionMutation.mutate("pause")}
              disabled={actionMutation.isPending}
              className="flex-1 py-3 rounded-full bg-error-container text-error font-semibold disabled:opacity-50"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={() => actionMutation.mutate("activate")}
              disabled={actionMutation.isPending}
              className="flex-1 py-3 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50"
            >
              Activate
            </button>
          )}
          <button
            onClick={() => actionMutation.mutate("complete")}
            disabled={actionMutation.isPending}
            className="flex-1 py-3 rounded-full bg-surface-container-lowest border border-outline-variant text-on-background font-semibold disabled:opacity-50"
          >
            Complete
          </button>
        </div>

        <MerchantLinker campaignId={id} />
      </div>
    </div>
  );
}
