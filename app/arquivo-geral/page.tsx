"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import {
  Plus,
  Folder,
  FileText,
  Trash2,
  Download,
  Upload,
  Link,
  ImageIcon,
  AlertTriangle,
  Eye,
  Loader2,
} from "lucide-react"
import { useFolders, useFiles } from "@/hooks/use-realtime"
import { fileOperations } from "@/lib/database/operations"
import { useToast } from "@/hooks/use-toast"
import { generateAtaPDF } from "@/lib/utils/generate-ata-pdf"

interface FileData {
  id: string
  name: string
  folder_id?: string
  file_type: "texto" | "link" | "upload"
  content?: string
  url?: string
  file_size?: string
  original_filename?: string
  created_at: string
}

interface FolderData {
  id: string
  name: string
  is_protected: boolean
  created_at: string
}

export default function DrivePage() {
  const { data: folders, loading: foldersLoading } = useFolders()
  const { data: allFiles, loading: filesLoading } = useFiles()
  const { toast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<"pasta" | "arquivo" | null>(null)
  const [tipoArquivo, setTipoArquivo] = useState<"texto" | "link" | "upload" | null>(null)
  const [nomeItem, setNomeItem] = useState("")
  const [pastaSelecionada, setPastaSelecionada] = useState<string | null>(null)
  const [conteudoTexto, setConteudoTexto] = useState("")
  const [urlLink, setUrlLink] = useState("")
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [itemToDelete, setItemToDelete] = useState<{ type: "file" | "folder"; item: FileData | FolderData } | null>(
    null,
  )
  const [showNonEmptyFolderWarning, setShowNonEmptyFolderWarning] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Separar arquivos soltos dos arquivos em pastas
  const arquivosSoltos = allFiles.filter((file: FileData) => !file.folder_id)

  const abrirModal = () => {
    setShowModal(true)
    setTipoSelecionado(null)
    setTipoArquivo(null)
    setNomeItem("")
    setPastaSelecionada(null)
    setConteudoTexto("")
    setUrlLink("")
    setArquivoUpload(null)
  }

  const criarPasta = async () => {
    if (!nomeItem.trim()) return

    try {
      console.log("[v0] Criando nova pasta:", nomeItem)
      console.log("[v0] Dados da pasta:", {
        name: nomeItem,
        is_protected: false,
      })

      const result = await fileOperations.folders.create({
        name: nomeItem,
        is_protected: false,
      })

      console.log("[v0] Resultado da criação da pasta:", result)
      setShowModal(false)
      setNomeItem("")
      console.log("[v0] Pasta criada com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao criar pasta:", error)
      console.error("[v0] Detalhes do erro:", JSON.stringify(error, null, 2))
      alert(`Erro ao criar pasta: ${error.message || "Erro desconhecido"}`)
    }
  }

  const criarArquivo = async () => {
    if (!nomeItem.trim()) return

    if (tipoArquivo === "texto" && !conteudoTexto.trim()) return
    if (tipoArquivo === "link" && !urlLink.trim()) return
    if (tipoArquivo === "upload" && !arquivoUpload) return

    try {
      setIsUploading(true)
      console.log("[v0] Criando novo arquivo:", nomeItem, tipoArquivo)

      let blobUrl = undefined

      if (tipoArquivo === "upload" && arquivoUpload) {
        console.log("[v0] Fazendo upload do arquivo para Vercel Blob...")

        try {
          const formData = new FormData()
          formData.append("file", arquivoUpload)

          const response = await fetch("/api/upload-blob", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Erro ao fazer upload")
          }

          const result = await response.json()
          blobUrl = result.url
          console.log("[v0] Upload concluído! URL do Blob:", blobUrl)

          toast({
            title: "Upload concluído!",
            description: "Arquivo enviado com sucesso.",
          })
        } catch (uploadError: any) {
          console.error("[v0] Erro ao fazer upload para Vercel Blob:", uploadError)
          toast({
            title: "Erro no upload",
            description: uploadError.message || "Não foi possível fazer upload do arquivo. Tente novamente.",
            variant: "destructive",
          })
          setIsUploading(false)
          return
        }
      }

      const fileData = {
        name: nomeItem,
        folder_id: pastaSelecionada || undefined,
        file_type: tipoArquivo!,
        content: tipoArquivo === "texto" ? conteudoTexto : undefined,
        url: tipoArquivo === "link" ? urlLink : blobUrl,
        file_size: tipoArquivo === "upload" && arquivoUpload ? formatarTamanho(arquivoUpload.size) : undefined,
        original_filename: tipoArquivo === "upload" && arquivoUpload ? arquivoUpload.name : undefined,
      }

      console.log("[v0] Dados do arquivo:", fileData)

      const result = await fileOperations.files.create(fileData)

      console.log("[v0] Resultado da criação do arquivo:", result)
      setShowModal(false)
      setNomeItem("")
      setPastaSelecionada(null)
      setTipoArquivo(null)
      setConteudoTexto("")
      setUrlLink("")
      setArquivoUpload(null)
      setIsUploading(false)

      toast({
        title: "Sucesso!",
        description: "Arquivo criado com sucesso.",
      })

      console.log("[v0] Arquivo criado com sucesso")
    } catch (error: any) {
      console.error("[v0] Erro ao criar arquivo:", error)
      console.error("[v0] Detalhes do erro:", JSON.stringify(error, null, 2))
      setIsUploading(false)

      toast({
        title: "Erro",
        description: `Erro ao criar arquivo: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (type: "file" | "folder", item: FileData | FolderData) => {
    if (type === "folder") {
      const folderFiles = allFiles.filter((file: FileData) => file.folder_id === item.id)
      if (folderFiles.length > 0) {
        setShowNonEmptyFolderWarning(true)
      } else {
        setShowNonEmptyFolderWarning(false)
      }
    } else {
      setShowNonEmptyFolderWarning(false)
    }

    setItemToDelete({ type, item })
    setIsDeleteDialogOpen(true)
    setDeletePassword("")
  }

  const handleDeleteConfirm = async () => {
    if (deletePassword !== "987654321") {
      toast({
        title: "Erro",
        description: "Senha incorreta. Acesso negado.",
        variant: "destructive",
      })
      return
    }

    if (!itemToDelete) return

    try {
      console.log("[v0] Excluindo item:", itemToDelete.type, itemToDelete.item.id)

      if (itemToDelete.type === "folder") {
        // Se for pasta, primeiro excluir todos os arquivos dentro dela
        const folderFiles = allFiles.filter((file: FileData) => file.folder_id === itemToDelete.item.id)
        for (const file of folderFiles) {
          await fileOperations.files.delete(file.id)
        }
        // Depois excluir a pasta
        await fileOperations.folders.delete(itemToDelete.item.id)
      } else {
        // Se for arquivo, excluir diretamente
        await fileOperations.files.delete(itemToDelete.item.id)
      }

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      setDeletePassword("")
      setShowNonEmptyFolderWarning(false)

      toast({
        title: "Sucesso",
        description: `${itemToDelete.type === "folder" ? "Pasta" : "Arquivo"} excluído com sucesso!`,
      })
      console.log("[v0] Item excluído com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao excluir item:", error)
      toast({
        title: "Erro",
        description: `Erro ao excluir ${itemToDelete.type === "folder" ? "pasta" : "arquivo"}. Tente novamente.`,
        variant: "destructive",
      })
    }
  }

  const gerarBackupZip = () => {
    const backupData = {
      folders: folders,
      files: allFiles,
      dataBackup: new Date().toISOString(),
      totalItens: folders.length + allFiles.length,
    }

    const jsonString = JSON.stringify(backupData, null, 2)

    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `backup-drive-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    console.log("[v0] Backup gerado com sucesso")
  }

  const formatarTamanho = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setArquivoUpload(file)
      if (!nomeItem) {
        setNomeItem(file.name)
      }
    }
  }

  const obterIconeArquivo = (arquivo: FileData) => {
    if (arquivo.file_type === "link") {
      return <Link className="w-5 h-5 text-green-600" />
    }
    if (arquivo.file_type === "upload") {
      const extensao = arquivo.name.split(".").pop()?.toLowerCase()
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(extensao || "")) {
        return <ImageIcon className="w-5 h-5 text-purple-600" />
      }
      if (extensao === "pdf") {
        return <FileText className="w-5 h-5 text-red-600" /> // Ícone para PDF
      }
      if (["mp4", "webm", "ogg", "mov"].includes(extensao || "")) {
        return <ImageIcon className="w-5 h-5 text-blue-600" /> // Ícone genérico para vídeo
      }
      return <Upload className="w-5 h-5 text-orange-600" />
    }
    return <FileText className="w-5 h-5 text-blue-600" />
  }

  const abrirLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const baixarArquivo = (arquivo: FileData) => {
    // Se for um arquivo de texto da pasta "Registro das Atas", baixar como PDF
    const pasta = folders.find((f: FolderData) => f.id === arquivo.folder_id)
    if (arquivo.file_type === "texto" && pasta?.name === "Registro das Atas") {
      console.log("[v0] Gerando PDF para ata do Drive:", arquivo.name)

      // Extrair informações da ata do conteúdo
      const content = arquivo.content || ""

      // Extrair dados da ata do conteúdo formatado
      const supervisorMatch = content.match(/Supervisor:\s*(.+)/)
      const dataMatch = content.match(/Data:\s*(.+)/)
      const statusMatch = content.match(/Status:\s*(.+)/)
      const registroMatch = content.match(
        /REGISTRO ORIGINAL:\s*([\s\S]+?)(?=PRIMEIRA RESPOSTA|SEGUNDA RESPOSTA|Arquivos anexos|$)/,
      )
      const respostaMatch = content.match(
        /PRIMEIRA RESPOSTA $$(.+?)$$:\s*([\s\S]+?)(?=SEGUNDA RESPOSTA|Arquivos anexos|$)/,
      )
      const trespostaMatch = content.match(/SEGUNDA RESPOSTA $$(.+?)$$:\s*([\s\S]+?)(?=Arquivos anexos|$)/)

      console.log("[v0] Dados extraídos da ata:", {
        supervisor: supervisorMatch ? supervisorMatch[1].trim() : "Não encontrado",
        data: dataMatch ? dataMatch[1].trim() : "Não encontrado",
        status: statusMatch ? statusMatch[1].trim() : "Não encontrado",
        temRegistro: !!registroMatch,
        temResposta: !!respostaMatch,
        temTresposta: !!trespostaMatch,
      })

      try {
        generateAtaPDF({
          nome: supervisorMatch ? supervisorMatch[1].trim() : "Supervisor",
          data: dataMatch ? dataMatch[1].trim() : "",
          registro: registroMatch ? registroMatch[1].trim() : "",
          resposta: respostaMatch ? respostaMatch[2].trim() : undefined,
          dataResposta: respostaMatch ? respostaMatch[1].trim() : undefined,
          tresposta: trespostaMatch ? trespostaMatch[2].trim() : undefined,
          dataTresposta: trespostaMatch ? trespostaMatch[1].trim() : undefined,
          status: statusMatch ? statusMatch[1].trim() : "arquivado",
          arquivos: [],
        })
        console.log("[v0] PDF da ata gerado com sucesso")
      } catch (error) {
        console.error("[v0] Erro ao gerar PDF da ata:", error)
        alert("Erro ao gerar PDF. Verifique o console para mais detalhes.")
      }
      return
    }

    // Para outros tipos de arquivo, usar o download normal
    if (arquivo.url) {
      const link = document.createElement("a")
      link.href = arquivo.url
      link.download = arquivo.original_filename || arquivo.name
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const visualizarArquivo = (arquivo: FileData) => {
    if (arquivo.url) {
      // Se for documento do Office, usar Google Docs Viewer
      if (isDocumentoOffice(arquivo)) {
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(arquivo.url)}&embedded=true`
        window.open(viewerUrl, "_blank", "noopener,noreferrer")
      } else {
        // Para outros tipos (imagens, PDFs, vídeos), abrir diretamente
        window.open(arquivo.url, "_blank", "noopener,noreferrer")
      }
    }
  }

  const isImagem = (arquivo: FileData): boolean => {
    const extensao = arquivo.name.split(".").pop()?.toLowerCase()
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extensao || "")
  }

  const isPDF = (arquivo: FileData): boolean => {
    const extensao = arquivo.name.split(".").pop()?.toLowerCase()
    return extensao === "pdf"
  }

  const isVideo = (arquivo: FileData): boolean => {
    const extensao = arquivo.name.split(".").pop()?.toLowerCase()
    return ["mp4", "webm", "ogg", "mov"].includes(extensao || "")
  }

  const isDocumentoOffice = (arquivo: FileData): boolean => {
    const extensao = arquivo.name.split(".").pop()?.toLowerCase()
    return ["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(extensao || "")
  }

  const podeVisualizar = (arquivo: FileData): boolean => {
    return isImagem(arquivo) || isPDF(arquivo) || isVideo(arquivo) || isDocumentoOffice(arquivo)
  }

  const totalDocumentos = folders.length + allFiles.length

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  if (foldersLoading || filesLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Carregando arquivos...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">Drive</CardTitle>
          </div>
          <div className="flex gap-2">
            {totalDocumentos >= 200 && (
              <Button
                variant="outline"
                className="flex items-center gap-2 text-orange-600 border-orange-300 bg-transparent"
                onClick={gerarBackupZip}
              >
                <Download className="w-4 h-4" />
                Fazer Backup
              </Button>
            )}
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white" onClick={abrirModal}>
                  <Plus className="w-4 h-4" />
                  Novo arquivo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!tipoSelecionado ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">O que você deseja criar?</p>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          className="flex-1 h-20 flex-col gap-2 bg-transparent"
                          onClick={() => setTipoSelecionado("pasta")}
                        >
                          <Folder className="w-8 h-8" />
                          Pasta
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 h-20 flex-col gap-2 bg-transparent"
                          onClick={() => setTipoSelecionado("arquivo")}
                        >
                          <FileText className="w-8 h-8" />
                          Arquivo
                        </Button>
                      </div>
                    </div>
                  ) : tipoSelecionado === "arquivo" && !tipoArquivo ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Que tipo de arquivo você quer adicionar?</p>
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          variant="outline"
                          className="h-16 flex items-center gap-3 justify-start bg-transparent"
                          onClick={() => setTipoArquivo("texto")}
                        >
                          <FileText className="w-6 h-6 text-blue-600" />
                          <div className="text-left">
                            <div className="font-medium">Documento de Texto</div>
                            <div className="text-xs text-muted-foreground">Criar um documento com texto</div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-16 flex items-center gap-3 justify-start bg-transparent"
                          onClick={() => setTipoArquivo("link")}
                        >
                          <Link className="w-6 h-6 text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">Link/URL</div>
                            <div className="text-xs text-muted-foreground">Salvar um link importante</div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-16 flex items-center gap-3 justify-start bg-transparent"
                          onClick={() => setTipoArquivo("upload")}
                        >
                          <Upload className="w-6 h-6 text-orange-600" />
                          <div className="text-left">
                            <div className="font-medium">Upload de Arquivo</div>
                            <div className="text-xs text-muted-foreground">PDF, imagem ou outro arquivo</div>
                          </div>
                        </Button>
                      </div>
                      <Button variant="outline" onClick={() => setTipoSelecionado(null)}>
                        Voltar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nomeItem">Nome {tipoSelecionado === "pasta" ? "da Pasta" : "do Arquivo"}</Label>
                        <Input
                          id="nomeItem"
                          value={nomeItem}
                          onChange={(e) => setNomeItem(e.target.value)}
                          placeholder={`Digite o nome ${tipoSelecionado === "pasta" ? "da pasta" : "do arquivo"}`}
                        />
                      </div>

                      {tipoArquivo === "texto" && (
                        <div className="space-y-2">
                          <Label htmlFor="conteudo">Conteúdo do Documento</Label>
                          <Textarea
                            id="conteudo"
                            value={conteudoTexto}
                            onChange={(e) => setConteudoTexto(e.target.value)}
                            placeholder="Digite o conteúdo do documento..."
                            rows={4}
                          />
                        </div>
                      )}

                      {tipoArquivo === "link" && (
                        <div className="space-y-2">
                          <Label htmlFor="url">URL do Link</Label>
                          <Input
                            id="url"
                            type="url"
                            value={urlLink}
                            onChange={(e) => setUrlLink(e.target.value)}
                            placeholder="https://exemplo.com"
                          />
                        </div>
                      )}

                      {tipoArquivo === "upload" && (
                        <div className="space-y-2">
                          <Label htmlFor="arquivo">Selecionar Arquivo</Label>
                          <Input
                            id="arquivo"
                            type="file"
                            onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.zip,.rar"
                          />
                          {arquivoUpload && (
                            <div className="text-sm text-muted-foreground">
                              Arquivo selecionado: {arquivoUpload.name} ({formatarTamanho(arquivoUpload.size)})
                            </div>
                          )}
                        </div>
                      )}

                      {tipoSelecionado === "arquivo" && (
                        <div className="space-y-2">
                          <Label>Salvar em:</Label>
                          <Select
                            value={pastaSelecionada || "solto"}
                            onValueChange={(value) => setPastaSelecionada(value === "solto" ? null : value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione onde salvar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solto">Espaço livre (sem pasta)</SelectItem>
                              {folders.map((pasta: FolderData) => (
                                <SelectItem key={pasta.id} value={pasta.id}>
                                  {pasta.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={tipoSelecionado === "pasta" ? criarPasta : criarArquivo}
                          disabled={
                            isUploading ||
                            !nomeItem.trim() ||
                            (tipoArquivo === "texto" && !conteudoTexto.trim()) ||
                            (tipoArquivo === "link" && !urlLink.trim()) ||
                            (tipoArquivo === "upload" && !arquivoUpload)
                          }
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>Criar {tipoSelecionado === "pasta" ? "Pasta" : "Arquivo"}</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={isUploading}
                          onClick={() => {
                            if (tipoSelecionado === "arquivo" && tipoArquivo) {
                              setTipoArquivo(null)
                            } else {
                              setTipoSelecionado(null)
                            }
                          }}
                        >
                          Voltar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {totalDocumentos >= 200 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Download className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-orange-800">Backup Recomendado</h3>
                <p className="text-sm text-orange-700">
                  Você tem {totalDocumentos} documentos. É recomendado fazer backup em HD externo.
                </p>
              </div>
              <Button onClick={gerarBackupZip} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Fazer Backup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Arquivos e Pastas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {arquivosSoltos.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Arquivos</h3>
                <div className="space-y-1">
                  {arquivosSoltos.map((arquivo: FileData) => (
                    <div
                      key={arquivo.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {obterIconeArquivo(arquivo)}
                        {arquivo.file_type === "link" && arquivo.url ? (
                          <button
                            onClick={() => abrirLink(arquivo.url!)}
                            className="font-medium text-sm truncate text-green-600 hover:text-green-700 hover:underline cursor-pointer text-left"
                            title={`Abrir link: ${arquivo.url}`}
                          >
                            {arquivo.name}
                          </button>
                        ) : (
                          <span className="font-medium text-sm truncate">{arquivo.name}</span>
                        )}
                        {arquivo.file_size && (
                          <span className="text-xs text-muted-foreground">({arquivo.file_size})</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{formatDate(arquivo.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {arquivo.file_type === "upload" && arquivo.url && (
                          <>
                            {podeVisualizar(arquivo) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => visualizarArquivo(arquivo)}
                                className="text-blue-600 hover:text-blue-700 p-1 h-6 w-6"
                                title="Visualizar"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => baixarArquivo(arquivo)}
                              className="text-green-600 hover:text-green-700 p-1 h-6 w-6"
                              title="Baixar"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {arquivo.file_type === "texto" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const blob = new Blob([arquivo.content || ""], { type: "text/plain" })
                              const url = URL.createObjectURL(blob)
                              const link = document.createElement("a")
                              link.href = url
                              link.download = `${arquivo.name}.txt`
                              link.click()
                              URL.revokeObjectURL(url)
                            }}
                            className="text-green-600 hover:text-green-700 p-1 h-6 w-6"
                            title="Baixar"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog("file", arquivo)}
                          className="text-red-600 hover:text-red-700 ml-2 p-1 h-6 w-6"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {folders.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Pastas</h3>
                <div className="space-y-3">
                  {folders.map((pasta: FolderData) => {
                    const arquivosDaPasta = allFiles.filter((file: FileData) => file.folder_id === pasta.id)
                    const isExpanded = expandedFolders.has(pasta.id)

                    return (
                      <div key={pasta.id} className="border rounded-lg">
                        <button
                          onClick={() => toggleFolder(pasta.id)}
                          className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Folder className={`w-4 h-4 ${isExpanded ? "text-yellow-600" : "text-yellow-500"}`} />
                            <span className="font-medium text-sm truncate">{pasta.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({arquivosDaPasta.length} documento{arquivosDaPasta.length !== 1 ? "s" : ""})
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDate(pasta.created_at)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteDialog("folder", pasta)
                            }}
                            className="text-red-600 hover:text-red-700 ml-2 p-1 h-6 w-6"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </button>

                        {isExpanded && arquivosDaPasta.length > 0 && (
                          <div className="p-2 space-y-1">
                            {arquivosDaPasta.map((arquivo: FileData) => (
                              <div
                                key={arquivo.id}
                                className="flex items-center justify-between p-1 hover:bg-gray-50 rounded transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0 ml-4">
                                  {obterIconeArquivo(arquivo)}
                                  {arquivo.file_type === "link" && arquivo.url ? (
                                    <button
                                      onClick={() => abrirLink(arquivo.url!)}
                                      className="text-sm truncate text-green-600 hover:text-green-700 hover:underline cursor-pointer text-left"
                                      title={`Abrir link: ${arquivo.url}`}
                                    >
                                      {arquivo.name}
                                    </button>
                                  ) : arquivo.file_type === "texto" ? (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <button className="text-sm truncate text-blue-600 hover:text-blue-700 hover:underline cursor-pointer text-left">
                                          {arquivo.name}
                                        </button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>{arquivo.name}</DialogTitle>
                                          <DialogDescription>{formatDate(arquivo.created_at)}</DialogDescription>
                                        </DialogHeader>
                                        <div className="whitespace-pre-wrap p-4 bg-gray-50 rounded-lg">
                                          {arquivo.content}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ) : (
                                    <span className="text-sm truncate">{arquivo.name}</span>
                                  )}
                                  {arquivo.file_size && (
                                    <span className="text-xs text-muted-foreground">({arquivo.file_size})</span>
                                  )}
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {formatDate(arquivo.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  {arquivo.file_type === "upload" && arquivo.url && (
                                    <>
                                      {podeVisualizar(arquivo) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => visualizarArquivo(arquivo)}
                                          className="text-blue-600 hover:text-blue-700 p-1 h-6 w-6"
                                          title="Visualizar"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => baixarArquivo(arquivo)}
                                        className="text-green-600 hover:text-green-700 p-1 h-6 w-6"
                                        title="Baixar"
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </>
                                  )}
                                  {arquivo.file_type === "texto" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const blob = new Blob([arquivo.content || ""], { type: "text/plain" })
                                        const url = URL.createObjectURL(blob)
                                        const link = document.createElement("a")
                                        link.href = url
                                        link.download = `${arquivo.name}.txt`
                                        link.click()
                                        URL.revokeObjectURL(url)
                                      }}
                                      className="text-green-600 hover:text-green-700 p-1 h-6 w-6"
                                      title="Baixar"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog("file", arquivo)}
                                    className="text-red-600 hover:text-red-700 p-1 h-6 w-6"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {folders.length === 0 && arquivosSoltos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum arquivo ou pasta criado ainda</p>
                <p className="text-sm mt-1">Use o botão "Novo arquivo" para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              {showNonEmptyFolderWarning
                ? "Esta pasta contém arquivos. Todos os arquivos dentro dela também serão excluídos. Digite a senha de segurança para confirmar."
                : "Para excluir este item, digite a senha de segurança."}
            </DialogDescription>
          </DialogHeader>
          {itemToDelete && (
            <div className="py-4">
              {showNonEmptyFolderWarning && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Atenção: Pasta não está vazia!</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esta pasta contém{" "}
                    {allFiles.filter((file: FileData) => file.folder_id === itemToDelete.item.id).length} arquivo(s).
                    Todos os arquivos serão excluídos junto com a pasta.
                  </p>
                </div>
              )}

              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  {itemToDelete.type === "folder" ? (
                    <Folder className="w-4 h-4 text-yellow-600" />
                  ) : (
                    obterIconeArquivo(itemToDelete.item as FileData)
                  )}
                  <span className="font-medium">{itemToDelete.item.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tipo: {itemToDelete.type === "folder" ? "Pasta" : "Arquivo"} | Criado em:{" "}
                  {formatDate(itemToDelete.item.created_at)}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="delete-password">Senha de Segurança</Label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Digite a senha"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setItemToDelete(null)
                setDeletePassword("")
                setShowNonEmptyFolderWarning(false)
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={!deletePassword}>
              Excluir {itemToDelete?.type === "folder" ? "Pasta" : "Arquivo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
