"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Cpu, QrCode, Star, TrendingUp, Wallet } from "lucide-react";
import { useAppStore } from "../lib/store";

const TOUR_STEPS = [
  {
    step: 1,
    icon: Wallet,
    title: "Your STAR Wallet Balance",
    description: "This is your real-time crypto balance. STAR tokens are earned with every payment you make.",
    highlight: "Wallet Balance",
  },
  {
    step: 2,
    icon: QrCode,
    title: "Scan & Pay",
    description: "Scan any merchant QR code to pay in crypto. Your funds settle instantly on the Stellar blockchain.",
    highlight: "Scan & Pay",
  },
  {
    step: 3,
    icon: Star,
    title: "Every Payment Earns Rewards",
    description: "You earn STAR tokens automatically after every successful payment — no action required.",
    highlight: "STAR Rewards",
  },
  {
    step: 4,
    icon: TrendingUp,
    title: "Merchants Run Campaigns",
    description: "Merchants like Chai Point run campaigns to boost your rewards — e.g. 2x STAR this weekend.",
    highlight: "Campaigns",
  },
  {
    step: 5,
    icon: Cpu,
    title: "Powered by Stellar Blockchain",
    description: "Every payment and reward is settled on Stellar Soroban. Click 'Blockchain' in the sidebar to see live on-chain data.",
    highlight: "Blockchain",
  },
];

export function DemoTour() {
  const { tourStep, isTourComplete, nextTourStep, skipTour } = useAppStore();

  const isVisible = tourStep > 0 && !isTourComplete;
  const currentStep = TOUR_STEPS.find((s) => s.step === tourStep);

  if (!isVisible || !currentStep) return null;

  const Icon = currentStep.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50"
            onClick={skipTour}
          />

          {/* Tour Card */}
          <motion.div
            key={tourStep}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="rounded-[20px] border-[1.5px] border-ink bg-white p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="icon-box">
                  <Icon className="h-5 w-5 text-ink" />
                </div>
                <button
                  onClick={skipTour}
                  className="text-muted hover:text-ink transition-colors p-1 rounded-[8px] hover:bg-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-ink mb-2 font-[family-name:var(--font-ibm-plex-mono)]">{currentStep.title}</h3>
              <p className="text-sm text-muted leading-relaxed mb-5">
                {currentStep.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {TOUR_STEPS.map((s) => (
                    <div
                      key={s.step}
                      className={`rounded-full transition-all duration-300 ${
                        s.step === tourStep
                          ? "h-2 w-6 bg-ink"
                          : s.step < tourStep
                          ? "h-2 w-2 bg-ink/40"
                          : "h-2 w-2 bg-ink/10"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-muted ml-2 font-[family-name:var(--font-ibm-plex-mono)]">
                    {tourStep}/{TOUR_STEPS.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={skipTour}
                    className="text-xs text-muted hover:text-ink transition-colors px-2 py-1 font-[family-name:var(--font-ibm-plex-mono)]"
                  >
                    Skip
                  </button>
                  <button
                    onClick={nextTourStep}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-[50px] text-sm font-semibold transition-colors border-[1.5px] border-ink font-[family-name:var(--font-ibm-plex-mono)] ${
                      tourStep === 5 
                        ? "bg-lime text-ink hover:bg-lime-hover" 
                        : "bg-ink text-white hover:bg-ink/90"
                    }`}
                  >
                    {tourStep === 5 ? "Finish" : "Next"}
                    {tourStep < 5 && <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
