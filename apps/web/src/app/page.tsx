"use client";

import * as React from "react";
import { useAppStore } from "../lib/store";
import { useRouter } from "next/navigation";
import { Button } from "@cryptopay/ui";
import { Wallet, Loader2, PlayCircle, ArrowRight, Zap, Star, Shield, Check, BarChart3, Code2 } from "lucide-react";
import { motion } from "framer-motion";
import { useStellarWallet } from "../components/providers/StellarWalletProvider";
import Link from "next/link";

/* ─── SECTION TAG COMPONENT ─── */
function SectionTag({ label }: { label: string }) {
  return (
    <div className="section-tag">
      <span className="tag-marker" />
      <span className="tag-line" />
      <span className="tag-label">{label}</span>
    </div>
  );
}

/* ─── FEATURE CARD DATA ─── */
const features = [
  {
    icon: Zap,
    title: "Pay with Stellar",
    points: ["Connect Freighter wallet", "Scan any merchant QR", "Confirm in seconds"],
  },
  {
    icon: Star,
    title: "Earn STAR Tokens",
    points: ["Auto-issued on payment", "Campaign multipliers", "Referral bonuses"],
  },
  {
    icon: BarChart3,
    title: "Merchant Analytics",
    points: ["Real-time revenue", "Campaign performance", "Settlement tracking"],
  },
  {
    icon: Code2,
    title: "Soroban Contracts",
    points: ["STAR Token on-chain", "Reward Engine verified", "View on Stellar Expert"],
  },
];

/* ─── INTEGRATION TILES ─── */
const stellarAssets = [
  { name: "XLM", active: true },
  { name: "USDC", active: true },
  { name: "STAR", active: true },
  { name: "Custom", active: false },
];

const wallets = [
  { name: "Freighter", active: true },
  { name: "Lobstr", active: false, soon: true },
  { name: "xBull", active: false, soon: true },
];

const contracts = [
  { name: "Reward Engine", active: true },
  { name: "Payment Engine", active: true },
  { name: "STAR Token", active: true },
];

