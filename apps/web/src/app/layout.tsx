import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { Providers } from "../components/providers/Providers";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PayEra — Pay with Crypto, Earn STAR Rewards",
  description: "Instant Stellar payments and STAR token rewards at every merchant. Pay with USDC or XLM, earn loyalty tokens, settle instantly on-chain.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={hankenGrotesk.className}>
      <body className="bg-background text-on-background min-h-screen antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
