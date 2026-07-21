"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Store, Activity, LayoutDashboard, ShieldCheck, LogOut, ArrowLeftRight, Gift } from "lucide-react";
import { useAdminStore } from "../../lib/store";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Merchants", href: "/merchants", icon: Store },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Rewards", href: "/rewards", icon: Gift },
  { name: "Audit Logs", href: "/logs", icon: Activity },
  { name: "AML & Screening", href: "/aml", icon: ShieldCheck },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAdminStore();

  return (
    <div className="flex h-screen bg-[#F7F7F7]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="font-mono text-xl font-bold tracking-tight">⟠ Admin Portal</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-[#E8F5E9] text-[#2E7D32]" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              logout();
              window.location.reload();
            }}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
