"use client";

import * as React from "react";
import { ArrowLeft, Code, Webhook, RefreshCcw, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

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
  }
];

export default function WebhookDebuggerPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/merchant" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Code className="w-6 h-6 text-indigo-400" />
              Developer Hub
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Monitor webhook deliveries and API activity.</p>
          </div>
        </div>
        <div className="text-xs text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20 font-medium">
          MOCK DATA: Backend missing Outbox/Webhook support
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <div className="bg-white/10 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2">
            <Webhook className="w-4 h-4" /> Webhooks
          </div>
          <div className="text-muted-foreground hover:bg-white/5 hover:text-white transition-colors cursor-pointer px-4 py-2 rounded-lg flex items-center gap-2">
            API Keys
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Webhook Deliveries</h2>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
            {MOCK_WEBHOOKS.map((wh) => (
              <div key={wh.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {wh.status === "PROCESSED" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-mono text-sm text-white font-bold">{wh.type}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{wh.id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${wh.status === 'PROCESSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {wh.status}
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(wh.lastAttemptAt).toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-black/50 border border-white/5 rounded-lg p-3 overflow-x-auto text-xs font-mono text-gray-300">
                  <div className="mb-2 text-muted-foreground">POST {wh.url}</div>
                  <pre>{JSON.stringify(wh.payload, null, 2)}</pre>
                </div>
                
                {wh.error && (
                  <div className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 rounded p-2">
                    Failed Response: {wh.error} (Attempt {wh.attempts})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
