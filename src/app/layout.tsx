import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { NativeAppClass } from "@/components/native-app-class";
import { RouteStamp } from "@/components/route-stamp";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cubity",
    template: "%s · Cubity",
  },
  description:
    "Cubity Engineering & Construction workspace: receivables, invoices, and more.",
  icons: { icon: "/cubity-logo.jpg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#128C86",
  interactiveWidget: "resizes-content",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full flex-col">
        <NativeAppClass />
        <TooltipProvider>
          {children}
          <RouteStamp />
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
