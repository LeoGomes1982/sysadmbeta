"use server"

import { createClient } from "@/lib/supabase/server"

export interface ProcessoDocumento {
  id: string
  processo_id: string
  nome: string
  url: string
  pasta?: string
  tamanho: number
  tipo: string
  created_at: string
  created_by?: string
}

export async function adicionarDocumento(documento: Omit<ProcessoDocumento, "id" | "created_at">) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("processo_documentos").insert(documento).select().single()

  if (error) {
    if (error.message.includes("Could not find the table")) {
      throw new Error(
        "Tabela 'processo_documentos' não existe. Execute o script SQL 'scripts/create-processo-documentos-table.sql' para criar a tabela.",
      )
    }
    console.error("[v0] Erro ao adicionar documento:", error)
    throw new Error(`Erro ao adicionar documento: ${error.message}`)
  }

  return data
}

export async function listarDocumentos(processoId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("processo_documentos")
    .select("*")
    .eq("processo_id", processoId)
    .order("created_at", { ascending: false })

  if (error) {
    if (error.message.includes("Could not find the table")) {
      console.log("[v0] Tabela processo_documentos não existe ainda")
      return [] // Retorna array vazio em vez de erro
    }
    console.error("[v0] Erro ao listar documentos:", error)
    throw new Error(`Erro ao listar documentos: ${error.message}`)
  }

  return data as ProcessoDocumento[]
}

export async function removerDocumento(documentoId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("processo_documentos").delete().eq("id", documentoId)

  if (error) {
    console.error("[v0] Erro ao remover documento:", error)
    throw new Error(`Erro ao remover documento: ${error.message}`)
  }
}

export async function removerDocumentosPorPasta(processoId: string, pasta: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("processo_documentos").delete().eq("processo_id", processoId).eq("pasta", pasta)

  if (error) {
    console.error("[v0] Erro ao remover documentos da pasta:", error)
    throw new Error(`Erro ao remover documentos da pasta: ${error.message}`)
  }
}
