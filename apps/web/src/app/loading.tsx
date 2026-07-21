import React from "react";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-lg animate-pulse space-y-6 p-4">
      <div className="space-y-3">
        <div className="h-8 w-1/2 rounded-full bg-surface-container-high" />
        <div className="h-4 w-2/3 rounded-full bg-surface-container-high" />
      </div>

      <div className="h-40 w-full rounded-[24px] bg-surface-container-high" />

      <div className="grid grid-cols-4 gap-3">
        <div className="h-20 rounded-[24px] bg-surface-container-high" />
        <div className="h-20 rounded-[24px] bg-surface-container-high" />
        <div className="h-20 rounded-[24px] bg-surface-container-high" />
        <div className="h-20 rounded-[24px] bg-surface-container-high" />
      </div>

      <div className="space-y-3">
        <div className="h-16 w-full rounded-[24px] bg-surface-container-high" />
        <div className="h-16 w-full rounded-[24px] bg-surface-container-high" />
        <div className="h-16 w-full rounded-[24px] bg-surface-container-high" />
      </div>
    </div>
  );
}
