"use client";

import * as React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton } from "@cryptopay/ui";

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => cryptoPaySdk.campaigns.getCampaign(id),
  });

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [rewardAmountStar, setRewardAmountStar] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setDescription(campaign.description || "");
      setRewardAmountStar(campaign.rewardAmountStar.toString());
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await cryptoPaySdk.campaigns.updateCampaign(id, {
        name,
        description,
        rewardAmountStar: Number(rewardAmountStar)
      });
      router.push(`/merchant/campaigns/${id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to update campaign.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in max-w-2xl mx-auto">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-white">Campaign not found</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <Link href={`/merchant/campaigns/${id}`} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-6 rounded-xl border border-white/10">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Campaign Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Reward Amount (STAR)</label>
          <input 
            type="number" 
            value={rewardAmountStar}
            onChange={(e) => setRewardAmountStar(e.target.value)}
            required
            min="1"
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
