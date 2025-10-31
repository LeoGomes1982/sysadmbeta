import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "documents"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const sanitizedFilename = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore

    console.log("[v0] Original filename:", file.name)
    console.log("[v0] Sanitized filename:", sanitizedFilename)

    // Upload to Vercel Blob with folder structure
    const blob = await put(`${folder}/${sanitizedFilename}`, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] File uploaded successfully:", blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
