import * as React from "react";
import { motion } from "framer-motion";
import { Check, Star, ExternalLink, Copy } from "lucide-react";
import { Button } from "../foundation/Button";

export interface PaymentSuccessProps {
  amount: string;
  currency: string;
  merchantName: string;
  onDone: () => void;
  txHash?: string;
  starEarned?: number;
}

export function PaymentSuccess({ amount, currency, merchantName, onDone, txHash, starEarned = 10 }: PaymentSuccessProps) {
  return (
    <div className="window-wrapper">
      {/* Lime offset frame for success */}
      <div className="window-frame-shadow-lime" />
      
      {/* Window card */}
      <div className="window-card">
        {/* Window chrome */}
        <div className="window-chrome">
          <span className="chrome-btn">─</span>
          <span className="chrome-btn">✕</span>
          <span className="chrome-btn">▢</span>
        </div>

        {/* Window body */}
        <div className="window-body text-center flex flex-col items-center gap-6">
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-16 h-16 rounded-full border-[1.5px] border-ink flex items-center justify-center bg-lime"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Check className="w-8 h-8 text-ink" strokeWidth={2.5} />
            </motion.div>
          </motion.div>

          {/* Title */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink"
            >
              Payment Complete
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted mt-1"
            >
              ₹{amount} paid to {merchantName}
            </motion.p>
          </div>

          {/* STAR earned card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full bg-lime border-[1.5px] border-ink rounded-[16px] p-4 flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5 text-ink" />
            <span className="font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink">
              +{starEarned} STAR Earned
            </span>
          </motion.div>

          {/* Transaction hash */}
          {txHash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-xs text-muted font-[family-name:var(--font-ibm-plex-mono)]"
            >
              <span>{txHash.slice(0, 8)}...{txHash.slice(-8)}</span>
              <button className="p-1 hover:bg-surface rounded transition-colors">
                <Copy className="w-3 h-3" />
              </button>
              <a href="#" className="p-1 hover:bg-surface rounded transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3 w-full"
          >
            <Button variant="outline" className="flex-1" onClick={onDone}>
              DONE
            </Button>
            <Button variant="accent" className="flex-1" onClick={onDone}>
              PAY AGAIN →
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
