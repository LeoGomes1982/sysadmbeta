"use client"

import { useState, useEffect } from "react"
import { loginOperations } from "@/lib/database/operations"

export function useLogins() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLogins = async () => {
    try {
      setLoading(true)
      const logins = await loginOperations.getAll()
      setData(logins)
      setError(null)
    } catch (err) {
      console.error("[v0] Erro ao carregar logins:", err)
      setError("Erro ao carregar logins")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogins()
  }, [])

  return {
    data,
    loading,
    error,
    setData,
    reload: loadLogins,
  }
}
