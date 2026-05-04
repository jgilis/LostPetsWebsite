import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-500 py-6 space-x-4 border-t border-gray-800 mt-10">
          <a href="/about" className="hover:text-gray-300">
            About
          </a>
          <a href="/privacy" className="hover:text-gray-300">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-gray-300">
            Terms of Use
          </a>
        </footer>

      </body>
    </html>
  );
}