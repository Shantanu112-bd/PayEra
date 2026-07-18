"use client";

import * as React from "react";
import { ArrowLeft, Play, Pause, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton, MetricCard, ChartCard, LineChart, Button } from "@cryptopay/ui";
import { Loader2 } from "lucide-react";

function MerchantLinker({ campaignId }: { campaignId: string }) {
  const [selectedMerchant, setSelectedMerchant] = React.useState("");

  const { data: merchantsRes, isLoading: merchantsLoading } = useQuery({
    queryKey: ["merchants"],
    queryFn: () => cryptoPaySdk.merchants.listMerchants(),
  });

  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => cryptoPaySdk.campaigns.getCampaign(campaignId),
  });

  const linkMutation = useMutation({
    mutationFn: (merchantId: string) => cryptoPaySdk.campaigns.addMerchant(campaignId, merchantId),
    onSuccess: () => {
      setSelectedMerchant("");
      alert("Merchant linked successfully!");
    },
    onError: (err: any) => {
      alert("Failed to link merchant.");
    }
  });

  const merchants = merchantsRes?.data || [];
  const linkedMerchants = campaign?.merchants || [];

  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl p-6 space-y-6 mt-8">
      <div>
        <h3 className="font-semibold text-lg text-white">Linked Merchants</h3>
        <p className="text-muted-foreground text-sm">Merchants participating in this campaign.</p>
      </div>

      <div className="flex gap-4">
        <select 
          value={selectedMerchant}
          onChange={(e) => setSelectedMerchant(e.target.value)}
          className="flex-1 bg-black border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Select a merchant to link...</option>
          {merchants.map((m: any) => (
            <option key={m.id} value={m.id} disabled={linkedMerchants.some((lm: any) => lm.id === m.id)}>
              {m.name || m.id} {linkedMerchants.some((lm: any) => lm.id === m.id) ? "(Already Linked)" : ""}
            </option>
          ))}
        </select>
        <button 
          onClick={() => linkMutation.mutate(selectedMerchant)}
          disabled={!selectedMerchant || linkMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {linkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link Merchant"}
        </button>
      </div>

      <div className="space-y-2">
        {linkedMerchants.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-white/5 rounded-md p-4 text-center">
            No merchants linked to this campaign yet.
          </div>
        ) : (
          linkedMerchants.map((m: any) => (
            <div key={m.id} className="bg-white/5 border border-white/10 rounded-md p-3 flex justify-between items-center">
              <div>
                <div className="font-medium text-white">{m.name || "Unnamed Merchant"}</div>
                <div className="text-xs text-muted-foreground font-mono">{m.id}</div>
              </div>
              <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded font-bold border border-emerald-500/20">
                LINKED
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: campaign, isLoading: campaignLoading, refetch: refetchCampaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => cryptoPaySdk.campaigns.getCampaign(id),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["campaign-analytics", id],
    queryFn: () => cryptoPaySdk.campaigns.getCampaignAnalytics(id),
  });

  const timelineData = analytics?.timelineSeries || [];

  if (campaignLoading) {
    return (
      <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-white">Campaign not found</div>;
  }

  const handleAction = async (action: 'activate' | 'pause' | 'complete') => {
    try {
      if (action === 'activate') await cryptoPaySdk.campaigns.activateCampaign(id);
      if (action === 'pause') await cryptoPaySdk.campaigns.pauseCampaign(id);
      if (action === 'complete') await cryptoPaySdk.campaigns.completeCampaign(id);
      refetchCampaign();
    } catch (e) {
      console.error(e);
      alert(`Failed to ${action} campaign`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/merchant/campaigns" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{campaign.name}</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                {campaign.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">Reward Amount: {campaign.rewardAmountStar} STAR</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {campaign.status === "ACTIVE" ? (
            <button onClick={() => handleAction('pause')} className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 h-9 px-4 py-2">
              <Pause className="mr-2 h-4 w-4" /> Pause Campaign
            </button>
          ) : (
            <button onClick={() => handleAction('activate')} className="flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow h-9 px-4 py-2">
              <Play className="mr-2 h-4 w-4" /> Activate
            </button>
          )}
          <button onClick={() => handleAction('complete')} className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-white/10 bg-black hover:bg-white/5 text-white h-9 px-4 py-2">
            <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
          </button>
          <Link href={`/merchant/campaigns/${id}/edit`} className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-white/10 bg-black hover:bg-white/5 text-white h-9 px-4 py-2">
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Budget" 
          value={`${campaign.budgetStar.toString()} STAR`} 
        />
        <MetricCard 
          title="STAR Distributed" 
          value={`${analytics?.totalDistributedSTAR || 0} STAR`} 
        />
        <MetricCard 
          title="Participants" 
          value={(analytics?.participantCount || 0).toString()} 
        />
      </div>

      <ChartCard 
        title="Distribution Timeline" 
        description="STAR tokens distributed per day over the campaign lifecycle"
      >
        {analyticsLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <LineChart 
            data={timelineData} 
            index="day" 
            categories={["distributed"]} 
            colors={["#10b981"]}
            valueFormatter={(val) => `${val} STAR`}
          />
        )}
      </ChartCard>

      <MerchantLinker campaignId={id} />
    </div>
  );
}
