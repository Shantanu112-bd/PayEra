"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { Icon } from "@iconify/react";

/*
  Auth guard for the (app) route group. Waits for the persisted store to
  rehydrate on the client (one paint) before deciding, so we never flash a
  redirect. Unauthenticated users are sent to /login, which offers the
  wallet-connect flow.
*/
export function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !accessToken) router.replace("/login");
  }, [mounted, accessToken, router]);

  if (!mounted || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Icon
          icon="ph:circle-notch-bold"
          className="spinner text-3xl text-brand"
        />
      </div>
    );
  }

  return <>{children}</>;
}
