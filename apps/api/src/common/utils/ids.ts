import { createHash, randomBytes } from "node:crypto";

export function createReadableId(prefix: string): string {
  return `${prefix}_${randomBytes(10).toString("hex").toUpperCase()}`;
}

export function createReferralCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
