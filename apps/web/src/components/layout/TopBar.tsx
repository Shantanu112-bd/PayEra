"use client";

import Link from "next/link";

interface TopBarProps {
  title?: string;
  backHref?: string;
  actions?: React.ReactNode;
  transparent?: boolean;
}

export function TopBar({ title, backHref, actions, transparent }: TopBarProps) {
  return (
    <header
      className={`sticky top-0 z-40 flex items-center gap-3 px-[20px] h-14 ${
        transparent ? "bg-transparent" : "bg-background"
      }`}
    >
      {backHref && (
        <Link href={backHref} className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container text-on-surface shrink-0">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
      )}
      {title && (
        <span className="flex-1 font-semibold text-on-surface text-base truncate">{title}</span>
      )}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
