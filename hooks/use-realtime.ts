"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function useRealtimeData<T>(table: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    if (!supabase) {
      console.warn(`[v0] Supabase client not available for table ${table}`)
      setLoading(false)
      return
    }

    // Buscar dados iniciais
    const fetchInitialData = async () => {
      try {
        const { data: initialData, error } = await supabase
          .from(table)
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.warn(`[v0] Tabela '${table}' não encontrada ou erro ao buscar dados:`, error.message)
          setData([])
        } else {
          setData(initialData || [])
        }
      } catch (error) {
        console.warn(`[v0] Erro ao acessar tabela '${table}':`, error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Configurar subscription para mudanças em tempo real
    try {
      const channel = supabase
        .channel(`${table}-changes`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table,
          },
          (payload) => {
            console.log(`[v0] ${table} change received:`, payload)

            if (payload.eventType === "INSERT") {
              setData((prev) => [payload.new as T, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setData((prev) =>
                prev.map((item) => ((item as any).id === (payload.new as any).id ? (payload.new as T) : item)),
              )
            } else if (payload.eventType === "DELETE") {
              setData((prev) => prev.filter((item) => (item as any).id !== (payload.old as any).id))
            }
          },
        )
        .subscribe()

      // Cleanup
      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.warn(`[v0] Erro ao configurar subscription para tabela '${table}':`, error)
    }
  }, [table])

  return { data, loading, setData }
}

// Hook específico para funcionários
export function useEmployees() {
  return useRealtimeData("employees")
}

// Hook específico para funcionários com capacidade de atualização manual
export function useEmployeesWithRefresh() {
  const { data, loading, setData } = useRealtimeData("employees")
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    const supabase = createClient()

    try {
      const { data: freshData, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Erro ao recarregar funcionários:", error)
      } else {
        console.log("[v0] Funcionários recarregados com sucesso")
        setData(freshData || [])
      }
    } catch (error) {
      console.error("[v0] Erro ao recarregar funcionários:", error)
    } finally {
      setRefreshing(false)
    }
  }

  return { data, loading, setData, refresh, refreshing }
}

// Hook específico para clientes e fornecedores
export function useClientsSuppliers() {
  return useRealtimeData("clients_suppliers")
}

// Hook específico para serviços extras
export function useExtraServices() {
  return useRealtimeData("extra_services")
}

// Hook específico para dados financeiros
export function useDataEntries() {
  return useRealtimeData("data_entries")
}

// Hook específico para compromissos
export function useAppointments() {
  return useRealtimeData("appointments")
}

// Hook específico para credenciais de login
export function useLoginCredentials() {
  return useRealtimeData("login_credentials")
}

// Hook específico para projetos
export function useProjects() {
  return useRealtimeData("projects")
}

// Hook específico para posições/cargos
export function usePositions() {
  return useRealtimeData("positions")
}

// Hook específico para dados relacionados aos funcionários
export function useEmployeeRelatedData(employeeId: string, table: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    if (!supabase) {
      console.warn(`[v0] Supabase client not available for table ${table}`)
      setLoading(false)
      return
    }

    if (!employeeId) {
      setData([])
      setLoading(false)
      return
    }

    // Buscar dados iniciais
    const fetchInitialData = async () => {
      try {
        const { data: initialData, error } = await supabase
          .from(table)
          .select("*")
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false })

        if (error) {
          console.warn(`[v0] Tabela '${table}' não encontrada ou erro ao buscar dados:`, error.message)
          setData([])
        } else {
          setData(initialData || [])
        }
      } catch (error) {
        console.warn(`[v0] Erro ao acessar tabela '${table}':`, error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Configurar subscription para mudanças em tempo real
    try {
      const channel = supabase
        .channel(`${table}-${employeeId}-changes`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table,
            filter: `employee_id=eq.${employeeId}`,
          },
          (payload) => {
            console.log(`[v0] ${table} change for employee ${employeeId}:`, payload)

            if (payload.eventType === "INSERT") {
              setData((prev) => [payload.new, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setData((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)))
            } else if (payload.eventType === "DELETE") {
              setData((prev) => prev.filter((item) => item.id !== payload.old.id))
            }
          },
        )
        .subscribe()

      // Cleanup
      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.warn(`[v0] Erro ao configurar subscription para tabela '${table}':`, error)
    }
  }, [employeeId, table])

  return { data, loading, setData }
}

// Hooks específicos para dados relacionados aos funcionários
export function useEmployeeDependents(employeeId: string) {
  return useEmployeeRelatedData(employeeId, "employee_dependents")
}

export function useEmployeeHistory(employeeId: string) {
  return useEmployeeRelatedData(employeeId, "employee_history")
}

export function useEmployeeEvaluations(employeeId: string) {
  return useEmployeeRelatedData(employeeId, "employee_evaluations")
}

export function useEmployeeInspections(employeeId: string) {
  return useEmployeeRelatedData(employeeId, "employee_inspections")
}

export function useEmployeeSanctions(employeeId: string) {
  return useEmployeeRelatedData(employeeId, "employee_sanctions")
}

// Hook específico para pastas
export function useFolders() {
  return useRealtimeData("folders")
}

// Hook específico para arquivos
export function useFiles() {
  return useRealtimeData("files")
}

// Hook específico para arquivos de uma pasta específica
export function useFilesByFolder(folderId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) {
      console.warn(`[v0] Supabase client not available for files`)
      setLoading(false)
      return
    }

    // Buscar dados iniciais
    const fetchInitialData = async () => {
      try {
        let query = supabase.from("files").select("*").order("created_at", { ascending: false })

        if (folderId) {
          query = query.eq("folder_id", folderId)
        } else {
          query = query.is("folder_id", null)
        }

        const { data: initialData, error } = await query

        if (error) {
          console.warn(`[v0] Tabela 'files' não encontrada ou erro ao buscar dados:`, error.message)
          setData([])
        } else {
          setData(initialData || [])
        }
      } catch (error) {
        console.warn(`[v0] Erro ao acessar tabela 'files':`, error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Configurar subscription para mudanças em tempo real
    try {
      const channel = supabase
        .channel(`files-${folderId || "loose"}-changes`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "files",
            filter: folderId ? `folder_id=eq.${folderId}` : "folder_id=is.null",
          },
          (payload) => {
            console.log(`[v0] Files change for folder ${folderId}:`, payload)

            if (payload.eventType === "INSERT") {
              setData((prev) => [payload.new, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setData((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)))
            } else if (payload.eventType === "DELETE") {
              setData((prev) => prev.filter((item) => item.id !== payload.old.id))
            }
          },
        )
        .subscribe()

      // Cleanup
      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.warn(`[v0] Erro ao configurar subscription para tabela 'files':`, error)
    }
  }, [folderId])

  return { data, loading, setData }
}

// Hook específico para sincronização global
export function useGlobalSync() {
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle")
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const supabase = createClient()

  const triggerSync = async () => {
    setSyncStatus("syncing")
    try {
      // Disparar evento customizado para notificar outros componentes
      window.dispatchEvent(
        new CustomEvent("globalDataSync", {
          detail: { timestamp: new Date() },
        }),
      )

      setLastSync(new Date())
      setSyncStatus("synced")

      // Reset status após 3 segundos
      setTimeout(() => setSyncStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro na sincronização:", error)
      setSyncStatus("error")
    }
  }

  return { syncStatus, lastSync, triggerSync }
}
