"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { useMerchant } from "../../../../hooks/useMerchant";
import { TopBar } from "../../../../components/layout/TopBar";

const DEMO_BRAND_ID = "22222222-2222-2222-2222-222222222222";

const CAMPAIGN_TYPES = [
  { value: "SPEND_AND_EARN", label: "Spend & Earn" },
  { value: "WELCOME_BONUS", label: "Welcome Bonus" },
  { value: "DOUBLE_REWARDS", label: "Double Rewards" },
  { value: "REFERRAL_CAMPAIGN", label: "Referral" },
  { value: "CUSTOM", label: "Custom" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-surface-container rounded-[14px] px-4 py-3 text-[15px] text-on-background outline-none border border-outline-variant focus:border-primary";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { merchantId, isLoading: merchantLoading } = useMerchant();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    budget: "",
    rewardRate: "",
    type: "SPEND_AND_EARN",
    targetAmount: "",
    startsAt: "",
    endsAt: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await cryptoPaySdk.campaigns.createCampaign({
        name: form.name,
        brandId: DEMO_BRAND_ID,
        budgetUsdc: parseFloat(form.budget),
        rewardMultiplier: parseFloat(form.rewardRate),
        rewardType: form.type,
        thresholdAmountPaise: form.targetAmount ? (parseFloat(form.targetAmount) * 100).toString() : "0",
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      });
      router.push("/merchant/campaigns");
    } catch (err: any) {
      setError(err?.message || "Failed to create campaign.");
    } finally {
      setLoading(false);
    }
  };

  if (merchantLoading || !merchantId) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar backHref="/merchant/campaigns" title="New Campaign" />
        {!merchantLoading && (
          <div className="px-[20px] pt-16 flex flex-col items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px]">campaign</span>
            <p className="text-[14px]">No merchant profile</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/merchant/campaigns" title="New Campaign" />

      <form onSubmit={handleSubmit} className="px-[20px] pt-1 space-y-4">
        <Field label="Campaign Name">
          <input type="text" required placeholder="Summer Coffee Special" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>

        <Field label="Campaign Type">
          <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {CAMPAIGN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget (USDC)">
            <input type="number" required min="10" step="1" placeholder="500" className={inputCls} value={form.budget} onChange={(e) => set("budget", e.target.value)} />
          </Field>
          <Field label="Reward Multiplier">
            <input type="number" required min="0.1" step="0.1" placeholder="1.5" className={inputCls} value={form.rewardRate} onChange={(e) => set("rewardRate", e.target.value)} />
          </Field>
        </div>

        <Field label="Target Amount (INR)">
          <input type="number" placeholder="500" className={inputCls} value={form.targetAmount} onChange={(e) => set("targetAmount", e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date">
            <input type="date" className={inputCls} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </Field>
          <Field label="End Date">
            <input type="date" className={inputCls} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          </Field>
        </div>

        <div className="bg-secondary-container rounded-[16px] p-4 flex gap-3">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0">info</span>
          <p className="text-[13px] text-on-surface-variant">
            {form.budget || "0"} USDC will be locked in the smart contract to fund the STAR rewards pool.
          </p>
        </div>

        {error && <p className="text-error text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading ? "Creating…" : "Fund Campaign"}
        </button>
      </form>
    </div>
  );
}
