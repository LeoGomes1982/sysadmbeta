"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Database, Upload, CheckCircle, AlertCircle, X } from "lucide-react"
import { useMigration, LocalStorageMigration } from "@/lib/migration/localStorage-to-supabase"

export interface MigrationBannerRef {
  showBanner: () => void
  hideBanner: () => void
}

export const MigrationBanner = forwardRef<MigrationBannerRef>((props, ref) => {
  const [showBanner, setShowBanner] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const { runMigration } = useMigration()

  useImperativeHandle(ref, () => ({
    showBanner: () => setShowBanner(true),
    hideBanner: () => setShowBanner(false),
  }))

  useEffect(() => {
    const hasSupabaseConfig =
      typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!hasSupabaseConfig) {
      console.log("[v0] Supabase not configured, migration banner disabled")
      return
    }

    // Verificar se há dados no localStorage e se migração não foi executada
    const hasLocalStorageData =
      localStorage.getItem("sysathos_funcionarios") ||
      localStorage.getItem("clients") ||
      localStorage.getItem("extraServices") ||
      localStorage.getItem("dadosInfo")

    const migrationCompleted = LocalStorageMigration.isMigrationCompleted()

    // setShowBanner(hasLocalStorageData || !migrationCompleted)

    // Debug: mostrar informações no console
    console.log("[v0] Debug Migration Banner:")
    console.log("[v0] Has localStorage data:", !!hasLocalStorageData)
    console.log("[v0] Migration completed:", migrationCompleted)
  }, [])

  const handleMigration = async () => {
    setMigrationStatus("running")
    setProgress(0)

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await runMigration()

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setMigrationStatus("success")
        setMigrationResult(result)
        // Esconder banner após 5 segundos
        setTimeout(() => setShowBanner(false), 5000)
      } else {
        setMigrationStatus("error")
        setMigrationResult(result)
      }
    } catch (error) {
      setMigrationStatus("error")
      setMigrationResult({ error: error.message })
      setProgress(0)
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Migração para Banco de Dados</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowBanner(false)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Detectamos dados no localStorage. Migre para o banco de dados para melhor performance e sincronização.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {migrationStatus === "idle" && (
            <Button onClick={handleMigration} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Migrar Dados Agora
            </Button>
          )}

          {migrationStatus === "running" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Migrando dados...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {migrationStatus === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Migração concluída!</strong>
                <br />
                {migrationResult?.totalMigrated || 0} registros migrados com sucesso.
                <br />
                <span className="text-xs">Este banner será removido automaticamente.</span>
              </AlertDescription>
            </Alert>
          )}

          {migrationStatus === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Erro na migração:</strong>
                <br />
                {migrationResult?.error || "Erro desconhecido"}
                <br />
                <Button variant="outline" size="sm" onClick={handleMigration} className="mt-2 bg-transparent">
                  Tentar Novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

MigrationBanner.displayName = "MigrationBanner"
