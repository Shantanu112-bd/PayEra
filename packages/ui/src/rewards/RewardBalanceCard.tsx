import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../cards/Card";
import { Button } from "../foundation/Button";
import { Star } from "lucide-react";
import { cn } from "../lib/utils";

export interface RewardBalanceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  starBalance: string | number;
  onClaim?: () => void;
}

export function RewardBalanceCard({ starBalance, onClaim, className, ...props }: RewardBalanceCardProps) {
  return (
    <Card className={cn("bg-white overflow-hidden", className)} {...props}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted flex items-center gap-2 uppercase tracking-[0.1em] font-[family-name:var(--font-ibm-plex-mono)]">
          <div className="icon-box !w-8 !h-8 !rounded-[8px]">
            <Star className="!w-4 !h-4 text-ink" />
          </div>
          STAR Rewards Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">
            {starBalance}
          </p>
          <p className="text-xs text-muted mt-1">Available to redeem</p>
        </div>
        {onClaim && (
          <Button variant="accent" size="sm" onClick={onClaim}>
            Redeem →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
