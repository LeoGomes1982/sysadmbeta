"use client"

import { Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { DatabaseStatus } from "@/components/database-status"
import { DatabaseMigrationTrigger } from "@/components/database-migration-trigger"
import { useRef } from "react"
import { MigrationBanner, type MigrationBannerRef } from "@/components/migration-banner"

export function Header() {
  const migrationBannerRef = useRef<MigrationBannerRef>(null)

  const handleTriggerMigration = () => {
    migrationBannerRef.current?.showBanner()
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex ml-4">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <Image src="/images/logo-ga-preto.jpeg" alt="Logo GA" width={32} height={32} className="rounded" />
              <span className="hidden font-bold sm:inline-block">SysAthos</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center gap-4">
              <DatabaseStatus />
            </div>
            <nav className="flex items-center">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <DatabaseMigrationTrigger onTriggerMigration={handleTriggerMigration} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">SysAthos</p>
                    <p className="text-xs text-muted-foreground">Grupo Athos Brasil</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>
      <MigrationBanner ref={migrationBannerRef} />
    </>
  )
}
