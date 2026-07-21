import React from "react";
import { Skeleton } from "@cryptopay/ui";

export default function Loading() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full animate-pulse">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4 rounded-md" />
        <Skeleton className="h-4 w-2/4 rounded-md" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      
      <div className="space-y-4 mt-8">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