export default function Home() {
  const { currentUserId, setCurrentUserId, isDemoMode, startTour } = useAppStore();
  const router = useRouter();
  const { connect, publicKey, isConnecting } = useStellarWallet();

  // If already "logged in" via wallet or demo, redirect to dashboard
  React.useEffect(() => {
    if (publicKey) {
      setCurrentUserId(publicKey);
      router.push("/dashboard");
    } else if (currentUserId && !isDemoMode) {
      router.push("/dashboard");
    }
  }, [publicKey, currentUserId, isDemoMode, router, setCurrentUserId]);

  const handleLogin = async () => {
    await connect();
  };

  const handleTryDemo = () => {
    // currentUserId is already set to demo user in store
    startTour();
    router.push("/dashboard");
  };

  // Don't show landing if wallet connected
  if (publicKey) return null;

  return (
    <div className="min-h-screen bg-page">
      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <div className="announcement-bar">
        <span className="text-sm">CryptoPay Network is live on Stellar Testnet</span>
        {isDemoMode && (
          <button onClick={handleTryDemo} className="pill-btn text-sm">
            Explore Demo →
          </button>
        )}
      </div>

      {/* ═══ NAVBAR ═══ */}
      <nav className="sticky top-0 z-50 bg-page/95 backdrop-blur-sm border-b border-ink/10 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 border-[1.5px] border-ink rounded-[12px] flex items-center justify-center bg-lime">
            <span className="text-ink font-bold text-lg font-[family-name:var(--font-ibm-plex-mono)]">⟠</span>
          </div>
          <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-ibm-plex-mono)] text-ink">CryptoPay</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {["Dashboard", "Pay", "Rewards", "Merchant"].map((item) => (
            <span key={item} className="px-3 py-1.5 text-[15px] font-medium text-ink/70 hover:text-ink cursor-pointer transition-colors">
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm font-medium text-ink/70 cursor-pointer hover:text-ink transition-colors font-[family-name:var(--font-ibm-plex-mono)]">
            LOG IN
          </span>
          <button onClick={handleLogin} className="btn-primary !py-2 !px-5 !text-[13px]">
            {isConnecting ? "CONNECTING..." : "CONNECT WALLET →"}
          </button>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="px-6 sm:px-10 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface border-[1.5px] border-ink rounded-[24px] p-8 sm:p-12 lg:p-16 overflow-hidden"
        >
          {/* Blue corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          
          {/* Grid lines */}
          <div className="grid-col-lines">
            <div /><div /><div />
          </div>

          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink leading-[1.05] tracking-tight">
              Pay with Crypto.<br />
              Earn with Every<br />
              Scan.
            </h1>
            <p className="mt-6 text-lg text-ink-secondary max-w-lg leading-relaxed">
              CryptoPay brings instant Stellar payments and STAR token rewards to every merchant.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button onClick={isDemoMode ? handleTryDemo : handleLogin} className="btn-accent !px-8 !py-3 !text-[15px]">
                {isDemoMode ? "TRY DEMO →" : "CONNECT WALLET →"}
              </button>
              {isDemoMode && (
                <button onClick={handleLogin} className="btn-primary !py-3 !text-[15px]">
                  {isConnecting ? "CONNECTING..." : "CONNECT WALLET →"}
                </button>
              )}
              {!isDemoMode && (
                <span className="text-sm text-muted">
                  Want to explore?{" "}
                  <button onClick={handleTryDemo} className="text-ink font-medium underline underline-offset-4 hover:no-underline">
                    DEMO MODE
                  </button>
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="px-6 sm:px-10 py-8">
        <p className="text-xs uppercase tracking-[0.15em] text-muted font-[family-name:var(--font-ibm-plex-mono)] mb-4">
          Trusted by merchants on Stellar
        </p>
        <div className="flex items-center gap-8 overflow-x-auto hide-scrollbar">
          {["Freighter", "Lobstr", "Stellar", "Horizon", "Soroban", "USDC"].map((name) => (
            <span key={name} className="text-ink/30 font-bold text-lg font-[family-name:var(--font-ibm-plex-mono)] whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ STATS SECTION ═══ */}
      <section className="px-6 sm:px-10 py-12 relative">
        <SectionTag label="PAYMENTS" />
        <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink mt-4 mb-8">
          One Scan. Instant Settlement.
        </h2>

        <div className="stats-card stats-card-3">
          <div className="stat-col">
            <div className="stat-number">₹2.4M+</div>
            <div className="stat-primary-label">Processed</div>
            <div className="stat-sub-label">this month</div>
          </div>
          <div className="stat-col">
            <div className="stat-number">&lt; 5 sec</div>
            <div className="stat-primary-label">Settlement time</div>
            <div className="stat-sub-label">on Stellar</div>
          </div>
          <div className="stat-col">
            <div className="stat-number">Zero</div>
            <div className="stat-primary-label">Coding for rewards</div>
            <div className="stat-sub-label">in plain SDK</div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted mb-6">Stop scanning. Start earning. At every payment.</p>
          <button onClick={isDemoMode ? handleTryDemo : handleLogin} className="btn-accent !px-8 !py-3">
            Get started for free →
          </button>
        </div>
      </section>

      {/* ═══ FEATURE CARDS ═══ */}
      <section className="px-6 sm:px-10 py-12">
        <SectionTag label="HOW IT WORKS" />
        <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink mt-4 mb-8">
          One platform, every workflow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="card-white card-hover"
            >
              <div className="icon-box mb-4">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink mb-3">{feature.title}</h3>
              <ul className="space-y-2">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ INTEGRATIONS ═══ */}
      <section className="px-6 sm:px-10 py-12">
        <SectionTag label="NETWORK" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink mt-4">
              Our Stack
            </h2>
            <p className="text-ink-secondary mt-4 leading-relaxed">
              Built on the Stellar network for instant finality and near-zero fees. 
              STAR tokens power the loyalty ecosystem through verified Soroban smart contracts.
            </p>
            <p className="text-ink-secondary mt-3 leading-relaxed">
              Connect your preferred wallet, pay in any supported asset, and earn rewards automatically.
            </p>
          </div>
          <div className="space-y-6">
            {/* Stellar Assets */}
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-muted font-[family-name:var(--font-ibm-plex-mono)] mb-3">Stellar Assets</p>
              <div className="flex flex-wrap gap-3">
                {stellarAssets.map((asset) => (
                  <div key={asset.name} className={`tile ${!asset.active ? "tile-soon" : ""} !flex-row !gap-2 !px-4 !py-3`}>
                    {asset.active && (
                      <span className="tile-badge !static !w-5 !h-5">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                    <span className="tile-label">{asset.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Wallets */}
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-muted font-[family-name:var(--font-ibm-plex-mono)] mb-3">Wallets</p>
              <div className="flex flex-wrap gap-3">
                {wallets.map((w) => (
                  <div key={w.name} className={`tile ${w.soon ? "tile-soon" : ""} !flex-row !gap-2 !px-4 !py-3`}>
                    {w.active && (
                      <span className="tile-badge !static !w-5 !h-5">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                    <span className="tile-label">{w.name}</span>
                    {w.soon && <span className="text-xs text-soon-text">Soon</span>}
                  </div>
                ))}
              </div>
            </div>
            {/* Contracts */}
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-muted font-[family-name:var(--font-ibm-plex-mono)] mb-3">Contracts</p>
              <div className="flex flex-wrap gap-3">
                {contracts.map((c) => (
                  <div key={c.name} className={`tile !flex-row !gap-2 !px-4 !py-3`}>
                    <span className="tile-badge !static !w-5 !h-5">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                    <span className="tile-label">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WINDOW CTA ═══ */}
      <section className="px-6 sm:px-10 py-16">
        <div className="window-wrapper">
          <div className="window-frame-shadow" />
          <div className="window-card">
            <div className="window-chrome">
              <span className="chrome-btn">─</span>
              <span className="chrome-btn">✕</span>
              <span className="chrome-btn">▢</span>
            </div>
            <div className="window-body text-center">
              <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-ink mb-4">
                Join the Stellar economy today!
              </h2>
              <p className="text-ink-secondary mb-8 max-w-md mx-auto">
                Start accepting crypto payments. Reward your customers. No setup fees.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={isDemoMode ? handleTryDemo : handleLogin} className="btn-accent !px-8 !py-3">
                  {isDemoMode ? "TRY DEMO →" : "CONNECT WALLET →"}
                </button>
                <Link href="/merchant" className="btn-primary !py-3">
                  CONTACT US
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer-dark">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-[family-name:var(--font-ibm-plex-mono)] text-white">⟠ CryptoPay</span>
            </div>
            <div className="flex flex-wrap gap-8">
              {["Dashboard", "Pay", "Rewards", "History", "Merchant", "Blockchain"].map((item) => (
                <a key={item} href="#" className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-ibm-plex-mono)]">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40 font-[family-name:var(--font-ibm-plex-mono)]">
              © 2026 CryptoPay Network. Built on Stellar.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/40 font-[family-name:var(--font-ibm-plex-mono)]">
              <span className="inline-flex items-center gap-1.5 border border-white/20 rounded-[50px] px-3 py-1">
                Built on Stellar ⟠
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
