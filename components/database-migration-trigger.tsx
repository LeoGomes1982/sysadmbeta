"use client"

import { useState, useEffect } from "react"
import { Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DatabaseMigrationTriggerProps {
  onTriggerMigration: () => void
}

export function DatabaseMigrationTrigger({ onTriggerMigration }: DatabaseMigrationTriggerProps) {
  const [isPulsing, setIsPulsing] = useState(false)

  useEffect(() => {
    // Pulsar a cada 10 minutos (600000ms)
    const pulseInterval = setInterval(() => {
      setIsPulsing(true)
      // Parar de pulsar após 5 segundos
      setTimeout(() => setIsPulsing(false), 5000)
    }, 600000) // 10 minutos

    // Pulsar imediatamente na primeira vez para demonstração
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 5000)

    return () => clearInterval(pulseInterval)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onTriggerMigration}
            className={`relative ${isPulsing ? "animate-pulse" : ""}`}
          >
            <Database className={`h-5 w-5 ${isPulsing ? "text-blue-600" : "text-gray-600"}`} />
            {isPulsing && <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-ping" />}
            <span className="sr-only">Migração de Dados</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clique para abrir a migração de dados</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
