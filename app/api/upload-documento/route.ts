import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folderName = formData.get("folderName") as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    console.log("[SERVER] Iniciando upload:", file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    if (folderName) {
      console.log("[SERVER] Pasta:", folderName)
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[SERVER] Upload concluído:", blob.url)

    return NextResponse.json({
      success: true,
      url: blob.url,
      name: file.name,
      folderName: folderName || undefined,
    })
  } catch (error) {
    console.error("[SERVER] Erro no upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido no upload",
      },
      { status: 500 },
    )
  }
}
