import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[50px] border-[1.5px] px-2.5 py-0.5 text-xs font-semibold font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.02em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-ink bg-transparent text-ink",
        secondary: "border-ink bg-surface text-ink",
        destructive: "border-ink bg-transparent text-ink",
        outline: "border-ink bg-transparent text-ink",
        success: "border-ink bg-lime text-ink",
        warning: "border-ink bg-transparent text-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
