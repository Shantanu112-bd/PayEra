import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { cn } from "../lib/utils";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, icon, trend, className, ...props }: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden bg-white", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted">
          {title}
        </CardTitle>
        {icon && <div className="icon-box !w-9 !h-9">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink">{value}</div>
        {trend && (
          <p className="text-xs text-muted mt-1 flex items-center gap-1">
            <span className={cn(
              "font-[family-name:var(--font-ibm-plex-mono)] font-semibold",
              trend.isPositive ? "text-ink" : "text-ink"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            {" "}{trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
