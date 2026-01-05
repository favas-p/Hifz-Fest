import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { ToastProvider } from "@/components/toast-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { RealtimeProvider } from "@/components/realtime-provider";
import { PublicPageWrapper } from "@/components/public-page-wrapper";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: {
    default: "Hifz Fest - Showcasing Islamic Art & Culture",
    template: "%s | Hifz Fest",
  },
  description:
    "A premier platform for students to showcase their talents and highlight the rich art forms of Islamic culture. Live scoreboard, admin controls, and jury tools for Hifz Fest.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://hifzfest.noorululama.org"),
  keywords: ["Hifz Fest", "Islamic Art", "Culture", "Student Festival", "Live Scoreboard", "Arts Competition"],
  authors: [{ name: "Hifz Fest Team" }],
  creator: "Hifz Fest",
  publisher: "Hifz Fest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hifz Fest",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Hifz Fest - Showcasing Islamic Art & Culture",
    description: "A premier platform for students to showcase their talents and highlight the rich art forms of Islamic culture.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://hifzfest.noorululama.org",
    siteName: "Hifz Fest",
    images: [
      {
        url: "/img/hero/Fest-logo.webp",
        width: 800,
        height: 600,
        alt: "Hifz Fest Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hifz Fest",
    description: "Celebrating Islamic Art & Culture through student talent.",
    images: ["/img/hero/Fest-logo.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "KVXemRNq5bBTJadrMPQXLbSxFtPnazEmvfX6uguvd5U",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#3b0764",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b0764" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hifz Fest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b0764" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >

        <RealtimeProvider>
          <OfflineIndicator />
          <ToastProvider>
            <PublicPageWrapper>
              {children}
            </PublicPageWrapper>
          </ToastProvider>
          <PWAInstallPrompt />
        </RealtimeProvider>
        <JsonLd />
      </body>
    </html>
  );
}
