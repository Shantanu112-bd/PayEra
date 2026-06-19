export interface UpiQrPayload {
  upiVpa: string        // pa= field — merchant's UPI ID
  merchantName: string  // pn= field
  amount?: number       // am= field (optional — user enters if missing)
  currency: string      // cu= field (always INR)
  note?: string         // tn= field
  isValid: boolean
  rawPayload: string
}

export function parseUpiQr(rawText: string): UpiQrPayload {
  const invalid: UpiQrPayload = {
    upiVpa: '',
    merchantName: '',
    currency: 'INR',
    isValid: false,
    rawPayload: rawText,
  }

  try {
    // Handle both upi:// and UPI:// formats
    if (!rawText.toLowerCase().startsWith('upi://pay')) {
      return invalid
    }

    const urlString = rawText.replace(/^(upi|UPI):\/\/pay/, 'http://pay');
    const url = new URL(urlString);
    const params = url.searchParams;

    const upiVpa = params.get('pa');
    const merchantName = params.get('pn');
    const amountStr = params.get('am');
    const currency = params.get('cu') || 'INR';
    const note = params.get('tn');

    if (!upiVpa) return invalid;

    const result: UpiQrPayload = {
      upiVpa,
      merchantName: merchantName || upiVpa,
      currency,
      isValid: true,
      rawPayload: rawText,
    };

    if (amountStr) {
      const parsedAmount = parseFloat(amountStr);
      if (!isNaN(parsedAmount)) {
        result.amount = parsedAmount;
      }
    }

    if (note) {
      result.note = note;
    }

    return result;
  } catch {
    return invalid;
  }
}

export function isUpiVpa(text: string): boolean {
  // UPI VPA format: something@bankname
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(text);
}
