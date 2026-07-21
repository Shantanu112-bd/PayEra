"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { KycOnboarding } from "../../../components/kyc/KycOnboarding";
import { TopBar } from "../../../components/layout/TopBar";

const inputCls =
  "w-full bg-surface-container rounded-[14px] px-4 py-3 text-[15px] text-on-background outline-none border border-outline-variant focus:border-primary";

const STEPS = [
  { id: 1, name: "Business", icon: "storefront" },
  { id: 2, name: "Identity", icon: "person" },
  { id: 3, name: "Settlement", icon: "account_balance" },
  { id: 4, name: "KYC", icon: "verified_user" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}

export default function MerchantOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);

  const [formData, setFormData] = React.useState({
    legalName: "",
    displayName: "",
    gstin: "",
    category: "",
    ownerPan: "",
    ownerDob: "",
    city: "",
    state: "",
    country: "IN",
    postalCode: "",
    defaultUpiVpa: "",
  });

  const updateForm = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      return cryptoPaySdk.merchants.createMerchant({
        legalName: formData.legalName,
        displayName: formData.displayName,
        gstin: formData.gstin,
        category: formData.category,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        defaultUpiVpa: formData.defaultUpiVpa,
        metadata: {
          ownerPan: formData.ownerPan,
          ownerDob: formData.ownerDob,
        },
      });
    },
    onSuccess: () => setStep(4),
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar backHref="/merchant" title="Become a Merchant" />

      <div className="px-[20px] pt-1 space-y-5">
        {step < 5 && (
          <>
            <p className="text-[14px] text-on-surface-variant">
              Start accepting instant crypto payments settled in fiat.
            </p>

            {/* Stepper */}
            <div className="flex items-center justify-between">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step >= s.id
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        step >= s.id ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {s.name}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${step > s.id ? "bg-primary" : "bg-outline-variant"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Business */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <p className="text-[18px] font-bold text-on-background">Business Details</p>
              <p className="text-[13px] text-on-surface-variant">Tell us about your business.</p>
            </div>
            <Field label="Legal Business Name">
              <input
                required
                name="legalName"
                value={formData.legalName}
                onChange={updateForm}
                className={inputCls}
                placeholder="Rao Retail Private Limited"
              />
            </Field>
            <Field label="Display Name (Store Name)">
              <input
                required
                name="displayName"
                value={formData.displayName}
                onChange={updateForm}
                className={inputCls}
                placeholder="Rao Fresh Mart"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GSTIN (Optional)">
                <input name="gstin" value={formData.gstin} onChange={updateForm} className={inputCls} placeholder="27ABCDE1234F1Z5" />
              </Field>
              <Field label="Category">
                <select name="category" value={formData.category} onChange={updateForm} className={inputCls}>
                  <option value="">Select…</option>
                  <option value="retail">Retail & Grocery</option>
                  <option value="fnb">Food & Beverage</option>
                  <option value="services">Services</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </Field>
            </div>
            <button
              onClick={nextStep}
              disabled={!formData.legalName || !formData.displayName}
              className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Identity */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-[18px] font-bold text-on-background">Owner Identity & Address</p>
              <p className="text-[13px] text-on-surface-variant">Regulatory details required for compliance.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="PAN Number">
                <input name="ownerPan" value={formData.ownerPan} onChange={updateForm} className={`${inputCls} uppercase`} placeholder="ABCDE1234F" />
              </Field>
              <Field label="Date of Birth">
                <input type="date" name="ownerDob" value={formData.ownerDob} onChange={updateForm} className={inputCls} />
              </Field>
              <Field label="City">
                <input name="city" value={formData.city} onChange={updateForm} className={inputCls} placeholder="Mumbai" />
              </Field>
              <Field label="State">
                <input name="state" value={formData.state} onChange={updateForm} className={inputCls} placeholder="Maharashtra" />
              </Field>
              <Field label="Postal Code">
                <input name="postalCode" value={formData.postalCode} onChange={updateForm} className={inputCls} placeholder="400001" />
              </Field>
              <Field label="Country">
                <select name="country" value={formData.country} onChange={updateForm} className={inputCls} disabled>
                  <option value="IN">India (IN)</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevStep}
                className="flex-1 py-3.5 rounded-full bg-surface-container-lowest border border-outline-variant text-on-background font-semibold"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.city || !formData.state}
                className="flex-1 py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Settlement */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-[18px] font-bold text-on-background">Settlement Information</p>
              <p className="text-[13px] text-on-surface-variant">Where should we send your fiat settlements?</p>
            </div>
            <Field label="Primary UPI VPA">
              <input
                name="defaultUpiVpa"
                value={formData.defaultUpiVpa}
                onChange={updateForm}
                className={inputCls}
                placeholder="merchant@bank"
              />
            </Field>
            <p className="text-[12px] text-on-surface-variant">
              All crypto payments will be automatically swapped to INR and settled to this VPA.
            </p>

            {submitMutation.isError && (
              <p className="text-error text-[13px]">
                {(submitMutation.error as Error).message || "An error occurred while submitting."}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={prevStep}
                disabled={submitMutation.isPending}
                className="flex-1 py-3.5 rounded-full bg-surface-container-lowest border border-outline-variant text-on-background font-semibold disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={!formData.defaultUpiVpa || submitMutation.isPending}
                className="flex-1 py-3.5 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {submitMutation.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: KYC */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <p className="text-[18px] font-bold text-on-background">KYC Verification</p>
              <p className="text-[13px] text-on-surface-variant">
                Complete your identity verification to start accepting payments.
              </p>
            </div>
            <KycOnboarding onClose={() => setStep(5)} />
            <button
              onClick={() => setStep(5)}
              className="w-full py-3.5 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-semibold"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="pt-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[36px]">check_circle</span>
            </div>
            <div>
              <p className="text-[20px] font-bold text-on-background">Application Submitted</p>
              <p className="text-[14px] text-on-surface-variant mt-2 max-w-xs">
                Your merchant application for <strong>{formData.legalName}</strong> has been received. Our team will
                review it shortly.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold active:scale-[0.98] transition-transform"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
