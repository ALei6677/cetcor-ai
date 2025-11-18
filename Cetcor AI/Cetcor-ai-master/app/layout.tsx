import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerHandler } from "@/components/service-worker-handler";
import { AppProviders } from "@/components/providers/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cetcor AI - AI图片生成平台",
  description: "体验图片生成，让创意摇摆 - 基于火山引擎的AI图片生成服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyHydrationFix = {
    "ap-style": "",
  } as const;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        {...bodyHydrationFix}
      >
        <ServiceWorkerHandler />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
