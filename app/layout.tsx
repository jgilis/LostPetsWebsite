import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteFooter from "../src/components/layout/SiteFooter";
import { NotificationsProvider } from "../src/components/notifications/NotificationsProvider";
import ServiceWorkerRegistration from "../src/components/pwa/ServiceWorkerRegistration";
import AuthHashCleanup from "../src/components/auth/AuthHashCleanup";
import { UserProfileProvider } from "../src/components/auth/UserProfileProvider";
import { VisibilitySyncProvider } from "../src/components/sync/VisibilitySyncProvider";
import { RealtimeResyncProvider } from "../src/components/sync/RealtimeResyncProvider";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { DEFAULT_LANGUAGE } from "../src/i18n/config";

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

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Lost & Found Pets Map",
  description: "Community lost & found pets map",
  manifest: "/manifest.json",
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
    <html lang={DEFAULT_LANGUAGE} suppressHydrationWarning>
      <body className="bg-gray-950 text-white">

        <I18nProvider>
        <UserProfileProvider>
        <VisibilitySyncProvider>
          <RealtimeResyncProvider>
          <NotificationsProvider>
            {/* PAGE CONTENT */}
            {children}

            <SiteFooter />
          </NotificationsProvider>
          </RealtimeResyncProvider>
        </VisibilitySyncProvider>
        </UserProfileProvider>
        </I18nProvider>

        <ServiceWorkerRegistration />
        <AuthHashCleanup />

      </body>
    </html>
  );
}