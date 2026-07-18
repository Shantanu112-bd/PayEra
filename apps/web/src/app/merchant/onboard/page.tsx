"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { CheckCircle2, ChevronRight, Store, User, CreditCard } from "lucide-react";

export default function MerchantOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  
  const [formData, setFormData] = React.useState({
    // Step 1: Business Profile
    legalName: "",
    displayName: "",
    gstin: "",
    category: "",
    // Step 2: Owner Identity
    ownerPan: "",
    ownerDob: "",
    city: "",
    state: "",
    country: "IN",
    postalCode: "",
    // Step 3: Bank / Settlement
    defaultUpiVpa: "",
  });

  const updateForm = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        }
      });
    },
    onSuccess: () => {
      setStep(4); // Success step
    }
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { id: 1, name: "Business Profile", icon: Store },
    { id: 2, name: "Owner Identity", icon: User },
    { id: 3, name: "Settlement Info", icon: CreditCard },
  ];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Become a Merchant</h1>
        <p className="text-gray-500 mt-2">Start accepting instant crypto payments settled in fiat.</p>
      </div>

      {step < 4 && (
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className={`flex flex-col items-center ${step >= s.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                  step >= s.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{s.name}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${step > s.id ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {step === 1 && (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold">Business Details</h2>
              <p className="text-sm text-gray-500 mt-1">Tell us about your business.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Legal Business Name</label>
                <input 
                  required
                  name="legalName"
                  value={formData.legalName}
                  onChange={updateForm}
                  className="w-full px-3 py-2 border rounded-md" 
                  placeholder="e.g. Rao Retail Private Limited" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Name (Store Name)</label>
                <input 
                  required
                  name="displayName"
                  value={formData.displayName}
                  onChange={updateForm}
                  className="w-full px-3 py-2 border rounded-md" 
                  placeholder="e.g. Rao Fresh Mart" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">GSTIN (Optional)</label>
                  <input 
                    name="gstin"
                    value={formData.gstin}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-md" 
                    placeholder="27ABCDE1234F1Z5" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select a category</option>
                    <option value="retail">Retail & Grocery</option>
                    <option value="fnb">Food & Beverage</option>
                    <option value="services">Services</option>
                    <option value="ecommerce">E-commerce</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={nextStep}
                disabled={!formData.legalName || !formData.displayName}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold">Owner Identity & Address</h2>
              <p className="text-sm text-gray-500 mt-1">Regulatory details required for compliance.</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PAN Number</label>
                  <input 
                    name="ownerPan"
                    value={formData.ownerPan}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-md uppercase" 
                    placeholder="ABCDE1234F" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input 
                    type="date"
                    name="ownerDob"
                    value={formData.ownerDob}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-md" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input 
                    name="city"
                    value={formData.city}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-md" 
                    placeholder="Mumbai" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input 
                    name="state"
                    value={formData.state}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-md" 
                    placeholder="Maharashtra" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <input 
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-md" 
                    placeholder="400001" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <select 
                    name="country"
                    value={formData.country}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                    disabled
                  >
                    <option value="IN">India (IN)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={prevStep}
                className="px-6 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button 
                onClick={nextStep}
                disabled={!formData.city || !formData.state}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold">Settlement Information</h2>
              <p className="text-sm text-gray-500 mt-1">Where should we send your fiat settlements?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Primary UPI VPA</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 bg-gray-50 text-gray-500 rounded-l-md text-sm">
                    UPI
                  </span>
                  <input 
                    name="defaultUpiVpa"
                    value={formData.defaultUpiVpa}
                    onChange={updateForm}
                    className="w-full px-3 py-2 border rounded-r-md outline-none focus:ring-1 focus:ring-indigo-500" 
                    placeholder="merchant@bank" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  All crypto payments will be automatically swapped to INR and settled to this VPA.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={prevStep}
                disabled={submitMutation.isPending}
                className="px-6 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={() => submitMutation.mutate()}
                disabled={!formData.defaultUpiVpa || submitMutation.isPending}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
            
            {submitMutation.isError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {(submitMutation.error as Error).message || "An error occurred while submitting."}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Application Submitted</h2>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Your merchant application for <strong>{formData.legalName}</strong> has been received. Our admin team will review it shortly.
              </p>
            </div>
            <div className="pt-4">
              <button 
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
