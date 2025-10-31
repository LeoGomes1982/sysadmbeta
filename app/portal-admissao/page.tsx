"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Upload,
  X,
  Calendar,
  LinkIcon,
  CheckCircle,
  Eye,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  File,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useEmployees } from "@/hooks/use-employees"
import { createClient } from "@/lib/supabase/client"
import {
  appointmentOperations,
  processoJuridicoOperations,
  processoChecklistOperations,
} from "@/lib/database/operations"
import {
  listarDocumentos,
  removerDocumento as removerDocumentoDb,
  removerDocumentosPorPasta,
} from "@/lib/supabase/processo-documentos"
import type { ProcessoDocumento } from "@/lib/supabase/processo-documentos"
import { uploadChunk } from "@/app/actions/upload-documento-chunked"
import { Checkbox } from "@/components/ui/checkbox"

interface Reclamada {
  nome: string
}

interface DataAudiencia {
  data: string
  descricao: string
}

interface ProcessoJuridico {
  id?: string
  funcionarioReclamanteId: string
  reclamadas: Reclamada[]
  dataAudiencia: string
  horaAudiencia: string
  datasAdicionais: DataAudiencia[]
  cidade: string
  tipoAudiencia: "presencial" | "distancia"
  linkAudiencia?: string
  mensagem: string
  documentos: { url: string; name: string; folderName?: string }[] // Adicionado folderName
}

interface ProcessoEncerrado extends ProcessoJuridico {
  valorFinalizacao: string
  dataEncerramento: string
}

// Interface para item de checklist
interface ChecklistItem {
  id: string
  texto: string
  concluido: boolean
  ordem: number
}

const criarProcessoVazio = (): ProcessoJuridico => ({
  funcionarioReclamanteId: "",
  reclamadas: [],
  dataAudiencia: "",
  horaAudiencia: "",
  datasAdicionais: [],
  cidade: "",
  tipoAudiencia: "presencial",
  mensagem: "",
  documentos: [],
})

