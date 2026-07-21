"use client";

import * as React from "react";
import { TopBar } from "../../../../components/layout/TopBar";

const MOCK_WEBHOOKS = [
  {
    id: "wh_ev_1a2b3c4d",
    type: "transaction.settled",
    status: "PROCESSED",
    url: "https://api.merchant.com/webhooks/cryptopay",
    payload: {
      transactionId: "txn_0987654321",
      amountPaise: 50000,
      settlementStatus: "CONFIRMED",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    attempts: 1,
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "wh_ev_5e6f7g8h",
    type: "transaction.created",
    status: "PROCESSED",
    url: "https://api.merchant.com/webhooks/cryptopay",
    payload: {
      transactionId: "txn_0987654321",
      amountPaise: 50000,
      status: "CREATED",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    attempts: 1,
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "wh_ev_9i0j1k2l",
    type: "kyc.approved",
    status: "FAILED",
    url: "https://api.merchant.com/webhooks/cryptopay",
    payload: {
      merchantId: "merch_12345",
      kycStatus: "APPROVED",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    attempts: 5,
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    error: "502 Bad Gateway",
  },
];

export default function WebhookDebuggerPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/merchant" title="Developer Hub" />

      <div className="px-[20px] pt-1 space-y-4">
        <p className="text-[14px] text-on-surface-variant">Monitor webhook deliveries and API activity.</p>

        <div className="bg-secondary-container rounded-[16px] p-4 flex gap-3">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0">info</span>
          <p className="text-[13px] text-on-surface-variant">
            Sample data — backend webhook/outbox delivery is not yet wired up.
          </p>
        </div>

        <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wide">
          Recent Webhook Deliveries
        </p>

        <div className="space-y-3">
          {MOCK_WEBHOOKS.map((wh) => {
            const ok = wh.status === "PROCESSED";
            return (
              <div
                key={wh.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-[20px] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`material-symbols-outlined text-[20px] ${ok ? "text-primary" : "text-error"}`}>
                      {ok ? "check_circle" : "error"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-mono font-bold text-on-background truncate">{wh.type}</p>
                      <p className="text-[11px] font-mono text-on-surface-variant truncate">{wh.id}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                      ok ? "bg-secondary-container text-primary" : "bg-error-container text-error"
                    }`}
                  >
                    {wh.status}
                  </span>
                </div>

                <div className="bg-surface-container rounded-[12px] p-3 overflow-x-auto">
                  <p className="text-[11px] font-mono text-on-surface-variant mb-1">POST {wh.url}</p>
                  <pre className="text-[11px] font-mono text-on-background whitespace-pre-wrap break-all">
                    {JSON.stringify(wh.payload, null, 2)}
                  </pre>
                </div>

                {wh.error && (
                  <p className="text-[12px] font-mono text-error bg-error-container rounded-[10px] p-2">
                    Failed: {wh.error} (Attempt {wh.attempts})
                  </p>
                )}

                <p className="text-[11px] text-on-surface-variant">{new Date(wh.lastAttemptAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
