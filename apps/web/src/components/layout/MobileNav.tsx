"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, Gift, User } from "lucide-react";
import { cn } from "@cryptopay/ui";
import { motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Pay", href: "/pay", icon: QrCode },
  { name: "Rewards", href: "/rewards", icon: Gift },
  { name: "Profile", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F5F2EC] border-t-[1.5px] border-[#1A1A1A] h-[64px] pb-safe z-50">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname.startsWith(item.href);
            
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-12 rounded-full z-10 transition-colors",
                isActive ? "text-[#1A1A1A]" : "text-muted hover:text-ink"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 bg-[#C5D483] rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium font-[family-name:var(--font-ibm-plex-mono)]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
