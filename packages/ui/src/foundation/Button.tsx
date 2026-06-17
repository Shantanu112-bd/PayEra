import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.02em]",
  {
    variants: {
      variant: {
        default:
          "border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink hover:text-white rounded-[50px]",
        accent:
          "border-[1.5px] border-ink bg-lime text-ink hover:bg-lime-hover rounded-[50px]",
        outline:
          "border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink hover:text-white rounded-[50px]",
        ghost:
          "hover:bg-ink/5 text-ink rounded-[50px]",
        secondary:
          "border-[1.5px] border-ink bg-surface text-ink hover:bg-ink hover:text-white rounded-[50px]",
        destructive:
          "border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink hover:text-white rounded-[50px]",
        link:
          "text-ink underline-offset-4 hover:underline",
        glass:
          "border-[1.5px] border-ink bg-surface text-ink hover:bg-ink hover:text-white rounded-[50px]",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
