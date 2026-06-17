"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../cards/Card";
import { cn } from "../lib/utils";

interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children: React.ReactNode;
  contentClassName?: string;
}

export function ChartCard({ title, description, children, className, contentClassName, ...props }: ChartCardProps) {
  return (
    <Card className={cn("bg-white", className)} {...props}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight text-ink font-[family-name:var(--font-ibm-plex-mono)]">{title}</CardTitle>
        {description && <CardDescription className="text-muted">{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn("pt-4 pb-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
