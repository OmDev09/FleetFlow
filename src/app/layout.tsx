import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetFlow — Fleet & Logistics Management",
  description: "Centralized, rule-based digital hub for delivery fleet lifecycle, safety, and financial performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
