import * as React from "react";
import { Campaign } from "@cryptopay/types";
import { Gift, ArrowRight } from "lucide-react";
import { Badge } from "../foundation/Badge";
import Link from "next/link";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const isActive = campaign.status === "ACTIVE";
  const budgetUsed = Number(campaign.budgetStar) > 0 
    ? ((Number(campaign.budgetStar) - Number(campaign.rewardAmountStar)) / Number(campaign.budgetStar)) * 100 
    : 0;

  return (
    <div className="flex flex-col bg-white border-[1.5px] border-ink rounded-[20px] p-6 card-hover relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="icon-box">
          <Gift className="w-5 h-5" />
        </div>
        <Badge variant={isActive ? "default" : "secondary"}>
          <span className="flex items-center gap-1.5">
            {isActive && <span className="status-dot !w-[6px] !h-[6px]" />}
            {campaign.status}
          </span>
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-ink font-[family-name:var(--font-ibm-plex-mono)]">{campaign.name}</h3>
        <p className="text-sm text-muted mt-1 line-clamp-2">
          {campaign.description || "Earn STAR rewards by participating in this campaign."}
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t border-ink grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="block text-xs text-muted mb-0.5 uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">Reward</span>
          <span className="font-semibold text-ink font-[family-name:var(--font-ibm-plex-mono)]">{campaign.rewardAmountStar.toString()} STAR</span>
        </div>
        <div>
          <span className="block text-xs text-muted mb-0.5 uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">Budget</span>
          <span className="font-semibold text-ink font-[family-name:var(--font-ibm-plex-mono)]">{campaign.budgetStar.toString()} STAR</span>
        </div>
      </div>

      {/* Budget bar */}
      <div className="mt-3">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${budgetUsed}%` }} />
        </div>
      </div>

      {/* CTA */}
      <Link 
        href={`/merchant/campaigns/${campaign.id}`} 
        className="mt-4 btn-primary !py-2.5 !text-[13px] justify-between"
      >
        <span>View Details</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
