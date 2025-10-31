import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import type React from "react"
import { ClientLayout } from "@/components/client-layout"
import { PWAInstaller } from "@/components/pwa-installer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema Athos de Gestão e Administração",
  description: "Sistema Athos de Gestão e Administração",
  generator: "v0.app",
  manifest: "/manifest.json",
  keywords: ["sistema", "gestão", "administração", "clínica", "médico", "athos"],
  authors: [{ name: "SysAthos" }],
  creator: "SysAthos",
  publisher: "SysAthos",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SysAthos",
  },
  other: {
    "application-name": "SysAthos",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "SysAthos",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/icons/browserconfig.xml",
    "msapplication-TileColor": "#1f2937",
    "msapplication-tap-highlight": "no",
    "theme-color": "#1f2937",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
        <PWAInstaller />
        <Toaster />
      </body>
    </html>
  )
}
