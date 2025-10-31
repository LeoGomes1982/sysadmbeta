"use server"

import { put } from "@vercel/blob"
import { adicionarDocumento } from "@/lib/supabase/processo-documentos"

export async function uploadDocumento(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const folderName = formData.get("folderName") as string | null
    const processoId = formData.get("processoId") as string | null

    if (!file) {
      console.error("[SERVER ACTION] Nenhum arquivo enviado")
      return { success: false, error: "Nenhum arquivo enviado" }
    }

    if (!processoId) {
      console.error("[SERVER ACTION] ID do processo não fornecido")
      return { success: false, error: "ID do processo é obrigatório" }
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[SERVER ACTION] BLOB_READ_WRITE_TOKEN não configurado")
      return { success: false, error: "Armazenamento Blob não está configurado. Verifique as variáveis de ambiente." }
    }

    console.log("[SERVER ACTION] Iniciando upload:", file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    if (folderName) {
      console.log("[SERVER ACTION] Pasta:", folderName)
    }

    const maxSize = 4.5 * 1024 * 1024 // 4.5 MB
    if (file.size > maxSize) {
      console.error("[SERVER ACTION] Arquivo muito grande:", file.size, "bytes")
      return {
        success: false,
        error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo: 4.5 MB no ambiente de desenvolvimento.`,
      }
    }

    if (file.size === 0) {
      console.error("[SERVER ACTION] Arquivo vazio")
      return { success: false, error: "Arquivo vazio (0 bytes)" }
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[SERVER ACTION] Upload para Blob concluído:", blob.url)

    try {
      const documento = await adicionarDocumento({
        processo_id: processoId,
        nome: file.name,
        url: blob.url,
        pasta: folderName || undefined,
        tamanho: file.size,
        tipo: file.type || "application/octet-stream",
      })

      console.log("[SERVER ACTION] Documento salvo no Supabase:", documento.id)

      return {
        success: true,
        url: blob.url,
        name: file.name,
        folderName: folderName || undefined,
        documentoId: documento.id,
      }
    } catch (dbError) {
      console.error("[SERVER ACTION] Erro ao salvar no Supabase:", dbError)
      // Arquivo foi enviado para Blob, mas falhou ao salvar no banco
      return {
        success: false,
        error: "Arquivo enviado, mas falhou ao registrar no banco de dados. Tente novamente.",
      }
    }
  } catch (error) {
    console.error("[SERVER ACTION] Erro no upload:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no upload"
    console.error("[SERVER ACTION] Detalhes do erro:", errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}
