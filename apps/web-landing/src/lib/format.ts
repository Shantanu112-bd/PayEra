/* Small display helpers shared across app screens. */

export function shortAddr(addr: string | null | undefined, head = 4, tail = 4) {
  if (!addr) return "";
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function formatUsd(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
}

export function formatInr(paise: number | string | null | undefined): string {
  const v = Number(paise ?? 0) / 100;
  if (!Number.isFinite(v)) return "₹0";
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
