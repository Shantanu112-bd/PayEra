"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-[20px]">
      <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-error text-[32px]">warning</span>
      </div>
      <h1 className="text-[24px] font-bold text-on-background mb-2">Something went wrong</h1>
      <p className="text-[14px] text-on-surface-variant max-w-md mb-8">
        We apologize for the inconvenience. An unexpected error occurred while processing your request.
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="mb-8 p-4 bg-surface-container rounded-[16px] text-left text-[13px] font-mono overflow-auto max-w-2xl w-full border border-outline-variant">
          <p className="text-error font-bold">
            {error.name}: {error.message}
          </p>
          <pre className="mt-2 text-on-surface-variant text-[11px] whitespace-pre-wrap break-all">{error.stack}</pre>
        </div>
      )}

      <button
        onClick={() => reset()}
        className="px-6 py-3 rounded-full bg-primary text-on-primary font-semibold active:scale-[0.98] transition-transform flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">refresh</span> Try again
      </button>
    </div>
  );
}
