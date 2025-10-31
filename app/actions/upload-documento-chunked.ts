"use server"

import { put } from "@vercel/blob"
import { adicionarDocumento } from "@/lib/supabase/processo-documentos"

const chunksStorage = new Map<
  string,
  {
    chunks: Uint8Array[]
    metadata: any
    lastUpdate: number
  }
>()

// Limpar chunks antigos (mais de 10 minutos)
setInterval(() => {
  const now = Date.now()
  const tenMinutes = 10 * 60 * 1000

  for (const [fileId, storage] of chunksStorage.entries()) {
    if (now - storage.lastUpdate > tenMinutes) {
      console.log(`[SERVER ACTION] Limpando chunks antigos do arquivo ${fileId}`)
      chunksStorage.delete(fileId)
    }
  }
}, 60 * 1000)

export async function uploadChunk(formData: FormData) {
  try {
    console.log("[SERVER ACTION] === INÍCIO DO UPLOAD DE CHUNK ===")

    const chunk = formData.get("chunk")
    const chunkIndex = formData.get("chunkIndex")
    const totalChunks = formData.get("totalChunks")
    const fileId = formData.get("fileId")
    const fileName = formData.get("fileName")
    const fileType = formData.get("fileType")
    const processoId = formData.get("processoId")
    const folderName = formData.get("folderName")

    // Validar que todos os campos obrigatórios existem
    if (!chunk || !chunkIndex || !totalChunks || !fileId || !fileName || !processoId) {
      console.error("[SERVER ACTION] Dados do chunk incompletos")
      return { success: false, error: "Dados do chunk incompletos" }
    }

    // Validar que chunk é um File ou Blob
    if (!(chunk instanceof File) && !(chunk instanceof Blob)) {
      console.error("[SERVER ACTION] Chunk não é um File ou Blob:", typeof chunk)
      return { success: false, error: "Formato de chunk inválido" }
    }

    const chunkIndexNum = Number.parseInt(chunkIndex as string)
    const totalChunksNum = Number.parseInt(totalChunks as string)
    const fileNameStr = fileName as string
    const fileTypeStr = (fileType as string) || "application/octet-stream"
    const processoIdStr = processoId as string
    const folderNameStr = folderName ? (folderName as string) : null
    const fileIdStr = fileId as string

    console.log(`[SERVER ACTION] Recebendo chunk ${chunkIndexNum + 1}/${totalChunksNum} do arquivo ${fileNameStr}`)
    console.log(`[SERVER ACTION] Tamanho do chunk: ${(chunk.size / 1024 / 1024).toFixed(2)} MB`)

    // Validar tamanho do chunk (máximo 4.5 MB)
    if (chunk.size > 4.5 * 1024 * 1024) {
      console.error("[SERVER ACTION] Chunk muito grande:", chunk.size)
      return { success: false, error: "Chunk muito grande. Máximo 4.5 MB por chunk." }
    }

    let arrayBuffer: ArrayBuffer
    try {
      arrayBuffer = await chunk.arrayBuffer()

      if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
        throw new Error("arrayBuffer inválido")
      }

      console.log("[SERVER ACTION] ArrayBuffer criado. Tamanho:", arrayBuffer.byteLength, "bytes")
    } catch (error) {
      console.error("[SERVER ACTION] Erro ao converter chunk para arrayBuffer:", error)
      return {
        success: false,
        error: `Erro ao processar dados do arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      }
    }

    let uint8Array: Uint8Array
    try {
      uint8Array = new Uint8Array(arrayBuffer)
      console.log("[SERVER ACTION] Uint8Array criado. Tamanho:", uint8Array.length, "bytes")
    } catch (error) {
      console.error("[SERVER ACTION] Erro ao criar Uint8Array:", error)
      return {
        success: false,
        error: `Erro ao processar array de bytes: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      }
    }

    // Armazenar chunk
    if (!chunksStorage.has(fileIdStr)) {
      console.log(`[SERVER ACTION] Criando novo armazenamento para arquivo ${fileIdStr}`)
      // Criar array vazio e preencher com null explicitamente
      const chunksArray = new Array(totalChunksNum).fill(null)
      chunksStorage.set(fileIdStr, {
        chunks: chunksArray,
        metadata: {
          fileName: fileNameStr,
          fileType: fileTypeStr,
          processoId: processoIdStr,
          folderName: folderNameStr,
          totalChunks: totalChunksNum,
        },
        lastUpdate: Date.now(),
      })
    }

    const storage = chunksStorage.get(fileIdStr)!

    // Validar que o índice está dentro do range esperado
    if (chunkIndexNum < 0 || chunkIndexNum >= totalChunksNum) {
      console.error(`[SERVER ACTION] Índice de chunk inválido: ${chunkIndexNum} (total: ${totalChunksNum})`)
      return { success: false, error: `Índice de chunk inválido: ${chunkIndexNum}` }
    }

    // Verificar se o chunk já foi recebido
    if (storage.chunks[chunkIndexNum] !== null) {
      console.warn(`[SERVER ACTION] Chunk ${chunkIndexNum} já foi recebido anteriormente. Substituindo...`)
    }

    storage.chunks[chunkIndexNum] = uint8Array
    storage.lastUpdate = Date.now()

    console.log(`[SERVER ACTION] Chunk ${chunkIndexNum + 1}/${totalChunksNum} armazenado com sucesso`)

    // Log do estado atual dos chunks
    const chunksRecebidos = storage.chunks.filter((c) => c !== null).length
    console.log(`[SERVER ACTION] Chunks recebidos até agora: ${chunksRecebidos}/${totalChunksNum}`)

    // Listar quais chunks estão faltando
    const chunksFaltando = []
    for (let i = 0; i < storage.chunks.length; i++) {
      if (storage.chunks[i] === null) {
        chunksFaltando.push(i)
      }
    }
    if (chunksFaltando.length > 0) {
      console.log(`[SERVER ACTION] Chunks faltando: [${chunksFaltando.join(", ")}]`)
    }

    // Verificar se todos os chunks foram recebidos
    const allChunksReceived = storage.chunks.every((c) => c !== null)

    if (allChunksReceived) {
      console.log(`[SERVER ACTION] ✓ Todos os chunks recebidos! Montando arquivo completo...`)

      try {
        // Validar chunks antes de concatenar
        console.log("[SERVER ACTION] Validando chunks...")
        for (let i = 0; i < storage.chunks.length; i++) {
          if (!storage.chunks[i]) {
            console.error(`[SERVER ACTION] ERRO: Chunk ${i} está ${storage.chunks[i] === null ? "null" : "undefined"}`)
            throw new Error(`Chunk ${i} está ${storage.chunks[i] === null ? "null" : "undefined"}`)
          }
          console.log(`[SERVER ACTION] Chunk ${i}: OK (${storage.chunks[i].length} bytes)`)
        }

        const totalLength = storage.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        console.log("[SERVER ACTION] Tamanho total calculado:", totalLength, "bytes")

        const completeFile = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of storage.chunks) {
          completeFile.set(chunk, offset)
          offset += chunk.length
        }

        console.log(`[SERVER ACTION] Arquivo completo montado: ${(completeFile.length / 1024 / 1024).toFixed(2)} MB`)

        // Limpar armazenamento temporário
        chunksStorage.delete(fileIdStr)

        const fileBlob = new Blob([completeFile], { type: fileTypeStr })
        console.log("[SERVER ACTION] Blob criado. Tamanho:", fileBlob.size, "bytes")

        // Upload para Blob
        console.log("[SERVER ACTION] Iniciando upload para Vercel Blob...")
        const blob = await put(fileNameStr, fileBlob, {
          access: "public",
          addRandomSuffix: true,
        })

        console.log("[SERVER ACTION] Upload para Blob concluído:", blob.url)

        // Salvar no Supabase
        try {
          console.log("[SERVER ACTION] Salvando documento no Supabase...")
          const documento = await adicionarDocumento({
            processo_id: processoIdStr,
            nome: fileNameStr,
            url: blob.url,
            pasta: folderNameStr || undefined,
            tamanho: completeFile.length,
            tipo: fileTypeStr,
          })

          console.log("[SERVER ACTION] Documento salvo no Supabase:", documento.id)

          return {
            success: true,
            complete: true,
            url: blob.url,
            name: fileNameStr,
            folderName: folderNameStr || undefined,
            documentoId: documento.id,
          }
        } catch (dbError) {
          console.error("[SERVER ACTION] Erro ao salvar no Supabase:", dbError)
          return {
            success: false,
            error: `Arquivo enviado para o Blob, mas falhou ao registrar no banco de dados: ${dbError instanceof Error ? dbError.message : "Erro desconhecido"}`,
          }
        }
      } catch (uploadError) {
        console.error("[SERVER ACTION] Erro ao fazer upload do arquivo completo:", uploadError)
        chunksStorage.delete(fileIdStr)
        return {
          success: false,
          error: `Erro ao fazer upload do arquivo completo: ${uploadError instanceof Error ? uploadError.message : "Erro desconhecido"}`,
        }
      }
    }

    // Chunk recebido, mas ainda faltam outros
    const progress = ((chunkIndexNum + 1) / totalChunksNum) * 100
    console.log(`[SERVER ACTION] Progresso: ${progress.toFixed(1)}%`)

    return {
      success: true,
      complete: false,
      progress,
    }
  } catch (error) {
    console.error("[SERVER ACTION] Erro no upload do chunk:", error)
    console.error("[SERVER ACTION] Stack trace:", error instanceof Error ? error.stack : "N/A")
    return {
      success: false,
      error: `Erro no upload do chunk: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}