export default function PortalJuridico() {
  const [processos, setProcessos] = useState<ProcessoJuridico[]>([])
  const [processoAtualIndex, setProcessoAtualIndex] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [processosEncerrados, setProcessosEncerrados] = useState<ProcessoEncerrado[]>([])
  const [showEncerrarModal, setShowEncerrarModal] = useState(false)
  const [valorFinalizacao, setValorFinalizacao] = useState("")
  const [showVisualizarModal, setShowVisualizarModal] = useState(false)
  const [processoVisualizando, setProcessoVisualizando] = useState<ProcessoEncerrado | null>(null)
  const [carregouLocalStorage, setCarregouLocalStorage] = useState(false)
  const { toast } = useToast()
  const { data: funcionarios } = useEmployees()

  const [novaReclamada, setNovaReclamada] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [documentosSupabase, setDocumentosSupabase] = useState<{ [processoId: string]: ProcessoDocumento[] }>({})

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [novoItemChecklist, setNovoItemChecklist] = useState("")

  useEffect(() => {
    carregarProcessosDoSupabase()
  }, [])

  const carregarProcessosDoSupabase = async () => {
    try {
      const processosAtivos = await processoJuridicoOperations.getAtivos()

      // Converter para formato local
      const processosFormatados = processosAtivos.map((p: any) => ({
        id: p.id,
        funcionarioReclamanteId: p.funcionario_reclamante_id,
        reclamadas: p.reclamadas || [],
        dataAudiencia: p.data_audiencia,
        horaAudiencia: p.hora_audiencia,
        datasAdicionais: p.datas_adicionais || [],
        cidade: p.cidade,
        tipoAudiencia: p.tipo_audiencia,
        linkAudiencia: p.link_audiencia,
        mensagem: p.mensagem,
        documentos: [],
      }))

      // Preencher com processos vazios até ter 3
      while (processosFormatados.length < 3) {
        processosFormatados.push(criarProcessoVazio())
      }

      setProcessos(processosFormatados)
      setCarregouLocalStorage(true)

      // Subscrever a mudanças em tempo real
      const supabase = createClient()
      const channel = supabase
        .channel("processos-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "processos_juridicos",
          },
          () => {
            console.log("[v0] Mudança detectada nos processos, recarregando...")
            carregarProcessosDoSupabase()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar processos:", error)
      setProcessos([criarProcessoVazio(), criarProcessoVazio(), criarProcessoVazio()])
      setCarregouLocalStorage(true)
    }
  }

  useEffect(() => {
    if (carregouLocalStorage && processos.length > 0) {
      // A lógica de salvar no localStorage foi removida, pois os dados agora vêm do Supabase
    }
  }, [processos, carregouLocalStorage])

  useEffect(() => {
    if (processoAtualIndex !== null) {
      const processo = processos[processoAtualIndex]
      if (processo.id) {
        carregarDocumentosDoProcesso(processo.id)
        carregarChecklistDoProcesso(processo.id)
        // Subscrever a mudanças em tempo real
        const supabase = createClient()
        const channel = supabase
          .channel(`processo_documentos:${processo.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "processo_documentos",
              filter: `processo_id=eq.${processo.id}`,
            },
            (payload) => {
              console.log("[v0] Mudança detectada nos documentos:", payload)
              carregarDocumentosDoProcesso(processo.id!)
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "processo_checklist",
              filter: `processo_id=eq.${processo.id}`,
            },
            (payload) => {
              console.log("[v0] Mudança detectada no checklist:", payload)
              carregarChecklistDoProcesso(processo.id!)
            },
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [processoAtualIndex])

  const carregarProcessosDoLocalStorage = () => {
    // Esta função foi removida pois a carga de dados agora é feita do Supabase.
    // O código que a chamava (useEffect inicial) foi adaptado para chamar carregarProcessosDoSupabase().
  }

  const salvarProcessosNoLocalStorage = () => {
    // Esta função foi removida pois a lógica de persistência agora é feita via Supabase.
  }

  const carregarProcessosEncerrados = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("processos_juridicos_encerrados")
        .select("*")
        .order("data_encerramento", { ascending: false })

      if (error) {
        if (error.message.includes("Could not find the table")) {
          console.log("[v0] Tabela de processos encerrados ainda não foi criada. Execute o script SQL.")
          return
        }
        throw error
      }

      if (data) {
        const processosFormatados = data.map((p: any) => ({
          id: p.id,
          funcionarioReclamanteId: p.funcionario_reclamante_id,
          reclamadas: p.reclamadas || [],
          dataAudiencia: p.data_audiencia,
          horaAudiencia: p.hora_audiencia,
          datasAdicionais: p.datas_adicionais || [],
          cidade: p.cidade,
          tipoAudiencia: p.tipo_audiencia,
          linkAudiencia: p.link_audiencia,
          mensagem: p.mensagem,
          documentos: p.documentos || [],
          valorFinalizacao: p.valor_finalizacao,
          dataEncerramento: p.data_encerramento,
        }))
        setProcessosEncerrados(processosFormatados)
      }
    } catch (error) {
      console.log("[v0] Processos encerrados não puderam ser carregados:", error)
    }
  }

  const abrirModalProcesso = (index: number) => {
    setProcessoAtualIndex(index)
    setShowModal(true)
    setNovaReclamada("")

    const novosProcessos = [...processos]
    if (!novosProcessos[index].id) {
      // Se o processo ainda não tem ID (é um processo vazio que veio do front-end),
      // ele será criado no Supabase ao ser salvo pela primeira vez.
    }
  }

  const atualizarProcesso = (campo: keyof ProcessoJuridico, valor: any) => {
    if (processoAtualIndex === null) return
    const novosProcessos = [...processos]
    novosProcessos[processoAtualIndex] = {
      ...novosProcessos[processoAtualIndex],
      [campo]: valor,
    }
    setProcessos(novosProcessos)
  }

  const adicionarReclamada = () => {
    if (processoAtualIndex === null) return
    if (!novaReclamada.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome da reclamada",
        variant: "destructive",
      })
      return
    }

    const novosProcessos = [...processos]
    novosProcessos[processoAtualIndex].reclamadas.push({ nome: novaReclamada })
    setProcessos(novosProcessos)
    setNovaReclamada("")
    toast({
      title: "Reclamada Adicionada",
      description: "Reclamada foi adicionada com sucesso!",
    })
  }

  const removerReclamada = (index: number) => {
    if (processoAtualIndex === null) return
    const novosProcessos = [...processos]
    novosProcessos[processoAtualIndex].reclamadas = novosProcessos[processoAtualIndex].reclamadas.filter(
      (_, i) => i !== index,
    )
    setProcessos(novosProcessos)
  }

  const handleFileUploadJuridico = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (processoAtualIndex === null) return
    const files = e.target.files
    if (!files || files.length === 0) return

    const processo = processos[processoAtualIndex]
    if (!processo.id) {
      toast({
        title: "Erro",
        description: "Processo ainda não salvo. Por favor, salve o processo antes de adicionar documentos.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingFile(true)

      const firstFile = files[0]
      const webkitPath = (firstFile as any).webkitRelativePath
      const folderName = webkitPath ? webkitPath.split("/")[0] : null

      console.log("[v0] Iniciando upload de", files.length, "arquivo(s)")
      if (folderName) {
        console.log("[v0] Pasta detectada:", folderName)
      }

      const uploadedDocs: { url: string; name: string; folderName?: string }[] = []
      const errors: string[] = []

      const maxSize = 25 * 1024 * 1024 // 25 MB
      const chunkSize = 4 * 1024 * 1024 // 4 MB por chunk

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(
          `[v0] Uploading ${i + 1}/${files.length}:`,
          file.name,
          `(${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        )

        const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".txt"]
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
        if (!allowedTypes.includes(fileExtension)) {
          errors.push(`${file.name}: Tipo de arquivo não suportado. Use: PDF, JPG, PNG, DOC, DOCX ou TXT.`)
          console.error("[v0] Tipo de arquivo não suportado:", fileExtension)
          continue
        }

        if (file.size > maxSize) {
          errors.push(`${file.name}: Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo: 25 MB.`)
          console.error("[v0] Arquivo muito grande:", file.size, "bytes")
          continue
        }

        if (file.size === 0) {
          errors.push(`${file.name}: Arquivo vazio (0 bytes).`)
          console.error("[v0] Arquivo vazio")
          continue
        }

        try {
          if (file.size > 4.5 * 1024 * 1024) {
            console.log("[v0] Arquivo grande detectado. Usando upload em chunks...")

            const fileId = crypto.randomUUID()
            const totalChunks = Math.ceil(file.size / chunkSize)

            console.log(`[v0] Dividindo em ${totalChunks} chunks de ~4 MB`)

            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
              const start = chunkIndex * chunkSize
              const end = Math.min(start + chunkSize, file.size)
              const chunk = file.slice(start, end)

              const formData = new FormData()
              formData.append("chunk", chunk)
              formData.append("chunkIndex", chunkIndex.toString())
              formData.append("totalChunks", totalChunks.toString())
              formData.append("fileId", fileId)
              formData.append("fileName", file.name)
              formData.append("fileType", file.type)
              formData.append("processoId", processo.id)
              if (folderName) {
                formData.append("folderName", folderName)
              }

              console.log(`[v0] Enviando chunk ${chunkIndex + 1}/${totalChunks}...`)
              const result = await uploadChunk(formData)

              if (!result.success) {
                throw new Error(result.error || "Falha no upload do chunk")
              }

              // Atualizar progresso
              const progress = ((chunkIndex + 1) / totalChunks) * 100
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }))

              if (result.complete) {
                console.log(`[v0] Upload completo:`, result.url)
                uploadedDocs.push({
                  url: result.url!,
                  name: result.name!,
                  folderName: result.folderName,
                })
                setUploadProgress((prev) => {
                  const newProgress = { ...prev }
                  delete newProgress[file.name]
                  return newProgress
                })
              }
            }
          } else {
            console.log("[v0] Arquivo pequeno. Usando upload direto...")
            const formData = new FormData()
            formData.append("file", file)
            formData.append("processoId", processo.id)
            if (folderName) {
              formData.append("folderName", folderName)
            }

            const { uploadDocumento } = await import("@/app/actions/upload-documento")
            const result = await uploadDocumento(formData)

            if (!result.success) {
              throw new Error(result.error || "Falha no upload")
            }

            uploadedDocs.push({
              url: result.url!,
              name: result.name!,
              folderName: result.folderName,
            })
          }

          console.log(`[v0] Upload ${i + 1}/${files.length} concluído`)
        } catch (error) {
          console.error(`[v0] Erro no upload de ${file.name}:`, error)
          const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
          errors.push(`${file.name}: ${errorMessage}`)
        }
      }

      if (uploadedDocs.length > 0) {
        console.log("[v0] Recarregando documentos após upload...")
        await carregarDocumentosDoProcesso(processo.id)

        toast({
          title: "Upload Concluído",
          description: `${uploadedDocs.length} documento(s) carregado(s) com sucesso${folderName ? ` da pasta "${folderName}"` : ""}! Todos os usuários podem ver agora.`,
        })
      }

      if (errors.length > 0) {
        console.error("[v0] Erros no upload:", errors)
        toast({
          title: errors.length === files.length ? "Falha no Upload" : "Alguns arquivos falharam",
          description:
            errors.slice(0, 3).join("\n") + (errors.length > 3 ? `\n... e mais ${errors.length - 3} erro(s)` : ""),
          variant: "destructive",
        })
      }

      if (uploadedDocs.length === 0 && errors.length === 0) {
        toast({
          title: "Nenhum Arquivo Processado",
          description: "Nenhum arquivo foi selecionado ou todos foram filtrados.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Erro geral no upload:", error)
      toast({
        title: "Erro no Upload",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao fazer upload dos documentos. Verifique o console para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setUploadingFile(false)
      setUploadProgress({})
      const input = document.getElementById("documento-upload") as HTMLInputElement
      if (input) input.value = ""
      const folderInput = document.getElementById("pasta-upload") as HTMLInputElement
      if (folderInput) folderInput.value = ""
    }
  }

  const removerDocumento = async (documentoId: string) => {
    if (processoAtualIndex === null) return

    try {
      await removerDocumentoDb(documentoId)
      toast({
        title: "Documento Removido",
        description: "O documento foi removido com sucesso.",
      })
    } catch (error) {
      console.error("[v0] Erro ao remover documento:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover documento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const removerPasta = async (folderName: string) => {
    if (processoAtualIndex === null) return
    const processo = processos[processoAtualIndex]
    if (!processo.id) return

    try {
      await removerDocumentosPorPasta(processo.id, folderName)
      toast({
        title: "Pasta Removida",
        description: `A pasta "${folderName}" e todos os seus arquivos foram removidos.`,
      })
    } catch (error) {
      console.error("[v0] Erro ao remover pasta:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover pasta. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const salvarProcesso = async () => {
    if (processoAtualIndex === null) return
    const processo = processos[processoAtualIndex]

    // Validações...
    if (
      !processo.funcionarioReclamanteId ||
      processo.reclamadas.length === 0 ||
      !processo.dataAudiencia ||
      !processo.horaAudiencia ||
      !processo.cidade ||
      !processo.mensagem
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (processo.tipoAudiencia === "distancia" && !processo.linkAudiencia) {
      toast({
        title: "Erro",
        description: "Informe o link da audiência a distância.",
        variant: "destructive",
      })
      return
    }

    try {
      const processoData = {
        funcionario_reclamante_id: processo.funcionarioReclamanteId,
        reclamadas: processo.reclamadas,
        data_audiencia: processo.dataAudiencia,
        hora_audiencia: processo.horaAudiencia,
        datas_adicionais: processo.datasAdicionais,
        cidade: processo.cidade,
        tipo_audiencia: processo.tipoAudiencia,
        link_audiencia: processo.linkAudiencia,
        mensagem: processo.mensagem,
        ordem: processoAtualIndex,
      }

      if (processo.id) {
        // Atualizar existente
        await processoJuridicoOperations.update(processo.id, processoData)
      } else {
        // Criar novo
        const novoProcesso = await processoJuridicoOperations.create(processoData)
        const novosProcessos = [...processos]
        novosProcessos[processoAtualIndex].id = novoProcesso.id
        setProcessos(novosProcessos)
      }

      // Adicionar audiências na agenda (código existente)
      const funcionario = funcionarios?.find((f: any) => f.id === processo.funcionarioReclamanteId)
      const nomeReclamante = funcionario?.nome || "Reclamante"

      const supabase = createClient()
      const { data: audienciasExistentes } = await supabase
        .from("appointments")
        .select("*")
        .eq("tipo", "audiencia")
        .ilike("titulo", `%${nomeReclamante}%`)

      if (audienciasExistentes && audienciasExistentes.length > 0) {
        console.log("[v0] Excluindo audiências anteriores:", audienciasExistentes.length)
        for (const audiencia of audienciasExistentes) {
          await appointmentOperations.delete(audiencia.id)
        }
      }

      if (processo.dataAudiencia && processo.horaAudiencia) {
        const numeroAudiencia = processo.datasAdicionais.length + 1
        const tituloAudiencia =
          numeroAudiencia === 1
            ? `Audiência do reclamante ${nomeReclamante}`
            : `Audiência ${numeroAudiencia === 2 ? "II" : numeroAudiencia === 3 ? "III" : numeroAudiencia === 4 ? "IV" : "V"} do reclamante ${nomeReclamante}`

        // Usar a data diretamente sem adicionar horário
        await appointmentOperations.create({
          titulo: tituloAudiencia,
          descricao: `Processo jurídico - ${processo.reclamadas.map((r) => r.nome).join(", ")}`,
          data: processo.dataAudiencia,
          hora: processo.horaAudiencia,
          tipo: "audiencia",
          responsaveis: ["Leandro"],
          prioridade: "importante",
        })

        console.log("[v0] Audiência adicionada na agenda:", tituloAudiencia)
      }

      for (let i = 0; i < processo.datasAdicionais.length; i++) {
        const dataAdicional = processo.datasAdicionais[i]
        if (dataAdicional.data) {
          const numeroAudiencia = i + 2
          const nomeAudiencia =
            numeroAudiencia === 2
              ? "Segunda Audiência"
              : numeroAudiencia === 3
                ? "Terceira Audiência"
                : numeroAudiencia === 4
                  ? "Quarta Audiência"
                  : numeroAudiencia === 5
                    ? "Quinta Audiência"
                    : `${numeroAudiencia}ª Audiência`

          // Usar a data diretamente sem adicionar horário
          await appointmentOperations.create({
            titulo: nomeAudiencia,
            descricao:
              dataAdicional.descricao || `Processo jurídico - ${processo.reclamadas.map((r) => r.nome).join(", ")}`,
            data: dataAdicional.data,
            hora: processo.horaAudiencia,
            tipo: "audiencia",
            responsaveis: ["Leandro"],
            prioridade: "importante",
          })

          console.log("[v0] Audiência adicional adicionada na agenda:", nomeAudiencia)
        }
      }

      toast({
        title: "Processo Salvo",
        description: `Processo ${processoAtualIndex + 1} foi salvo e sincronizado com todos os usuários!`,
      })

      setShowModal(false)
      setProcessoAtualIndex(null)
    } catch (error) {
      console.error("[v0] Erro ao salvar processo:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar processo. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const abrirModalEncerrar = () => {
    setShowEncerrarModal(true)
    setValorFinalizacao("")
  }

  const encerrarProcesso = async () => {
    if (processoAtualIndex === null) return
    const processo = processos[processoAtualIndex]

    if (!valorFinalizacao.trim()) {
      toast({
        title: "Erro",
        description: "Informe o valor da finalização do processo.",
        variant: "destructive",
      })
      return
    }

    if (!processo.id) {
      toast({
        title: "Erro",
        description: "Processo não foi salvo ainda. Salve antes de encerrar.",
        variant: "destructive",
      })
      return
    }

    try {
      await processoJuridicoOperations.encerrar(processo.id, valorFinalizacao)

      toast({
        title: "Processo Encerrado",
        description: "Processo foi encerrado e sincronizado com todos os usuários!",
      })

      await carregarProcessosEncerrados()
      await carregarProcessosDoSupabase()

      setShowEncerrarModal(false)
      setShowModal(false)
      setProcessoAtualIndex(null)
      setValorFinalizacao("")
    } catch (error) {
      console.error("[v0] Erro ao encerrar processo:", error)
      toast({
        title: "Erro",
        description: "Erro ao encerrar processo. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const processoTemDados = (processo: ProcessoJuridico | null): boolean => {
    if (!processo) return false

    return (
      (processo.funcionarioReclamanteId && processo.funcionarioReclamanteId.trim() !== "") ||
      processo.reclamadas.length > 0 ||
      (processo.dataAudiencia && processo.dataAudiencia.trim() !== "") ||
      (processo.mensagem && processo.mensagem.trim() !== "") ||
      processo.documentos.length > 0
    )
  }

  const processoAtual = processoAtualIndex !== null ? processos[processoAtualIndex] : null

  const adicionarDataAdicional = () => {
    if (processoAtualIndex === null) return
    const novosProcessos = [...processos]
    novosProcessos[processoAtualIndex].datasAdicionais.push({
      data: "",
      descricao: "",
    })
    setProcessos(novosProcessos)
  }

  const removerDataAdicional = (index: number) => {
    if (processoAtualIndex === null) return
    const novosProcessos = [...processos]
    novosProcessos[processoAtualIndex].datasAdicionais = novosProcessos[processoAtualIndex].datasAdicionais.filter(
      (_, i) => i !== index,
    )
    setProcessos(novosProcessos)
  }

  const atualizarDataAdicional = (index: number, campo: keyof DataAudiencia, valor: string) => {
    if (processoAtualIndex === null) return
    const novosProcessos = [...processos]
    novosProcessos[processoAtualIndex].datasAdicionais[index] = {
      ...novosProcessos[processoAtualIndex].datasAdicionais[index],
      [campo]: valor,
    }
    setProcessos(novosProcessos)
  }

  const visualizarProcesso = (processo: ProcessoEncerrado) => {
    setProcessoVisualizando(processo)
    setShowVisualizarModal(true)
  }

  const getDocumentosProcessoAtual = (): ProcessoDocumento[] => {
    if (processoAtualIndex === null) return []
    const processo = processos[processoAtualIndex]
    if (!processo.id) return []
    return documentosSupabase[processo.id] || []
  }

  const groupDocumentsByFolder = (documentos: ProcessoDocumento[]) => {
    const folders: { [key: string]: ProcessoDocumento[] } = {}
    const individualFiles: ProcessoDocumento[] = []

    documentos.forEach((doc) => {
      if (doc.pasta) {
        if (!folders[doc.pasta]) {
          folders[doc.pasta] = []
        }
        folders[doc.pasta].push(doc)
      } else {
        individualFiles.push(doc)
      }
    })

    return { folders, individualFiles }
  }

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderName)) {
        newSet.delete(folderName)
      } else {
        newSet.add(folderName)
      }
      return newSet
    })
  }

  const carregarDocumentosDoProcesso = async (processoId: string) => {
    try {
      console.log("[v0] Carregando documentos do processo:", processoId)
      const docs = await listarDocumentos(processoId)
      setDocumentosSupabase((prev) => ({
        ...prev,
        [processoId]: docs,
      }))
      console.log("[v0] Documentos carregados:", docs.length)
    } catch (error) {
      console.error("[v0] Erro ao carregar documentos:", error)
    }
  }

  const carregarChecklistDoProcesso = async (processoId: string) => {
    try {
      console.log("[v0] Carregando checklist do processo:", processoId)
      const items = await processoChecklistOperations.getByProcessoId(processoId)
      setChecklistItems(items)
      console.log("[v0] Checklist carregado:", items.length, "itens")
    } catch (error) {
      console.error("[v0] Erro ao carregar checklist:", error)
    }
  }

  const adicionarItemChecklist = async () => {
    if (processoAtualIndex === null) return
    const processo = processos[processoAtualIndex]
    if (!processo.id) {
      toast({
        title: "Erro",
        description: "Salve o processo antes de adicionar itens ao checklist.",
        variant: "destructive",
      })
      return
    }

    if (!novoItemChecklist.trim()) {
      toast({
        title: "Erro",
        description: "Digite o texto do item do checklist.",
        variant: "destructive",
      })
      return
    }

    try {
      const ordem = checklistItems.length
      await processoChecklistOperations.create({
        processo_id: processo.id,
        texto: novoItemChecklist,
        ordem,
      })
      setNovoItemChecklist("")
      toast({
        title: "Item Adicionado",
        description: "Item adicionado ao checklist com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao adicionar item:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar item ao checklist.",
        variant: "destructive",
      })
    }
  }

  const toggleItemChecklist = async (id: string, concluido: boolean) => {
    try {
      await processoChecklistOperations.toggle(id, !concluido)
    } catch (error) {
      console.error("[v0] Erro ao alternar item:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar item do checklist.",
        variant: "destructive",
      })
    }
  }

  const removerItemChecklist = async (id: string) => {
    try {
      await processoChecklistOperations.delete(id)
      toast({
        title: "Item Removido",
        description: "Item removido do checklist com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao remover item:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover item do checklist.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portal Jurídico</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processos.map((processo, index) => {
              const funcionarioReclamante = processo.funcionarioReclamanteId
                ? funcionarios?.find((f: any) => f.id === processo.funcionarioReclamanteId)
                : null
              const tituloCard = funcionarioReclamante?.nome || `Iniciar Processo ${index + 1}`

              return (
                <Card
                  key={index}
                  className="relative transition-all duration-200 cursor-pointer hover:shadow-md border-gray-200"
                  onClick={() => abrirModalProcesso(index)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <Plus className="h-8 w-8 text-blue-500" />
                    </div>
                    <CardTitle className="text-lg font-medium text-gray-900">{tituloCard}</CardTitle>
                    {processoTemDados(processo) && <p className="text-sm text-green-600 mt-2">Em andamento</p>}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-center">
                      <Button onClick={() => abrirModalProcesso(index)} className="w-full">
                        {processoTemDados(processo) ? "Continuar Processo" : "Iniciar Processo"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {processosEncerrados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processos Encerrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processosEncerrados.map((processo, index) => {
                const funcionario = funcionarios?.find((f: any) => f.id === processo.funcionarioReclamanteId)
                return (
                  <Card key={processo.id || index} className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-lg">
                              {funcionario?.nome || "Funcionário não encontrado"}
                            </h3>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Reclamadas:</span>{" "}
                            {processo.reclamadas.map((r) => r.nome).join(", ")}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => visualizarProcesso(processo)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Processo Jurídico {processoAtualIndex !== null ? processoAtualIndex + 1 : ""}</DialogTitle>
            <DialogDescription>Preencha as informações do processo judicial</DialogDescription>
          </DialogHeader>

          {processoAtual && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="funcionarioReclamante">Nome do Reclamante *</Label>
                <Select
                  value={processoAtual.funcionarioReclamanteId}
                  onValueChange={(value) => atualizarProcesso("funcionarioReclamanteId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário reclamante" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios?.map((func: any) => (
                      <SelectItem key={func.id} value={func.id}>
                        {func.nome} - {func.status || "ATIVO"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reclamadas *</Label>
                <div className="flex gap-2">
                  <Input
                    value={novaReclamada}
                    onChange={(e) => setNovaReclamada(e.target.value)}
                    placeholder="Digite o nome da reclamada"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        adicionarReclamada()
                      }
                    }}
                  />
                  <Button onClick={adicionarReclamada} type="button">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                {processoAtual.reclamadas.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {processoAtual.reclamadas.map((reclamada, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{reclamada.nome}</span>
                        <Button variant="ghost" size="sm" onClick={() => removerReclamada(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dados da Audiência
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataAudiencia">Data da Primeira Audiência *</Label>
                    <Input
                      id="dataAudiencia"
                      type="date"
                      value={processoAtual.dataAudiencia}
                      onChange={(e) => atualizarProcesso("dataAudiencia", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horaAudiencia">Hora *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="horaAudiencia"
                        type="time"
                        value={processoAtual.horaAudiencia}
                        onChange={(e) => atualizarProcesso("horaAudiencia", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="default"
                        onClick={adicionarDataAdicional}
                        type="button"
                        size="sm"
                        className="bg-black hover:bg-gray-800"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Datas
                      </Button>
                    </div>
                  </div>
                </div>

                {processoAtual.datasAdicionais.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {processoAtual.datasAdicionais.map((dataAdicional, index) => {
                      const numeroAudiencia = index + 2
                      const nomeAudiencia =
                        numeroAudiencia === 2
                          ? "Segunda Audiência"
                          : numeroAudiencia === 3
                            ? "Terceira Audiência"
                            : numeroAudiencia === 4
                              ? "Quarta Audiência"
                              : numeroAudiencia === 5
                                ? "Quinta Audiência"
                                : `${numeroAudiencia}ª Audiência`

                      return (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="font-medium">{nomeAudiencia}</Label>
                            <Button variant="ghost" size="sm" onClick={() => removerDataAdicional(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Data</Label>
                              <Input
                                type="date"
                                value={dataAdicional.data}
                                onChange={(e) => atualizarDataAdicional(index, "data", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Descrição</Label>
                              <Input
                                placeholder="Ex: Perícia, Testemunhas..."
                                value={dataAdicional.descricao}
                                onChange={(e) => atualizarDataAdicional(index, "descricao", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={processoAtual.cidade}
                      onChange={(e) => atualizarProcesso("cidade", e.target.value)}
                      placeholder="Digite a cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoAudiencia">Tipo de Audiência *</Label>
                    <Select
                      value={processoAtual.tipoAudiencia}
                      onValueChange={(value: "presencial" | "distancia") => atualizarProcesso("tipoAudiencia", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="distancia">A Distância</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {processoAtual.tipoAudiencia === "distancia" && (
                  <div className="space-y-2">
                    <Label htmlFor="linkAudiencia">Link da Audiência *</Label>
                    <div className="flex gap-2">
                      <LinkIcon className="w-4 h-4 mt-3 text-gray-400" />
                      <Input
                        id="linkAudiencia"
                        value={processoAtual.linkAudiencia || ""}
                        onChange={(e) => atualizarProcesso("linkAudiencia", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Mensagem</h3>
                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem *</Label>
                  <Textarea
                    id="mensagem"
                    value={processoAtual.mensagem}
                    onChange={(e) => atualizarProcesso("mensagem", e.target.value)}
                    placeholder="Descreva a mensagem para a advocacia"
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Checklist</h3>
                <div className="space-y-2">
                  <Label htmlFor="novoItemChecklist">Adicionar Item ao Checklist</Label>
                  <div className="flex gap-2">
                    <Input
                      id="novoItemChecklist"
                      value={novoItemChecklist}
                      onChange={(e) => setNovoItemChecklist(e.target.value)}
                      placeholder="Digite o item do checklist"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          adicionarItemChecklist()
                        }
                      }}
                    />
                    <Button onClick={adicionarItemChecklist} type="button">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  {checklistItems.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Checkbox
                            checked={item.concluido}
                            onCheckedChange={() => toggleItemChecklist(item.id, item.concluido)}
                            className="h-5 w-5"
                          />
                          <span className={`flex-1 ${item.concluido ? "line-through text-gray-500" : "text-gray-900"}`}>
                            {item.texto}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerItemChecklist(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Documentos do Processo
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => document.getElementById("documento-upload")?.click()}
                      disabled={uploadingFile}
                      type="button"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFile ? "Carregando..." : "Adicionar Documento"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => document.getElementById("pasta-upload")?.click()}
                      disabled={uploadingFile}
                      type="button"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      {uploadingFile ? "Carregando..." : "Adicionar Pasta"}
                    </Button>
                  </div>
                  <input
                    id="documento-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUploadJuridico}
                  />
                  <input
                    id="pasta-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUploadJuridico}
                    webkitdirectory=""
                    directory=""
                    multiple
                  />
                  <p className="text-sm text-muted-foreground">
                    Anexe documentos individuais ou uma pasta completa (PDF, JPG, PNG, DOC, DOCX, TXT) - Máx 25 MB por
                    arquivo
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Documentos são sincronizados em tempo real entre todos os usuários
                  </p>

                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="space-y-2 mt-4">
                      {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate">{fileName}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {getDocumentosProcessoAtual().length > 0 && (
                    <div className="space-y-2">
                      <Label>Documentos Anexados ({getDocumentosProcessoAtual().length})</Label>
                      <div className="space-y-2">
                        {(() => {
                          const { folders, individualFiles } = groupDocumentsByFolder(getDocumentosProcessoAtual())

                          return (
                            <>
                              {/* Renderizar pastas */}
                              {Object.entries(folders).map(([folderName, files]) => {
                                const isExpanded = expandedFolders.has(folderName)
                                return (
                                  <div key={folderName} className="border rounded-lg overflow-hidden">
                                    {/* Cabeçalho da pasta */}
                                    <div className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition-colors">
                                      <button
                                        onClick={() => toggleFolder(folderName)}
                                        className="flex items-center gap-2 flex-1 text-left"
                                        type="button"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-blue-600" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-blue-600" />
                                        )}
                                        <FolderOpen className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">{folderName}</span>
                                        <span className="text-sm text-blue-600">
                                          ({files.length} arquivo{files.length !== 1 ? "s" : ""})
                                        </span>
                                      </button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removerPasta(folderName)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>

                                    {/* Lista de arquivos (expandida) */}
                                    {isExpanded && (
                                      <div className="bg-white">
                                        {files.map((file) => (
                                          <div
                                            key={file.id}
                                            className="flex items-center justify-between p-3 border-t hover:bg-gray-50"
                                          >
                                            <a
                                              href={file.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sm text-blue-600 hover:underline truncate flex items-center gap-2"
                                            >
                                              <File className="w-3 h-3 text-gray-400" />
                                              {file.nome}
                                            </a>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removerDocumento(file.id)}
                                              className="ml-2"
                                            >
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                              {/* Renderizar arquivos individuais */}
                              {individualFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline truncate flex items-center gap-2"
                                  >
                                    <File className="w-3 h-3 text-gray-400" />
                                    {file.nome}
                                  </a>
                                  <Button variant="ghost" size="sm" onClick={() => removerDocumento(file.id)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              {processoTemDados(processoAtual!) && (
                <Button variant="destructive" onClick={abrirModalEncerrar}>
                  Encerrar Processo
                </Button>
              )}
              <Button onClick={salvarProcesso}>Salvar Processo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEncerrarModal} onOpenChange={setShowEncerrarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar Processo</DialogTitle>
            <DialogDescription>Informe o valor da finalização do processo para encerrá-lo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valorFinalizacao">Valor da Finalização (R$) *</Label>
              <Input
                id="valorFinalizacao"
                type="text"
                value={valorFinalizacao}
                onChange={(e) => setValorFinalizacao(e.target.value)}
                placeholder="Ex: 5000.00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEncerrarModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={encerrarProcesso}>
              Confirmar Encerramento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVisualizarModal} onOpenChange={setShowVisualizarModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Processo Encerrado - Detalhes Completos</DialogTitle>
          </DialogHeader>

          {processoVisualizando && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Reclamante</Label>
                <p className="text-base font-medium">
                  {funcionarios?.find((f: any) => f.id === processoVisualizando.funcionarioReclamanteId)?.nome ||
                    "Funcionário não encontrado"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reclamadas</Label>
                <div className="space-y-1">
                  {processoVisualizando.reclamadas.map((reclamada, index) => (
                    <p key={index} className="text-base">
                      {reclamada.nome}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Audiência</Label>
                  <p className="text-base">
                    {new Date(processoVisualizando.dataAudiencia).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <p className="text-base">{processoVisualizando.horaAudiencia}</p>
                </div>
              </div>

              {processoVisualizando.datasAdicionais && processoVisualizando.datasAdicionais.length > 0 && (
                <div className="space-y-2">
                  <Label>Datas Adicionais</Label>
                  {processoVisualizando.datasAdicionais.map((data, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium">{data.descricao}</p>
                      <p className="text-sm text-gray-600">{new Date(data.data).toLocaleDateString("pt-BR")}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <p className="text-base">{processoVisualizando.cidade}</p>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Audiência</Label>
                  <p className="text-base">
                    {processoVisualizando.tipoAudiencia === "presencial" ? "Presencial" : "A Distância"}
                  </p>
                </div>
              </div>

              {processoVisualizando.linkAudiencia && (
                <div className="space-y-2">
                  <Label>Link da Audiência</Label>
                  <a
                    href={processoVisualizando.linkAudiencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {processoVisualizando.linkAudiencia}
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <Label>Mensagem</Label>
                <p className="text-base whitespace-pre-wrap">{processoVisualizando.mensagem}</p>
              </div>

              {processoVisualizando.documentos && processoVisualizando.documentos.length > 0 && (
                <div className="space-y-2">
                  <Label>Documentos Anexados ({processoVisualizando.documentos.length})</Label>
                  <div className="space-y-2">
                    {processoVisualizando.documentos.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {typeof doc === "string" ? `Documento ${index + 1}` : doc.name}{" "}
                          {/* Exibindo nome real do arquivo */}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={typeof doc === "string" ? doc : doc.url} target="_blank" rel="noopener noreferrer">
                              {" "}
                              {/* Suporte para ambos formatos */}
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={typeof doc === "string" ? doc : doc.url} download>
                              Baixar
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Valor da Finalização</Label>
                  <p className="text-base font-semibold text-green-600">R$ {processoVisualizando.valorFinalizacao}</p>
                </div>
                <div className="space-y-2">
                  <Label>Data de Encerramento</Label>
                  <p className="text-base">
                    {new Date(processoVisualizando.dataEncerramento).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowVisualizarModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
