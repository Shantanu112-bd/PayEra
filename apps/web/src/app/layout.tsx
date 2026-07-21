import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "../components/providers/Providers";
import { AppShell } from "../components/layout/AppShell";
import { AppLock } from "../components/layout/AppLock";
import { DemoTour } from "../components/layout/DemoTour";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CryptoPay Network — Pay with Crypto, Earn with Every Scan",
  description: "CryptoPay brings instant Stellar payments and STAR token rewards to every merchant. Pay with USDC or XLM, earn loyalty tokens, settle instantly on-chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-page text-ink min-h-screen antialiased">
        <Providers>
          <AppLock>
            <AppShell>
              {children}
            </AppShell>
            <DemoTour />
          </AppLock>
        </Providers>
      </body>
    </html>
  );
}
