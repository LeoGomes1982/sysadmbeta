"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

export interface ExtraService {
  id: string
  executorType: "funcionario" | "externo"
  executorName: string
  service: string
  location: string
  supervisor: string
  date: string
  hours: "4" | "6" | "8" | "12"
  function: "Guarda" | "Limpeza"
  pixKey: string
  createdAt: string
  reason?: "falta" | "atestado" | "evento" | "limpeza_extra" | "outro"
  absentEmployeeName?: string
  certificateEmployeeName?: string
  certificateDate?: string
  extraCleaningClient?: string
  otherReasonText?: string
}

export function useExtraServices() {
  const [services, setServices] = useState<ExtraService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const loadServices = async () => {
    try {
      setLoading(true)
      console.log("[v0] Carregando serviços extras do Supabase...")

      const { data, error } = await supabase
        .from("extra_services")
        .select(
          "id, executor_type, executor_name, service, location, supervisor, date, hours, function, pix_key, created_at, reason, absent_employee_name, certificate_employee_name, certificate_date, extra_cleaning_client, other_reason_text",
        )
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Erro ao carregar serviços extras:", error)
        setError(error.message)
        return
      }

      const formattedServices: ExtraService[] = (data || []).map((item) => ({
        id: item.id,
        executorType: item.executor_type,
        executorName: item.executor_name,
        service: item.service,
        location: item.location,
        supervisor: item.supervisor,
        date: item.date,
        hours: item.hours,
        function: item.function,
        pixKey: item.pix_key,
        createdAt: item.created_at,
        reason: item.reason,
        absentEmployeeName: item.absent_employee_name,
        certificateEmployeeName: item.certificate_employee_name,
        certificateDate: item.certificate_date,
        extraCleaningClient: item.extra_cleaning_client,
        otherReasonText: item.other_reason_text,
      }))

      setServices(formattedServices)
      console.log("[v0] Serviços extras carregados do Supabase:", formattedServices.length)
    } catch (err) {
      console.error("[v0] Erro ao carregar serviços extras:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const addService = async (service: Omit<ExtraService, "id" | "createdAt">) => {
    try {
      console.log("[v0] Adicionando serviço extra ao Supabase...")

      const { data, error } = await supabase
        .from("extra_services")
        .insert([
          {
            executor_type: service.executorType,
            executor_name: service.executorName,
            service: service.service,
            location: service.location,
            supervisor: service.supervisor,
            date: service.date,
            hours: service.hours,
            function: service.function,
            pix_key: service.pixKey,
            reason: service.reason,
            absent_employee_name: service.absentEmployeeName,
            certificate_employee_name: service.certificateEmployeeName,
            certificate_date: service.certificateDate,
            extra_cleaning_client: service.extraCleaningClient,
            other_reason_text: service.otherReasonText,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("[v0] Erro ao adicionar serviço extra:", error)
        setError(error.message)
        return false
      }

      const newService: ExtraService = {
        id: data.id,
        executorType: data.executor_type,
        executorName: data.executor_name,
        service: data.service,
        location: data.location,
        supervisor: data.supervisor,
        date: data.date,
        hours: data.hours,
        function: data.function,
        pixKey: data.pix_key,
        createdAt: data.created_at,
        reason: data.reason,
        absentEmployeeName: data.absent_employee_name,
        certificateEmployeeName: data.certificate_employee_name,
        certificateDate: data.certificate_date,
        extraCleaningClient: data.extra_cleaning_client,
        otherReasonText: data.other_reason_text,
      }

      setServices((prev) => [newService, ...prev])
      console.log("[v0] Serviço extra adicionado com sucesso")
      return true
    } catch (err) {
      console.error("[v0] Erro ao adicionar serviço extra:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return false
    }
  }

  const deleteService = async (id: string) => {
    try {
      console.log("[v0] Excluindo serviço extra do Supabase...")

      const { error } = await supabase.from("extra_services").delete().eq("id", id)

      if (error) {
        console.error("[v0] Erro ao excluir serviço extra:", error)
        setError(error.message)
        return false
      }

      setServices((prev) => prev.filter((s) => s.id !== id))
      console.log("[v0] Serviço extra excluído com sucesso")
      return true
    } catch (err) {
      console.error("[v0] Erro ao excluir serviço extra:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return false
    }
  }

  useEffect(() => {
    loadServices()

    const channel = supabase
      .channel("extra_services_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "extra_services" }, (payload) => {
        console.log("[v0] Mudança em tempo real nos serviços extras:", payload)
        loadServices()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    services,
    loading,
    error,
    addService,
    deleteService,
    refreshServices: loadServices,
  }
}
