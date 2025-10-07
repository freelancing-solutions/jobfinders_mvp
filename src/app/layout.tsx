/**
 * Root layout component for the Job Finders application
 * Provides the base HTML structure, font configuration, and global providers
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Finders - Find Your Dream Job in South Africa",
  description: "Connect with top companies and discover opportunities that match your skills and aspirations. The leading job platform for South African professionals.",
  keywords: ["jobs", "careers", "South Africa", "employment", "job search", "recruitment", "career opportunities"],
  authors: [{ name: "Job Finders Team" }],
  openGraph: {
    title: "Job Finders - Find Your Dream Job in South Africa",
    description: "Connect with top companies and discover opportunities that match your skills and aspirations.",
    url: "https://jobfinders.co.za",
    siteName: "Job Finders",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Job Finders - Find Your Dream Job in South Africa",
    description: "Connect with top companies and discover opportunities that match your skills and aspirations.",
  },
};

/**
 * Root layout component that wraps the entire application
 * @param children - The child components to render
 * @returns The root layout with providers and global styling
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
