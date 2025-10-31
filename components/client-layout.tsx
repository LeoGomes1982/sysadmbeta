"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === "/portal-admissao/externo") {
    return <div className="min-h-screen bg-gray-100">{children}</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">{children}</main>
      </div>
      {/* MigrationBanner duplicado removido - já está no header */}
    </div>
  )
}
