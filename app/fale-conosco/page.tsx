"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MessageSquare,
  Plus,
  Upload,
  FileText,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  QrCode,
} from "lucide-react"
import { declaracaoOperations } from "@/lib/database/operations"
import { toast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { put } from "@vercel/blob"
import type { JSX } from "react/jsx-runtime"
import { QRCodeSVG } from "qrcode.react"

interface Declaracao {
  id: string
  tipo: "sugestao" | "elogio" | "reclamacao" | "denuncia"
  data: string
  eh_colaborador: boolean
  quer_contato: boolean
  eh_anonimo: boolean
  nome?: string
  email?: string
  telefone?: string
  mensagem: string
  status: "pendente" | "em_analise" | "resolvido"
  resposta?: string
  created_at: string
  status_investigacao_iniciada?: boolean
  status_coleta_dados?: boolean
  status_resolucao?: boolean
  status_encerrada?: boolean
  resumo_caso?: string
  documentos?: Array<{ nome: string; url: string; tamanho: string }>
  encerrado?: boolean
  data_encerramento?: string
}

export default function FaleConoscoPage() {
  const [declaracoes, setDeclaracoes] = useState<Declaracao[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovaDeclaracaoDialog, setShowNovaDeclaracaoDialog] = useState(false)
  const [showDetalhesDialog, setShowDetalhesDialog] = useState(false)
  const [declaracaoSelecionada, setDeclaracaoSelecionada] = useState<Declaracao | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [etapaAtual, setEtapaAtual] = useState(1)
  const [novaDeclaracao, setNovaDeclaracao] = useState({
    tipo: "" as "sugestao" | "elogio" | "reclamacao" | "denuncia" | "",
    data: new Date().toISOString().split("T")[0],
    eh_colaborador: false,
    quer_contato: false,
    eh_anonimo: false,
    nome: "",
    email: "",
    telefone: "",
    mensagem: "",
  })
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  useEffect(() => {
    carregarDeclaracoes()

    // Subscrever a mudanças em tempo real
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const channel = supabase
      .channel("declaracoes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "declaracoes",
        },
        () => {
          console.log("[v0] Mudança detectada nas declarações, recarregando...")
          carregarDeclaracoes()
        },
      )
      .subscribe()

    if (typeof window !== "undefined") {
      setQrCodeUrl(`${window.location.origin}/declaracao-publica`)
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const carregarDeclaracoes = async () => {
    try {
      const data = await declaracaoOperations.getAll()
      const ordenadas = data.sort((a, b) => {
        if (a.encerrado && !b.encerrado) return 1
        if (!a.encerrado && b.encerrado) return -1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setDeclaracoes(ordenadas)
    } catch (error) {
      console.error("[v0] Erro ao carregar declarações:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar declarações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetarFormulario = () => {
    setNovaDeclaracao({
      tipo: "",
      data: new Date().toISOString().split("T")[0],
      eh_colaborador: false,
      quer_contato: false,
      eh_anonimo: false,
      nome: "",
      email: "",
      telefone: "",
      mensagem: "",
    })
    setEtapaAtual(1)
  }

  const proximaEtapa = () => {
    if (etapaAtual === 1 && !novaDeclaracao.eh_colaborador && novaDeclaracao.eh_colaborador === false) {
      // Permitir avançar mesmo se não for colaborador
    }

    if (
      etapaAtual === 2 &&
      !novaDeclaracao.eh_anonimo &&
      novaDeclaracao.eh_anonimo === false &&
      !novaDeclaracao.nome.trim()
    ) {
      alert("Por favor, escreva seu nome")
      return
    }

    if (etapaAtual === 3 && !novaDeclaracao.tipo) {
      alert("Por favor, selecione o tipo de declaração")
      return
    }

    if (etapaAtual === 4 && !novaDeclaracao.data) {
      alert("Por favor, selecione a data")
      return
    }

    if (etapaAtual === 5 && !novaDeclaracao.mensagem.trim()) {
      alert("Por favor, escreva sua mensagem")
      return
    }

    if (etapaAtual === 5) {
      // Última etapa, criar declaração
      criarDeclaracao()
    } else {
      setEtapaAtual(etapaAtual + 1)
    }
  }

  const voltarEtapa = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1)
    }
  }

  const criarDeclaracao = async () => {
    try {
      await declaracaoOperations.create({
        tipo: novaDeclaracao.tipo as "sugestao" | "elogio" | "reclamacao" | "denuncia",
        data: novaDeclaracao.data,
        eh_colaborador: novaDeclaracao.eh_colaborador,
        quer_contato: novaDeclaracao.quer_contato,
        eh_anonimo: novaDeclaracao.eh_anonimo,
        nome: novaDeclaracao.eh_anonimo ? undefined : novaDeclaracao.nome,
        email: novaDeclaracao.quer_contato ? novaDeclaracao.email : undefined,
        telefone: novaDeclaracao.quer_contato ? novaDeclaracao.telefone : undefined,
        mensagem: novaDeclaracao.mensagem,
      })

      toast({
        title: "Declaração Enviada",
        description: "Sua declaração foi enviada com sucesso!",
      })

      setShowNovaDeclaracaoDialog(false)
      resetarFormulario()
    } catch (error) {
      console.error("[v0] Erro ao criar declaração:", error)
      toast({
        title: "Erro",
        description: "Erro ao enviar declaração. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const atualizarStatusCheckbox = async (campo: string, valor: boolean) => {
    if (!declaracaoSelecionada) return

    try {
      await declaracaoOperations.update(declaracaoSelecionada.id, {
        [campo]: valor,
      })

      setDeclaracaoSelecionada({
        ...declaracaoSelecionada,
        [campo]: valor,
      })

      toast({
        title: "Status Atualizado",
        description: "Status da declaração atualizado com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const atualizarResumoCaso = async (resumo: string) => {
    if (!declaracaoSelecionada) return

    try {
      await declaracaoOperations.update(declaracaoSelecionada.id, {
        resumo_caso: resumo,
      })

      toast({
        title: "Resumo Atualizado",
        description: "Resumo do caso atualizado com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao atualizar resumo:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar resumo. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const encerrarDeclaracao = async () => {
    if (!declaracaoSelecionada) return

    try {
      await declaracaoOperations.encerrar(declaracaoSelecionada.id)

      toast({
        title: "Comunicado Encerrado",
        description: "O comunicado foi encerrado com sucesso!",
      })

      setShowDetalhesDialog(false)
      setDeclaracaoSelecionada(null)
    } catch (error) {
      console.error("[v0] Erro ao encerrar declaração:", error)
      toast({
        title: "Erro",
        description: "Erro ao encerrar comunicado. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleUploadDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!declaracaoSelecionada || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setUploadingDoc(true)

    try {
      const blob = await put(file.name, file, {
        access: "public",
      })

      await declaracaoOperations.adicionarDocumento(declaracaoSelecionada.id, {
        nome: file.name,
        url: blob.url,
        tamanho: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      })

      const declaracoesAtualizadas = await declaracaoOperations.getAll()
      setDeclaracoes(declaracoesAtualizadas)
      const declaracaoAtualizada = declaracoesAtualizadas.find((d) => d.id === declaracaoSelecionada.id)
      if (declaracaoAtualizada) {
        setDeclaracaoSelecionada(declaracaoAtualizada)
      }

      toast({
        title: "Documento Enviado",
        description: "Documento anexado com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao fazer upload:", error)
      toast({
        title: "Erro",
        description: "Erro ao enviar documento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUploadingDoc(false)
      e.target.value = ""
    }
  }

  const downloadQRCode = () => {
    const svg = document.getElementById("qrcode-svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")

      const downloadLink = document.createElement("a")
      downloadLink.download = "qrcode-declaracao.png"
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      sugestao: "Sugestão",
      elogio: "Elogio",
      reclamacao: "Reclamação",
      denuncia: "Denúncia",
    }
    return labels[tipo] || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      sugestao: "bg-blue-100 text-blue-800",
      elogio: "bg-green-100 text-green-800",
      reclamacao: "bg-yellow-100 text-yellow-800",
      denuncia: "bg-red-100 text-red-800",
    }
    return colors[tipo] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: "Pendente",
      em_analise: "Em Análise",
      resolvido: "Resolvido",
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      pendente: <Clock className="h-4 w-4" />,
      em_analise: <AlertCircle className="h-4 w-4" />,
      resolvido: <CheckCircle className="h-4 w-4" />,
    }
    return icons[status] || <Clock className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-gray-100 text-gray-800",
      em_analise: "bg-blue-100 text-blue-800",
      resolvido: "bg-green-100 text-green-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Fale Conosco
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowQRCodeDialog(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              <Button onClick={() => setShowNovaDeclaracaoDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Declaração
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros de Declarações ({declaracoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {declaracoes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma declaração registrada ainda. Clique em "Nova Declaração" para começar.
            </div>
          ) : (
            <div className="space-y-3">
              {declaracoes.map((declaracao) => (
                <Card
                  key={declaracao.id}
                  className={`border-l-4 border-l-blue-500 cursor-pointer hover:bg-gray-50 transition-colors ${
                    declaracao.encerrado ? "grayscale opacity-60" : ""
                  }`}
                  onClick={() => {
                    setDeclaracaoSelecionada(declaracao)
                    setShowDetalhesDialog(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getTipoColor(declaracao.tipo)}`}>
                          {getTipoLabel(declaracao.tipo)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {declaracao.eh_anonimo ? "Anônimo" : declaracao.nome || "Sem nome"}
                        </span>
                        {declaracao.encerrado && (
                          <span className="text-xs px-2 py-1 rounded font-medium bg-gray-200 text-gray-700">
                            Encerrado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{getStatusLabel(declaracao.status)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showQRCodeDialog} onOpenChange={setShowQRCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code para Declarações Públicas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Compartilhe este QR Code para permitir que pessoas externas enviem declarações sem acessar o sistema
              completo.
            </p>

            <div className="flex justify-center p-6 bg-white border rounded-lg">
              <QRCodeSVG id="qrcode-svg" value={qrCodeUrl} size={256} level="H" includeMargin={true} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Link direto:</label>
              <div className="flex gap-2">
                <Input value={qrCodeUrl} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(qrCodeUrl)
                    toast({
                      title: "Link Copiado",
                      description: "O link foi copiado para a área de transferência!",
                    })
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadQRCode} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Baixar QR Code
              </Button>
              <Button variant="outline" onClick={() => setShowQRCodeDialog(false)} className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNovaDeclaracaoDialog} onOpenChange={setShowNovaDeclaracaoDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Declaração - Etapa {etapaAtual} de 5</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {etapaAtual === 1 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Você é colaborador?</label>
                <div className="flex gap-3">
                  <Button
                    variant={novaDeclaracao.eh_colaborador ? "default" : "outline"}
                    onClick={() => setNovaDeclaracao({ ...novaDeclaracao, eh_colaborador: true })}
                    className="flex-1 h-20"
                  >
                    Sim, sou colaborador
                  </Button>
                  <Button
                    variant={!novaDeclaracao.eh_colaborador ? "default" : "outline"}
                    onClick={() => setNovaDeclaracao({ ...novaDeclaracao, eh_colaborador: false })}
                    className="flex-1 h-20"
                  >
                    Não sou colaborador
                  </Button>
                </div>
              </div>
            )}

            {etapaAtual === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Deseja se identificar?</label>
                  <div className="flex gap-3">
                    <Button
                      variant={!novaDeclaracao.eh_anonimo ? "default" : "outline"}
                      onClick={() => setNovaDeclaracao({ ...novaDeclaracao, eh_anonimo: false, quer_contato: false })}
                      className="flex-1 h-20"
                    >
                      Sim, quero me identificar
                    </Button>
                    <Button
                      variant={novaDeclaracao.eh_anonimo ? "default" : "outline"}
                      onClick={() =>
                        setNovaDeclaracao({
                          ...novaDeclaracao,
                          eh_anonimo: true,
                          quer_contato: false,
                          nome: "",
                          email: "",
                          telefone: "",
                        })
                      }
                      className="flex-1 h-20"
                    >
                      Não, prefiro anonimato
                    </Button>
                  </div>
                </div>

                {!novaDeclaracao.eh_anonimo && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Escreva seu nome</label>
                      <Input
                        value={novaDeclaracao.nome}
                        onChange={(e) => setNovaDeclaracao({ ...novaDeclaracao, nome: e.target.value })}
                        placeholder="Seu nome completo"
                        className="mt-1"
                      />
                    </div>

                    {novaDeclaracao.nome.trim() && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Deseja deixar um telefone para contato?
                        </label>
                        <div className="flex gap-3 mb-3">
                          <Button
                            variant={novaDeclaracao.quer_contato ? "default" : "outline"}
                            onClick={() => setNovaDeclaracao({ ...novaDeclaracao, quer_contato: true })}
                            className="flex-1"
                          >
                            Sim
                          </Button>
                          <Button
                            variant={!novaDeclaracao.quer_contato ? "default" : "outline"}
                            onClick={() =>
                              setNovaDeclaracao({ ...novaDeclaracao, quer_contato: false, telefone: "", email: "" })
                            }
                            className="flex-1"
                          >
                            Não
                          </Button>
                        </div>

                        {novaDeclaracao.quer_contato && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Telefone</label>
                              <Input
                                type="tel"
                                value={novaDeclaracao.telefone}
                                onChange={(e) => setNovaDeclaracao({ ...novaDeclaracao, telefone: e.target.value })}
                                placeholder="(00) 00000-0000"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">E-mail (opcional)</label>
                              <Input
                                type="email"
                                value={novaDeclaracao.email}
                                onChange={(e) => setNovaDeclaracao({ ...novaDeclaracao, email: e.target.value })}
                                placeholder="seu@email.com"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {etapaAtual === 3 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Que tipo de declaração você deseja fazer?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={novaDeclaracao.tipo === "sugestao" ? "default" : "outline"}
                    onClick={() => setNovaDeclaracao({ ...novaDeclaracao, tipo: "sugestao" })}
                    className="h-20"
                  >
                    Sugestão
                  </Button>
                  <Button
                    variant={novaDeclaracao.tipo === "elogio" ? "default" : "outline"}
                    onClick={() => setNovaDeclaracao({ ...novaDeclaracao, tipo: "elogio" })}
                    className="h-20"
                  >
                    Elogio
                  </Button>
                  <Button
                    variant={novaDeclaracao.tipo === "reclamacao" ? "default" : "outline"}
                    onClick={() => setNovaDeclaracao({ ...novaDeclaracao, tipo: "reclamacao" })}
                    className="h-20"
                  >
                    Reclamação
                  </Button>
                  <Button
                    variant={novaDeclaracao.tipo === "denuncia" ? "default" : "outline"}
                    onClick={() => {
                      if (!novaDeclaracao.eh_colaborador) {
                        alert("Denúncias só podem ser feitas por colaboradores")
                        return
                      }
                      setNovaDeclaracao({ ...novaDeclaracao, tipo: "denuncia" })
                    }}
                    className="h-20"
                    disabled={!novaDeclaracao.eh_colaborador}
                  >
                    Denúncia
                  </Button>
                </div>
                {!novaDeclaracao.eh_colaborador && (
                  <p className="text-xs text-amber-600 mt-2">* Denúncias só podem ser feitas por colaboradores</p>
                )}
              </div>
            )}

            {etapaAtual === 4 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Data</label>
                <Input
                  type="date"
                  value={novaDeclaracao.data}
                  onChange={(e) => setNovaDeclaracao({ ...novaDeclaracao, data: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}

            {etapaAtual === 5 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Mensagem</label>
                <Textarea
                  value={novaDeclaracao.mensagem}
                  onChange={(e) => setNovaDeclaracao({ ...novaDeclaracao, mensagem: e.target.value })}
                  placeholder="Escreva sua mensagem aqui..."
                  className="mt-1 min-h-[200px]"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            {etapaAtual > 1 && (
              <Button onClick={voltarEtapa} variant="outline" className="flex-1 bg-transparent">
                Voltar
              </Button>
            )}
            <Button
              onClick={() => {
                setShowNovaDeclaracaoDialog(false)
                resetarFormulario()
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={proximaEtapa} className="flex-1">
              {etapaAtual === 5 ? "Enviar" : "Próximo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetalhesDialog} onOpenChange={setShowDetalhesDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Declaração</DialogTitle>
          </DialogHeader>

          {declaracaoSelecionada && (
            <div className="space-y-6 mt-4">
              {/* Informações básicas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${getTipoColor(declaracaoSelecionada.tipo)}`}>
                    {getTipoLabel(declaracaoSelecionada.tipo)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(declaracaoSelecionada.data).toLocaleDateString("pt-BR")}
                  </span>
                  {declaracaoSelecionada.encerrado && (
                    <span className="text-xs px-2 py-1 rounded font-medium bg-gray-200 text-gray-700 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Encerrado
                    </span>
                  )}
                </div>

                {!declaracaoSelecionada.eh_anonimo && declaracaoSelecionada.nome && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nome:</label>
                    <p className="text-sm text-gray-900">{declaracaoSelecionada.nome}</p>
                  </div>
                )}

                {declaracaoSelecionada.telefone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Telefone:</label>
                    <p className="text-sm text-gray-900">{declaracaoSelecionada.telefone}</p>
                  </div>
                )}

                {declaracaoSelecionada.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">E-mail:</label>
                    <p className="text-sm text-gray-900">{declaracaoSelecionada.email}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Mensagem:</label>
                  <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded border">
                    {declaracaoSelecionada.mensagem}
                  </p>
                </div>
              </div>

              {/* Status de rastreamento */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Status do Caso</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={declaracaoSelecionada.status_investigacao_iniciada || false}
                      onCheckedChange={(checked) =>
                        atualizarStatusCheckbox("status_investigacao_iniciada", checked as boolean)
                      }
                      disabled={declaracaoSelecionada.encerrado}
                    />
                    <label className="text-sm">Investigação Iniciada</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={declaracaoSelecionada.status_coleta_dados || false}
                      onCheckedChange={(checked) => atualizarStatusCheckbox("status_coleta_dados", checked as boolean)}
                      disabled={declaracaoSelecionada.encerrado}
                    />
                    <label className="text-sm">Coleta de Dados</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={declaracaoSelecionada.status_resolucao || false}
                      onCheckedChange={(checked) => atualizarStatusCheckbox("status_resolucao", checked as boolean)}
                      disabled={declaracaoSelecionada.encerrado}
                    />
                    <label className="text-sm">Resolução</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={declaracaoSelecionada.status_encerrada || false}
                      onCheckedChange={(checked) => atualizarStatusCheckbox("status_encerrada", checked as boolean)}
                      disabled={declaracaoSelecionada.encerrado}
                    />
                    <label className="text-sm">Encerrada</label>
                  </div>
                </div>
              </div>

              {/* Resumo do caso */}
              <div className="border-t pt-4">
                <label className="text-sm font-semibold mb-2 block">Resumo do Caso e Encerramento</label>
                <Textarea
                  value={declaracaoSelecionada.resumo_caso || ""}
                  onChange={(e) => {
                    setDeclaracaoSelecionada({
                      ...declaracaoSelecionada,
                      resumo_caso: e.target.value,
                    })
                  }}
                  onBlur={(e) => atualizarResumoCaso(e.target.value)}
                  placeholder="Escreva o resumo do caso e detalhes do encerramento..."
                  className="min-h-[120px]"
                  disabled={declaracaoSelecionada.encerrado}
                />
              </div>

              {/* Upload de documentos */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold">Documentos</label>
                  <Button
                    size="sm"
                    disabled={uploadingDoc || declaracaoSelecionada.encerrado}
                    onClick={() => document.getElementById("doc-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingDoc ? "Enviando..." : "Adicionar Documento"}
                  </Button>
                  <input
                    id="doc-upload"
                    type="file"
                    className="hidden"
                    onChange={handleUploadDocumento}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>

                {declaracaoSelecionada.documentos && declaracaoSelecionada.documentos.length > 0 ? (
                  <div className="space-y-2">
                    {declaracaoSelecionada.documentos.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{doc.nome}</p>
                            <p className="text-xs text-gray-500">{doc.tamanho}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum documento anexado</p>
                )}
              </div>

              {!declaracaoSelecionada.encerrado && (
                <div className="border-t pt-4">
                  <Button onClick={encerrarDeclaracao} variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4 mr-2" />
                    Encerrar Comunicado
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
