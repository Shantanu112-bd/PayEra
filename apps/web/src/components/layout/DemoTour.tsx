"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Info } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to CryptoPay",
    content: "This is a comprehensive demo of the CryptoPay platform, highlighting consumer wallet flows, merchant acquiring, and real-time AML screening on Stellar.",
    position: "center"
  },
  {
    title: "Consumer App",
    content: "Navigate to the Dashboard to see mocked on-chain balances, link a wallet, or browse your transaction history.",
    position: "top-left"
  },
  {
    title: "Merchant App",
    content: "Switch to the Business view using the bottom-left profile switcher to see the acquiring dashboard, settlement status, and campaign management.",
    position: "bottom-left"
  }
];

export function DemoTour() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem("demo_tour_seen");
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("demo_tour_seen", "true");
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  if (!step) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/40 pointer-events-auto backdrop-blur-sm" />
          
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`pointer-events-auto bg-[#111111] border border-white/20 shadow-2xl rounded-xl p-6 max-w-sm w-full relative z-10 ${
              step.position === "bottom-left" ? "absolute bottom-8 left-8" : 
              step.position === "top-left" ? "absolute top-24 left-8" : ""
            }`}
          >
            <button onClick={handleClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20">
              <Info className="w-5 h-5 text-indigo-400" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {step.content}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-4 bg-indigo-500' : 'w-1.5 bg-white/20'}`} />
                ))}
              </div>
              
              <button 
                onClick={handleNext}
                className="bg-white text-black hover:bg-white/90 px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-1"
              >
                {currentStep === STEPS.length - 1 ? "Finish Tour" : "Next"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
