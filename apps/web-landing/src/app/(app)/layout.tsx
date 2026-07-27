import type { ReactNode } from "react";
import { Providers } from "@/components/app/Providers";
import { AppNav } from "@/components/app/AppNav";
import { RouteGuard } from "@/components/app/RouteGuard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <RouteGuard>
        <div className="min-h-screen bg-ink pb-20 sm:pb-0">
          <AppNav />
          <div className="mx-auto max-w-3xl px-5 py-6">{children}</div>
        </div>
      </RouteGuard>
    </Providers>
  );
}
