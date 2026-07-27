"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import type { ReactNode } from "react";
import { classNames } from "@/lib/format";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames("glass rounded-2xl p-5", className)}>
      {children}
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  backHref,
  right,
}: {
  title: string;
  subtitle?: string;
  backHref?: string | undefined;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="focus-ring mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:text-fg"
            aria-label="Back"
          >
            <Icon icon="ph:arrow-left" className="text-lg" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-brand text-white shadow-lg shadow-brand/25 hover:scale-[1.01]",
    ghost: "border border-hairline-strong text-fg-muted hover:text-fg",
    danger: "bg-danger/15 text-danger hover:bg-danger/25",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "focus-ring w-full rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-40",
        styles,
        className
      )}
    >
      {children}
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <Icon
      icon="ph:circle-notch-bold"
      className={classNames("spinner text-brand", className)}
    />
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-success/15 text-success",
    FAILED: "bg-danger/15 text-danger",
    CANCELLED: "bg-danger/15 text-danger",
    ERROR: "bg-danger/15 text-danger",
    EXPIRED: "bg-danger/15 text-danger",
    REFUNDED: "bg-warning/15 text-warning",
  };
  const cls = map[status] || "bg-brand/15 text-brand";
  return (
    <span
      className={classNames(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        cls
      )}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-fg-muted">
        <Icon icon={icon} className="text-2xl" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        {body && <p className="mt-1 text-sm text-fg-muted">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      icon="ph:wallet"
      title="Connect your wallet"
      body="Link Freighter to view balances and make payments."
      action={
        <div className="mt-2 w-48">
          <Button onClick={onConnect}>Connect Wallet</Button>
        </div>
      }
    />
  );
}
