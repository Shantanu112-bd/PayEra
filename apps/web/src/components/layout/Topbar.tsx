"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@cryptopay/ui";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-page/95 backdrop-blur-sm border-b border-ink/10 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted rounded-full relative !rounded-[50%]">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-blue rounded-full" />
        </Button>
        <div className="h-8 w-px bg-ink/10 mx-1" />
        <div className="h-8 w-8 rounded-full border-[1.5px] border-ink flex items-center justify-center cursor-pointer hover:bg-ink hover:text-white transition-colors">
          <span className="text-xs font-bold font-[family-name:var(--font-ibm-plex-mono)]">U</span>
        </div>
      </div>
    </header>
  );
}
