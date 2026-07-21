"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong!</h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        We apologize for the inconvenience. An unexpected error occurred while processing your request.
      </p>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-8 p-4 bg-gray-50 rounded-md text-left text-sm font-mono overflow-auto max-w-2xl w-full border border-gray-200">
          <p className="text-red-600 font-bold">{error.name}: {error.message}</p>
          <pre className="mt-2 text-gray-600 text-xs">{error.stack}</pre>
        </div>
      )}

      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
      >
        <RefreshCcw className="w-4 h-4" /> Try again
      </button>
    </div>
  );
}
