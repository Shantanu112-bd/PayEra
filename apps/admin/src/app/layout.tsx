import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "../components/providers/Providers";
import { AdminShell } from "../components/layout/AdminShell";
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
  title: "Admin Portal | CryptoPay Network",
  description: "Administrative interface for managing users, merchants, and transactions on the CryptoPay Network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-white text-ink min-h-screen antialiased">
        <Providers>
          <AdminShell>
            {children}
          </AdminShell>
        </Providers>
      </body>
    </html>
  );
}
