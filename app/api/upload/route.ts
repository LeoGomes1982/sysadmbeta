import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log("[SERVER] Recebendo requisição de upload")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[SERVER] Nenhum arquivo fornecido")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[SERVER] Iniciando upload do arquivo:", file.name)
    console.log("[SERVER] Tamanho do arquivo:", (file.size / 1024 / 1024).toFixed(2), "MB")

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[SERVER] File uploaded successfully:", blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[SERVER] Upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
