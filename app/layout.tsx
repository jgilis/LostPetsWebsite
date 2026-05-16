import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteFooter from "../src/components/layout/SiteFooter";
import { NotificationsProvider } from "../src/components/notifications/NotificationsProvider";
import ServiceWorkerRegistration from "../src/components/pwa/ServiceWorkerRegistration";
import AuthHashCleanup from "../src/components/auth/AuthHashCleanup";
import { VisibilitySyncProvider } from "../src/components/sync/VisibilitySyncProvider";
import { RealtimeResyncProvider } from "../src/components/sync/RealtimeResyncProvider";

// ✅ Import Leaflet CSS globally
import 'leaflet/dist/leaflet.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lost & Found Pets Map",
  description: "Community lost & found pets map",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  appleWebApp: {
    capable: true,
    title: "Lost Pets",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">

        <VisibilitySyncProvider>
          <RealtimeResyncProvider>
          <NotificationsProvider>
            {/* PAGE CONTENT */}
            {children}

            <SiteFooter />
          </NotificationsProvider>
          </RealtimeResyncProvider>
        </VisibilitySyncProvider>

        <ServiceWorkerRegistration />
        <AuthHashCleanup />

      </body>
    </html>
  );
}