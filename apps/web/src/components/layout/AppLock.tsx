"use client";

import * as React from "react";
import { Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AppLock({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = React.useState(true);
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState(false);
  const [setupMode, setSetupMode] = React.useState(false);
  const [confirmPin, setConfirmPin] = React.useState<string | null>(null);

  React.useEffect(() => {
    const savedPin = localStorage.getItem("app_pin");
    const unlocked = localStorage.getItem("app_unlocked");
    if (!savedPin) {
      setSetupMode(true);
    } else if (unlocked === "true") {
      setIsLocked(false);
    }
  }, []);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  React.useEffect(() => {
    if (pin.length === 4) {
      if (setupMode) {
        if (confirmPin === null) {
          // Move to confirm step
          setConfirmPin(pin);
          setTimeout(() => setPin(""), 200);
        } else {
          // Check if pins match
          if (pin === confirmPin) {
            localStorage.setItem("app_pin", pin);
            localStorage.setItem("app_unlocked", "true");
            setSetupMode(false);
            setIsLocked(false);
          } else {
            setError(true);
            setTimeout(() => {
              setPin("");
              setConfirmPin(null);
              setError(false);
            }, 800);
          }
        }
      } else {
        const savedPin = localStorage.getItem("app_pin");
        if (pin === savedPin) {
          localStorage.setItem("app_unlocked", "true");
          setIsLocked(false);
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 800);
        }
      }
    }
  }, [pin, setupMode, confirmPin]);

  return (
    <>
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center p-4"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              {setupMode 
                ? (confirmPin ? "Confirm your PIN" : "Create a 4-digit PIN") 
                : "Enter Passcode"}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {setupMode && error ? "PINs did not match, try again" : error ? "Incorrect PIN" : "Keep your wallet secure"}
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] uppercase font-bold px-3 py-1.5 rounded mb-8 text-center max-w-[280px]">
              Note: This is a cosmetic UI lock. PIN is stored in plaintext localStorage. Does not protect real funds or session keys.
            </div>
            
            <div className="flex gap-4 mb-10">
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full transition-colors ${
                    error ? 'bg-red-500' : 
                    i < pin.length ? 'bg-white' : 'bg-white/20'
                  }`} 
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-[280px] w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-2xl font-medium flex items-center justify-center transition-colors mx-auto"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleKeyPress("0")}
                className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-2xl font-medium flex items-center justify-center transition-colors mx-auto"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="w-16 h-16 flex items-center justify-center text-white/50 hover:text-white transition-colors mx-auto"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLocked && children}
    </>
  );
}
