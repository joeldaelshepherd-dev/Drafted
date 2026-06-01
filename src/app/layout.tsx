import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drafted — Fantasy Tournament Pools",
  description:
    "Invite-only, multi-pool fantasy tournament app. Draft real teams, predict matchweeks, and battle your syndicate live.",
};

export const viewport: Viewport = {
  themeColor: "#080a10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
