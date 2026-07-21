"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../../../components/layout/TopBar";

const inputCls =
  "w-full bg-surface-container rounded-[14px] px-4 py-3 text-[15px] text-on-background outline-none border border-outline-variant focus:border-primary";

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
  const [error, setError] = React.useState<string | null>(null);

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
    setError(null);
    try {
      await cryptoPaySdk.campaigns.updateCampaign(id, {
        name,
        description,
        rewardAmountStar: Number(rewardAmountStar),
      });
      router.push(`/merchant/campaigns/${id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update campaign.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref={`/merchant/campaigns/${id}`} title="Edit Campaign" />
        <div className="px-[20px] space-y-3 pt-2">
          {Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-surface-container-high rounded-[16px] h-14" />)}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant/campaigns" title="Edit Campaign" />
        <div className="px-[20px] pt-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px]">search_off</span>
          <p className="text-[14px]">Campaign not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref={`/merchant/campaigns/${id}`} title="Edit Campaign" />

      <form onSubmit={handleSubmit} className="px-[20px] pt-1 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-on-surface-variant">Campaign Name</label>
          <input type="text" required className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-on-surface-variant">Description</label>
          <textarea
            className={`${inputCls} h-24 resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-on-surface-variant">Reward Amount (STAR)</label>
          <input type="number" required min="1" className={inputCls} value={rewardAmountStar} onChange={(e) => setRewardAmountStar(e.target.value)} />
        </div>

        {error && <p className="text-error text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
