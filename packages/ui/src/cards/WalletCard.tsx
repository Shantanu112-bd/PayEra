import * as React from "react";
import { cn } from "../lib/utils";
import { Wallet } from "@cryptopay/types";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Badge } from "../foundation/Badge";

export interface WalletCardProps extends React.HTMLAttributes<HTMLDivElement> {
  wallet: Wallet;
  balance?: string;
  assetCode?: string;
}

export function WalletCard({ wallet, balance, assetCode = "USDC", className, ...props }: WalletCardProps) {
  const pk = wallet.publicKey || wallet.address || "Unknown";
  const shortAddress = pk.slice(0, 6) + "..." + pk.slice(-4);
  
  return (
    <Card className={cn("bg-white", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)]">
          {wallet.label || "Main Wallet"}
          {wallet.isPrimary && <Badge variant="success">Primary</Badge>}
        </CardTitle>
        <Badge variant={wallet.status === "ACTIVE" ? "success" : "secondary"}>
          {wallet.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="text-sm font-[family-name:var(--font-ibm-plex-mono)] text-muted bg-surface p-3 rounded-[12px] border-[1.5px] border-ink truncate">
            {shortAddress}
          </div>
          {balance !== undefined && (
            <div>
              <p className="text-sm text-muted mb-1 uppercase tracking-wider text-xs font-[family-name:var(--font-ibm-plex-mono)]">Balance</p>
              <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">
                {balance} <span className="text-lg font-normal text-muted">{assetCode}</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
