'use client';

import * as React from 'react';
import { cryptoPaySdk } from '@cryptopay/sdk';
import { useAppStore } from '../../lib/store';

const CHECKS = ['PAN card verification', 'Aadhaar or government ID', 'Live selfie check'];

export function KycOnboarding({ onClose }: { onClose?: () => void }) {
  const { kycStatus, setKycStatus } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleStartKyc() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cryptoPaySdk.kyc.start();
      window.open(result.verificationUrl, '_blank');
      setKycStatus('PENDING');
      if (onClose) onClose();
    } catch (err) {
      setError('Failed to start verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-6 space-y-5">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
        </div>
        <p className="text-[18px] font-bold text-on-background">Verify your identity</p>
        <p className="text-[13px] text-on-surface-variant max-w-[280px]">
          Indian regulations require identity verification before you can make payments. This takes about 2 minutes.
        </p>
      </div>

      <div className="space-y-3">
        {CHECKS.map((c) => (
          <div key={c} className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
            <span className="text-[14px] font-medium text-on-background">{c}</span>
          </div>
        ))}
      </div>

      {kycStatus === 'REJECTED' && (
        <div className="bg-error-container rounded-[14px] p-4 text-center text-error">
          <p className="font-bold text-[14px] mb-1">Previous verification failed</p>
          <p className="text-[13px]">Please try again with clear document photos.</p>
        </div>
      )}

      {error && <p className="text-error text-[13px] text-center">{error}</p>}

      <button
        onClick={handleStartKyc}
        disabled={isLoading}
        className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        {isLoading ? 'Starting…' : kycStatus === 'REJECTED' ? 'Retry Verification' : 'Start Verification'}
      </button>

      <p className="text-[12px] text-on-surface-variant text-center">Powered by KYCAID · Your data is encrypted</p>
    </div>
  );
}
