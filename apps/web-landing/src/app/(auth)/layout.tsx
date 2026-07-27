import type { ReactNode } from "react";
import { Providers } from "@/components/app/Providers";

// Auth routes are public (no guard) but still need SDK + wallet context.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-12">
        {children}
      </div>
    </Providers>
  );
}
