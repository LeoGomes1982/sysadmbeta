"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useEmployees() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEmployees = async () => {
    try {
      setLoading(true)
      console.log("[v0] Carregando funcionários...")

      const supabase = createClient()

      if (!supabase) {
        throw new Error("Não foi possível criar o cliente Supabase")
      }

      const { data: employees, error: fetchError } = await supabase
        .from("employees")
        .select("*")
        .order("nome", { ascending: true })

      if (fetchError) {
        console.error("[v0] Erro do Supabase:", fetchError)
        throw fetchError
      }

      console.log("[v0] Funcionários carregados:", employees?.length || 0)

      setData(employees || [])
      setError(null)
    } catch (err) {
      console.error("[v0] Erro ao carregar funcionários:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar funcionários")
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  return {
    data,
    loading,
    error,
    setData,
    reload: loadEmployees,
  }
}
