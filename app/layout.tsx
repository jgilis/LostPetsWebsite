import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteFooter from "../src/components/layout/SiteFooter";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">

        {/* PAGE CONTENT */}
        {children}

        <SiteFooter />

      </body>
    </html>
  );
}