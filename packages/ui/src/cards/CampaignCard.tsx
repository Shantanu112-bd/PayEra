import * as React from "react";
import { Campaign } from "@cryptopay/types";
import { Gift, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "../foundation/Badge";
import Link from "next/link";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const isComplete = campaign.status === "COMPLETED";
  const isActive = campaign.status === "ACTIVE";

  return (
    <div className="flex flex-col bg-[#111111] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500 opacity-50"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
          <Gift className="w-5 h-5" />
        </div>
        <Badge variant={isActive ? "default" : isComplete ? "outline" : "secondary"}>
          {campaign.status}
        </Badge>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{campaign.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {campaign.description || "Earn STAR rewards by participating in this campaign."}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="block text-xs text-muted-foreground mb-0.5">Reward</span>
          <span className="font-semibold text-amber-400">{campaign.rewardAmountStar.toString()} STAR</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground mb-0.5">Budget</span>
          <span className="font-semibold text-white">{campaign.budgetStar.toString()} STAR</span>
        </div>
      </div>

      <Link 
        href={`/merchant/campaigns/${campaign.id}`} 
        className="mt-4 flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
      >
        <span>View Details</span>
        <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </Link>
    </div>
  );
}
