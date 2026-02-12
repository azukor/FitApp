import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";

export const metadata: Metadata = {
  title: "FitApp - Workout & Cycling Tracker",
  description: "Track your workouts and cycling rides",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="mx-auto max-w-2xl px-4 pt-4 pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
