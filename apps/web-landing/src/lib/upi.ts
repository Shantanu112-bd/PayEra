/*
  UPI QR parsing — mirrors the intent of the existing app but rebuilt fresh
  for this project. Parses `upi://pay?...` payloads and validates bare VPAs.
*/

export interface UpiQrPayload {
  upiVpa: string;
  merchantName: string;
  amount?: number;
  currency: string;
  note?: string;
  isValid: boolean;
  rawPayload: string;
}

export function parseUpiQr(rawText: string): UpiQrPayload {
  const invalid: UpiQrPayload = {
    upiVpa: "",
    merchantName: "",
    currency: "INR",
    isValid: false,
    rawPayload: rawText,
  };

  try {
    if (!rawText.toLowerCase().startsWith("upi://pay")) return invalid;

    const url = new URL(rawText.replace(/^(upi|UPI):\/\/pay/, "http://pay"));
    const params = url.searchParams;

    const upiVpa = params.get("pa");
    if (!upiVpa) return invalid;

    const result: UpiQrPayload = {
      upiVpa,
      merchantName: params.get("pn") || upiVpa,
      currency: params.get("cu") || "INR",
      isValid: true,
      rawPayload: rawText,
    };

    const amountStr = params.get("am");
    if (amountStr) {
      const parsed = parseFloat(amountStr);
      if (!isNaN(parsed)) result.amount = parsed;
    }
    const note = params.get("tn");
    if (note) result.note = note;

    return result;
  } catch {
    return invalid;
  }
}

export function isUpiVpa(text: string): boolean {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(text);
}
