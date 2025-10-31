"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, FileText, Download, Send, MessageSquare, CheckCircle, Clock, Plus, X, ZoomIn } from "lucide-react"
import { useSupervision } from "@/hooks/use-supervision"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { generateAtaPDF } from "@/lib/utils/generate-ata-pdf"

const handleDownloadPDF = (record: any) => {
  console.log("[v0] Gerando PDF para ata:", record.id)
  try {
    generateAtaPDF({
      nome: record.nome,
      data: format(new Date(record.data), "dd/MM/yyyy"),
      registro: record.registro,
      resposta: record.resposta,
      dataResposta: record.dataResposta ? format(new Date(record.dataResposta), "dd/MM/yyyy") : undefined,
      tresposta: record.tresposta,
      dataTresposta: record.dataTresposta ? format(new Date(record.dataTresposta), "dd/MM/yyyy") : undefined,
      status: record.status,
      arquivos: record.arquivos || [],
    })
    console.log("[v0] PDF gerado com sucesso")
  } catch (error) {
    console.error("[v0] Erro ao gerar PDF:", error)
    alert("Erro ao gerar PDF. Verifique o console para mais detalhes.")
  }
}

export default function SupervisionPage() {
  const { records, loading, error, addRecord, updateRecord, deleteRecord } = useSupervision()

  const [showNewModal, setShowNewModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    data: "",
    registro: "",
    arquivos: [] as File[],
  })
  const [uploading, setUploading] = useState(false)
  const [resposta, setResposta] = useState("")
  const [tresposta, setTresposta] = useState("")

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      console.log("[v0] Iniciando upload de", formData.arquivos.length, "arquivo(s)")

      for (const file of formData.arquivos) {
        console.log("[v0] Fazendo upload do arquivo:", file.name, "Tipo:", file.type)

        const formDataToUpload = new FormData()
        formDataToUpload.append("file", file)

        const response = await fetch("/api/upload-blob", {
          method: "POST",
          body: formDataToUpload,
        })

        if (!response.ok) {
          throw new Error("Erro ao fazer upload do arquivo")
        }

        const { url } = await response.json()
        console.log("[v0] Arquivo enviado com sucesso. URL:", url)
        uploadedUrls.push(url)
      }

      console.log("[v0] Todas as URLs de upload:", uploadedUrls)

      const success = await addRecord({
        nome: formData.nome,
        data: formData.data,
        registro: formData.registro,
        arquivos: uploadedUrls,
      })

      if (success) {
        setFormData({ nome: "", data: "", registro: "", arquivos: [] })
        setShowNewModal(false)
      }
    } catch (error) {
      console.error("[v0] Erro ao fazer upload dos arquivos:", error)
      alert("Erro ao fazer upload dos arquivos. Tente novamente.")
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, arquivos: Array.from(e.target.files) })
    }
  }

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  }

  const removeFile = (index: number) => {
    const newFiles = formData.arquivos.filter((_, i) => i !== index)
    setFormData({ ...formData, arquivos: newFiles })
  }

  const handleResponder = async () => {
    if (selectedRecord && resposta.trim()) {
      const success = await updateRecord(selectedRecord.id, {
        resposta,
        dataResposta: new Date().toISOString().split("T")[0],
        status: "respondido",
      })

      if (success) {
        setResposta("")
        setShowViewModal(false)
      }
    }
  }

  const handleTresponder = async () => {
    if (selectedRecord && tresposta.trim()) {
      const success = await updateRecord(selectedRecord.id, {
        tresposta,
        dataTresposta: new Date().toISOString().split("T")[0],
        status: "finalizado",
      })

      if (success) {
        setTresposta("")
        setShowViewModal(false)
      }
    }
  }

  const handleEncerrarAta = async (recordId: string) => {
    if (confirm("Tem certeza que deseja encerrar esta ata? Ela será removida da lista.")) {
      await deleteRecord(recordId)
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded"
    switch (status) {
      case "pendente":
        return <span className={`${baseClasses} bg-yellow-500 text-white`}>Pendente</span>
      case "respondido":
        return <span className={`${baseClasses} bg-blue-500 text-white`}>Respondido</span>
      case "finalizado":
        return <span className={`${baseClasses} bg-black text-white`}>Finalizado</span>
      case "arquivado":
        return <span className={`${baseClasses} bg-gray-500 text-white`}>Arquivado</span>
      default:
        return <span className={`${baseClasses} bg-gray-500 text-white`}>{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p>Carregando atas de supervisão...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-red-600">
              <p>Erro ao carregar atas de supervisão: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Ata da Supervisão</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Ata
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nova Ata de Supervisão</DialogTitle>
                    <DialogDescription>Preencha os dados do registro semanal de supervisão</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome do Supervisor</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="data">Data</Label>
                        <Input
                          id="data"
                          type="date"
                          value={formData.data}
                          onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="registro">Registro da Ata</Label>
                      <Textarea
                        id="registro"
                        rows={6}
                        value={formData.registro}
                        onChange={(e) => setFormData({ ...formData, registro: e.target.value })}
                        placeholder="Descreva detalhadamente as atividades, observações e pontos importantes da supervisão..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="arquivos">Arquivos Anexos</Label>
                      <Input
                        id="arquivos"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      {formData.arquivos.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-gray-600">Arquivos selecionados:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {formData.arquivos.map((file, index) => (
                              <div key={index} className="relative group">
                                {file.type.startsWith("image/") ? (
                                  <div className="relative aspect-square rounded border overflow-hidden">
                                    <img
                                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeFile(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-2 border rounded">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-xs truncate flex-1">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(index)} className="text-red-500">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowNewModal(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={uploading}>
                        <Send className="h-4 w-4 mr-2" />
                        {uploading ? "Enviando..." : "Enviar Ata"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atas Cadastradas ({records.filter((r) => r.status !== "arquivado").length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.filter((r) => r.status !== "arquivado").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma ata cadastrada ainda.</p>
                <p className="text-sm">Clique em "Nova Ata" para começar.</p>
              </div>
            ) : (
              records
                .filter((r) => r.status !== "arquivado")
                .map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{record.nome}</h3>
                          {getStatusBadge(record.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(record.data)}
                          </div>
                          {record.arquivos.length > 0 && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {record.arquivos.length} arquivo(s)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record)
                            setShowViewModal(true)
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(record)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        {record.status !== "finalizado" && (
                          <Button variant="outline" size="sm" onClick={() => handleEncerrarAta(record.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Encerrar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ata de Supervisão - {selectedRecord?.nome}</DialogTitle>
            <DialogDescription>{selectedRecord && formatDate(selectedRecord.data)}</DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Registro Original</h3>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white">Etapa 1</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.registro}</p>
                {selectedRecord.arquivos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Arquivos anexos:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedRecord.arquivos.map((arquivo, index) => (
                        <div key={index} className="relative group">
                          {isImageUrl(arquivo) ? (
                            <div
                              className="relative aspect-square rounded border overflow-hidden cursor-pointer hover:opacity-80"
                              onClick={() => setLightboxImage(arquivo)}
                            >
                              <img
                                src={
                                  arquivo.startsWith("http")
                                    ? arquivo
                                    : `/placeholder.svg?height=200&width=200&query=image`
                                }
                                alt={`Anexo ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/erro-carregar-imagem.png"
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : (
                            <a
                              href={arquivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center aspect-square border rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <FileText className="h-8 w-8 text-gray-400" />
                              <span className="text-xs text-gray-600 mt-1 text-center px-1 truncate w-full">
                                Arquivo {index + 1}
                              </span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedRecord.resposta ? (
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Primeira Resposta</h3>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-600 text-white">Etapa 2</span>
                    {selectedRecord.dataResposta && (
                      <span className="text-sm text-gray-500">{formatDate(selectedRecord.dataResposta)}</span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.resposta}</p>
                </div>
              ) : selectedRecord.status === "pendente" ? (
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-800">Aguardando Primeira Resposta</h3>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-600 text-white">Etapa 2</span>
                  </div>
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleResponder} className="mt-3">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Resposta
                  </Button>
                </div>
              ) : null}

              {selectedRecord.tresposta ? (
                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">Segunda Resposta</h3>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-purple-600 text-white">Etapa 3</span>
                    {selectedRecord.dataTresposta && (
                      <span className="text-sm text-gray-500">{formatDate(selectedRecord.dataTresposta)}</span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.tresposta}</p>
                </div>
              ) : selectedRecord.status === "respondido" ? (
                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">Aguardando Segunda Resposta</h3>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-purple-600 text-white">Etapa 3</span>
                  </div>
                  <Textarea
                    placeholder="Digite a resposta final..."
                    value={tresposta}
                    onChange={(e) => setTresposta(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleTresponder} className="mt-3">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Resposta Final
                  </Button>
                </div>
              ) : null}

              {selectedRecord.status === "finalizado" && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Ata Finalizada</h3>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-600 text-white">Concluído</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black">
          <div className="relative">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {lightboxImage && (
              <img
                src={lightboxImage || "/placeholder.svg"}
                alt="Visualização ampliada"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
