import React from "react";
import { Skeleton } from "@cryptopay/ui";

export default function Loading() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full animate-pulse">
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      
      <div className="mt-8">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}
