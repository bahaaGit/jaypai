import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Jaypai — Send packages with trusted travelers",
  description: "Find trusted travelers flying where your package needs to go.",
  applicationName: "Jaypai",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jaypai",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    // iOS standalone mode — without this, the home-screen icon can open
    // as a regular Safari tab on some iOS versions.
    "apple-mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00853F",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="h-full bg-background text-foreground antialiased">
        {children}
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  )
}
