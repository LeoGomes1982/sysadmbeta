"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

export interface AtaRecord {
  id: string
  nome: string
  data: string
  registro: string
  arquivos: string[]
  status: "pendente" | "respondido" | "finalizado" | "arquivado"
  resposta?: string
  tresposta?: string
  dataResposta?: string
  dataTresposta?: string
  createdAt: string
}

export function useSupervision() {
  const [records, setRecords] = useState<AtaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const loadRecords = async () => {
    try {
      setLoading(true)
      console.log("[v0] Carregando atas de supervisão do Supabase...")

      const { data, error } = await supabase
        .from("supervision_records")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Erro ao carregar atas de supervisão:", error)
        setError(error.message)
        return
      }

      const formattedRecords: AtaRecord[] = (data || []).map((item) => ({
        id: item.id,
        nome: item.nome,
        data: item.data,
        registro: item.registro,
        arquivos: item.arquivos || [],
        status: item.status,
        resposta: item.resposta,
        tresposta: item.tresposta,
        dataResposta: item.data_resposta,
        dataTresposta: item.data_tresposta,
        createdAt: item.created_at,
      }))

      setRecords(formattedRecords)
      console.log("[v0] Atas de supervisão carregadas do Supabase:", formattedRecords.length)
    } catch (err) {
      console.error("[v0] Erro ao carregar atas de supervisão:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const addRecord = async (record: Omit<AtaRecord, "id" | "createdAt" | "status">) => {
    try {
      console.log("[v0] Adicionando ata de supervisão ao Supabase...")

      const { data, error } = await supabase
        .from("supervision_records")
        .insert([
          {
            nome: record.nome,
            data: record.data,
            registro: record.registro,
            arquivos: record.arquivos,
            status: "pendente",
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("[v0] Erro ao adicionar ata de supervisão:", error)
        setError(error.message)
        return false
      }

      const newRecord: AtaRecord = {
        id: data.id,
        nome: data.nome,
        data: data.data,
        registro: data.registro,
        arquivos: data.arquivos || [],
        status: data.status,
        resposta: data.resposta,
        tresposta: data.tresposta,
        dataResposta: data.data_resposta,
        dataTresposta: data.data_tresposta,
        createdAt: data.created_at,
      }

      setRecords((prev) => [newRecord, ...prev])
      console.log("[v0] Ata de supervisão adicionada com sucesso")
      return true
    } catch (err) {
      console.error("[v0] Erro ao adicionar ata de supervisão:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return false
    }
  }

  const updateRecord = async (id: string, updates: Partial<AtaRecord>) => {
    try {
      console.log("[v0] Atualizando ata de supervisão no Supabase...")

      const { data, error } = await supabase
        .from("supervision_records")
        .update({
          resposta: updates.resposta,
          tresposta: updates.tresposta,
          data_resposta: updates.dataResposta,
          data_tresposta: updates.dataTresposta,
          status: updates.status,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("[v0] Erro ao atualizar ata de supervisão:", error)
        setError(error.message)
        return false
      }

      const updatedRecord: AtaRecord = {
        id: data.id,
        nome: data.nome,
        data: data.data,
        registro: data.registro,
        arquivos: data.arquivos || [],
        status: data.status,
        resposta: data.resposta,
        tresposta: data.tresposta,
        dataResposta: data.data_resposta,
        dataTresposta: data.data_tresposta,
        createdAt: data.created_at,
      }

      setRecords((prev) => prev.map((record) => (record.id === id ? updatedRecord : record)))
      console.log("[v0] Ata de supervisão atualizada com sucesso")
      return true
    } catch (err) {
      console.error("[v0] Erro ao atualizar ata de supervisão:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return false
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      console.log("[v0] Excluindo ata de supervisão do Supabase...")

      const { error } = await supabase.from("supervision_records").delete().eq("id", id)

      if (error) {
        console.error("[v0] Erro ao excluir ata de supervisão:", error)
        setError(error.message)
        return false
      }

      setRecords((prev) => prev.filter((record) => record.id !== id))
      console.log("[v0] Ata de supervisão excluída com sucesso")
      return true
    } catch (err) {
      console.error("[v0] Erro ao excluir ata de supervisão:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return false
    }
  }

  useEffect(() => {
    loadRecords()

    const channel = supabase
      .channel("supervision_records_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "supervision_records" }, (payload) => {
        console.log("[v0] Mudança em tempo real nas atas de supervisão:", payload)
        loadRecords()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    refreshRecords: loadRecords,
  }
}
