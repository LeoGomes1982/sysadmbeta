"use server"

import { put } from "@vercel/blob"

export async function uploadToBlob(filename: string, fileData: string) {
  try {
    // Converter base64 para Buffer
    const base64Data = fileData.split(",")[1]
    const buffer = Buffer.from(base64Data, "base64")

    // Fazer upload para Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
    })

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("[v0] Erro ao fazer upload para Vercel Blob:", error)
    return { success: false, error: error.message || "Erro desconhecido" }
  }
}
