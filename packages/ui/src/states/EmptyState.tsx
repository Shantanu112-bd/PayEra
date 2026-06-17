import * as React from "react";
import { cn } from "../lib/utils";
import { FileQuestion } from "lucide-react";
import { Button } from "../foundation/Button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  icon = <FileQuestion className="h-8 w-8 text-muted" />, 
  title, 
  description, 
  action, 
  className, 
  ...props 
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center border-[1.5px] border-ink rounded-[20px] bg-white",
        className
      )} 
      {...props}
    >
      <div className="mb-4 icon-box !w-14 !h-14">
        {icon}
      </div>
      <h3 className="text-lg font-bold tracking-tight mb-1 font-[family-name:var(--font-ibm-plex-mono)] text-ink">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
