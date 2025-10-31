"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Database, Wifi, WifiOff, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [userCount, setUserCount] = useState<number>(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("employees").select("id", { count: "exact", head: true })

        if (error) {
          setIsConnected(false)
        } else {
          setIsConnected(true)
          setUserCount(data?.length || 0)
          setLastSync(new Date())
        }
      } catch (error) {
        setIsConnected(false)
      }
    }

    // Verificar conexão inicial
    checkConnection()

    // Verificar conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000)

    // Escutar eventos de sincronização global
    const handleGlobalSync = () => {
      setLastSync(new Date())
    }

    window.addEventListener("globalDataSync", handleGlobalSync)

    return () => {
      clearInterval(interval)
      window.removeEventListener("globalDataSync", handleGlobalSync)
    }
  }, [])

  if (isConnected === null) {
    return (
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 animate-pulse text-gray-400" />
        <span className="text-xs text-gray-500">Verificando...</span>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                  Online
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                  Offline
                </Badge>
              </>
            )}
            {isConnected && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                <span>{userCount}</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p>
              <strong>Status:</strong> {isConnected ? "Conectado ao banco de dados" : "Desconectado"}
            </p>
            {isConnected && (
              <>
                <p>
                  <strong>Funcionários:</strong> {userCount} registros
                </p>
                {lastSync && (
                  <p>
                    <strong>Última sincronização:</strong> {lastSync.toLocaleTimeString()}
                  </p>
                )}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
