"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { DemoTour } from "../DemoTour";
import { usePathname } from "next/navigation";
import { useAppStore } from "../../lib/store";
import { PlayCircle } from "lucide-react";

function DemoBanner() {
  const { isDemoMode, isTourComplete, startTour } = useAppStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isDemoMode || !isTourComplete) return null;
  return (
    <div className="announcement-bar">
      <span>CryptoPay Network is live on Stellar Testnet</span>
      <button
        onClick={startTour}
        className="pill-btn flex items-center gap-1.5"
      >
        <PlayCircle className="h-3.5 w-3.5" />
        Restart Tour →
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Exclude shell on root marketing page
  const isMarketing = pathname === "/";

  if (isMarketing) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <DemoBanner />
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav />
      <DemoTour />
    </div>
  );
}
