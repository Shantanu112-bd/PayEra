"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";

const NO_NAV = ["/", "/pay"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-background">
      {children}
      {!NO_NAV.includes(path) && <BottomNav />}
    </div>
  );
}
