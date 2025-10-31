"use client"

import { useState, useEffect } from "react"
import { appointmentOperations } from "@/lib/database/operations"

export function useAppointments() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const appointments = await appointmentOperations.getAll()
      setData(appointments)
      setError(null)
    } catch (err) {
      console.error("[v0] Erro ao carregar compromissos:", err)
      setError("Erro ao carregar compromissos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  return {
    data,
    loading,
    error,
    setData,
    reload: loadAppointments,
  }
}
