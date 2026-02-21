import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "FleetFlow - Fleet & Logistics Management",
  description: "Centralized, rule-based digital hub for delivery fleet lifecycle, safety, and financial performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${sora.variable} min-h-screen font-sans antialiased`}>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
