export function normalizeEmail(email: string | undefined): string | undefined {
  return email?.trim().toLowerCase();
}

export function normalizePhone(phone: string | undefined): string | undefined {
  return phone?.trim();
}

export function normalizeWalletAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function normalizeUpiVpa(upiVpa: string): string {
  return upiVpa.trim().toLowerCase();
}
