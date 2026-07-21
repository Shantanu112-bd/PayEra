"use client";

import React, { useState } from "react";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { TopBar } from "../../../components/layout/TopBar";

export default function TaxReportPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cryptoPaySdk.transactions.getTaxReport(year);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        "Date,Description,Amount,Status,Rail\n" +
        (Array.isArray(data)
          ? data.map((row) => `${row.date},${row.description},${row.amount},${row.status},${row.rail}`).join("\n")
          : "Mock,Tax,Data,For,Year");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Payra_TaxReport_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message || "Failed to download tax report");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/profile" title="Tax Reports" />

      <div className="px-[20px] pt-1 space-y-5">
        <p className="text-[14px] text-on-surface-variant">
          Generate and download your annual transaction history for tax purposes.
        </p>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[22px]">description</span>
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-on-background">Annual Transaction Summary</p>
              <p className="text-[13px] text-on-surface-variant mt-1">
                Includes all on-chain rewards, merchant settlements, and conversions for the selected financial year.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-on-surface-variant">Financial Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-surface-container rounded-[14px] px-4 py-3 text-[15px] font-medium text-on-background outline-none border border-outline-variant focus:border-primary"
              >
                {[0, 1, 2, 3].map((offset) => {
                  const y = (new Date().getFullYear() - offset).toString();
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">{isLoading ? "progress_activity" : "download"}</span>
              {isLoading ? "Preparing…" : "Download CSV"}
            </button>
          </div>

          {error && <p className="text-error text-[13px]">{error}</p>}
        </div>

        <div className="bg-secondary-container rounded-[16px] p-4 flex gap-3">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0">info</span>
          <p className="text-[13px] text-on-surface-variant">
            This report is for informational purposes only and does not constitute formal tax advice. Please consult a
            tax professional regarding your specific situation.
          </p>
        </div>
      </div>
    </div>
  );
}
