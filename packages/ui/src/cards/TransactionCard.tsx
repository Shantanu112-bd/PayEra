import * as React from "react";
import { Transaction } from "@cryptopay/types";
import { Badge } from "../foundation/Badge";
import { cn } from "../lib/utils";

export interface TransactionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  transaction: Transaction;
  isOutbound?: boolean;
}

export function TransactionCard({ transaction, isOutbound = true, className, ...props }: TransactionCardProps) {
  const amount = (parseInt(transaction.amountInPaise) / 100).toFixed(2);
  const merchantName = transaction.merchantId || "Payment";
  const initials = merchantName.slice(0, 2).toUpperCase();
  
  return (
    <div 
      className={cn(
        "p-4 flex items-center justify-between hover:bg-surface transition-colors cursor-pointer border-b border-border-light last:border-b-0",
        className
      )} 
      {...props}
    >
      <div className="flex items-center gap-4">
        {/* Bordered circle with mono initials */}
        <div className="w-10 h-10 rounded-full border-[1.5px] border-ink flex items-center justify-center flex-shrink-0">
          <span className="font-[family-name:var(--font-ibm-plex-mono)] text-sm font-semibold text-ink">
            {initials}
          </span>
        </div>
        <div>
          <p className="font-semibold text-ink">{merchantName}</p>
          <p className="text-xs text-muted font-[family-name:var(--font-ibm-plex-mono)]">
            {new Date(transaction.createdAt).toLocaleDateString("en-US", { 
              month: "short", day: "numeric" 
            })} · {new Date(transaction.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric", minute: "2-digit"
            })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink">
          {isOutbound ? "-" : "+"}₹{amount}
        </p>
        <Badge variant={transaction.status === "COMPLETED" ? "success" : "secondary"} className="mt-1">
          {transaction.status}
        </Badge>
      </div>
    </div>
  );
}
