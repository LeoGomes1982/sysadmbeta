import { createClient } from "@/lib/supabase/client"

export interface ClientDocument {
  id: string
  client_supplier_id: string
  name: string
  type: string
  file_name?: string
  file_size?: string
  created_at: string
}

export interface ClientHistory {
  id: string
  client_supplier_id: string
  type: "positivo" | "negativo" | "neutro"
  description: string
  date: string
  created_at: string
}

export const clientDocumentOperations = {
  async getByClientId(clientId: string): Promise<ClientDocument[]> {
    const supabase = createClient()

    console.log("[v0] Buscando documentos do cliente:", clientId)

    const { data, error } = await supabase
      .from("client_documents")
      .select("id, client_supplier_id, name, type, file_name, file_size, created_at")
      .eq("client_supplier_id", clientId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar documentos:", error)
      throw error
    }

    console.log("[v0] Documentos encontrados:", data?.length || 0)
    return data || []
  },

  async create(document: Omit<ClientDocument, "id" | "created_at">, file?: File): Promise<ClientDocument> {
    const supabase = createClient()

    console.log("[v0] Criando documento:", document.name)

    let fileData = null
    if (file) {
      // Converter arquivo para base64 para armazenar no banco
      const arrayBuffer = await file.arrayBuffer()
      fileData = Array.from(new Uint8Array(arrayBuffer))
    }

    const { data, error } = await supabase
      .from("client_documents")
      .insert([
        {
          ...document,
          file_data: fileData,
        },
      ])
      .select("id, client_supplier_id, name, type, file_name, file_size, created_at")
      .single()

    if (error) {
      console.error("[v0] Erro ao criar documento:", error)
      throw error
    }

    console.log("[v0] Documento criado com sucesso:", data.id)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()

    console.log("[v0] Deletando documento:", id)

    const { error } = await supabase.from("client_documents").delete().eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar documento:", error)
      throw error
    }

    console.log("[v0] Documento deletado com sucesso")
  },
}

export const clientHistoryOperations = {
  async getByClientId(clientId: string): Promise<ClientHistory[]> {
    const supabase = createClient()

    console.log("[v0] Buscando histórico do cliente:", clientId)

    const { data, error } = await supabase
      .from("client_history")
      .select("*")
      .eq("client_supplier_id", clientId)
      .order("date", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar histórico:", error)
      throw error
    }

    console.log("[v0] Registros de histórico encontrados:", data?.length || 0)
    return data || []
  },

  async create(history: Omit<ClientHistory, "id" | "created_at">): Promise<ClientHistory> {
    const supabase = createClient()

    console.log("[v0] Criando registro de histórico:", history.description)

    const { data, error } = await supabase.from("client_history").insert([history]).select().single()

    if (error) {
      console.error("[v0] Erro ao criar histórico:", error)
      throw error
    }

    console.log("[v0] Histórico criado com sucesso:", data.id)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()

    console.log("[v0] Deletando registro de histórico:", id)

    const { error } = await supabase.from("client_history").delete().eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar histórico:", error)
      throw error
    }

    console.log("[v0] Histórico deletado com sucesso")
  },
}
