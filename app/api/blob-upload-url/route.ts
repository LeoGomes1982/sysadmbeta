import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: "Nome do arquivo é obrigatório" }, { status: 400 })
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ error: "Token do Blob não configurado" }, { status: 500 })
    }

    // Gera um nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const uniqueFilename = `${timestamp}-${randomString}-${filename}`

    // Gera URL pré-assinada usando a API REST do Vercel Blob
    const uploadUrl = `https://blob.vercel-storage.com/${uniqueFilename}`

    return NextResponse.json({
      uploadUrl,
      token,
      pathname: uniqueFilename,
    })
  } catch (error) {
    console.error("[SERVER] Erro ao gerar URL de upload:", error)
    return NextResponse.json({ error: "Erro ao gerar URL de upload" }, { status: 500 })
  }
}
