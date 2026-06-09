import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "GambiaBridge — Send packages with trusted travelers",
  description: "Find trusted travelers flying where your package needs to go.",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      </body>
    </html>
  )
}
