"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Download, FileText, Loader2 } from "lucide-react";

export default function TaxReportPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cryptoPaySdk.transactions.getTaxReport(year);
      
      // In a real implementation, this might return a CSV string or a Blob URL
      // Here we handle a basic object/array conversion to CSV
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Description,Amount,Status,Rail\n"
        + (Array.isArray(data) ? data.map(row => `${row.date},${row.description},${row.amount},${row.status},${row.rail}`).join("\n") : "Mock,Tax,Data,For,Year");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `CryptoPay_TaxReport_${year}.csv`);
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
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tax Reports</h1>
        <p className="text-gray-500 mt-2">Generate and download your annual transaction history for tax purposes.</p>
      </div>

      <div className="bg-white border-[1.5px] border-black rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-2 flex-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Annual Transaction Summary
            </h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Includes all on-chain rewards, merchant settlements, and conversions for the selected financial year.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 min-w-[200px]">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-black"
            >
              {[0, 1, 2, 3].map(offset => {
                const y = (new Date().getFullYear() - offset).toString();
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download CSV
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Note:</strong> This report is provided for informational purposes only and does not constitute formal tax advice. Please consult with a tax professional regarding your specific situation.
      </div>
    </div>
  );
}
