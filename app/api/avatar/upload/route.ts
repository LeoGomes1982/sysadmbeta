import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ],
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("[SERVER] Upload completed:", blob.url)
      },
    })

    return Response.json(jsonResponse)
  } catch (error) {
    console.error("[SERVER] Erro no handleUpload:", error)
    return Response.json({ error: (error as Error).message }, { status: 400 })
  }
}
