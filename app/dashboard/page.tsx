"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarDays, Users, FileText, Calendar, Star, Trophy, ThumbsUp, Plus, X, BarChart3 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useDataEntries, useEmployees, useClientsSuppliers, useAppointments, useGlobalSync } from "@/hooks/use-realtime"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "@/components/ui/use-toast"
import { votacaoOperations, enqueteOperations } from "@/lib/database/operations"

interface Compromisso {
  id: string
  titulo: string
  data: string
  hora: string
  tipo: string
  descricao: string
  responsaveis: string[]
  prioridade: "normal" | "importante"
}

interface Funcionario {
  id: string
  nome: string
  cargo: string
  dataNascimento: string
  cpf?: string
  departamento?: string
  dataAdmissao?: string
  status?: string
  dataLimite?: string
}

interface DataEntry {
  id: string
  type: "rescisao" | "gasto-extra" | "compra-equipamento" | "servico-extra"
  date: string
  value: number
  description?: string
  created_at: string
}

export default function Dashboard() {
  const { data: funcionarios, loading: loadingEmployees } = useEmployees()
  const { data: clients, loading: loadingClients } = useClientsSuppliers()
  const { data: compromissos, loading: loadingAppointments } = useAppointments()
  const { data: dadosInfo, loading: loadingDataEntries } = useDataEntries()
  const { triggerSync } = useGlobalSync()
  const router = useRouter()

  const [alertas, setAlertas] = useState<any[]>([])
  const [selectedAniversariante, setSelectedAniversariante] = useState<Funcionario | null>(null)
  const [showAniversarianteModal, setShowAniversarianteModal] = useState(false)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [totalClients, setTotalClients] = useState(0)
  const [dismissalsThisMonth, setDismissalsThisMonth] = useState(0)
  const [novoCompromisso, setNovoCompromisso] = useState({
    titulo: "",
    data: "",
    hora: "",
    tipo: "",
    descricao: "",
    responsaveis: [] as string[],
    prioridade: "normal" as "normal" | "importante",
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [compromissoExpandido, setCompromissoExpandido] = useState<string | null>(null)
  const [editandoCompromisso, setEditandoCompromisso] = useState<Compromisso | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [turnoverData, setTurnoverData] = useState<any[]>([])
  const [servicosExtrasData, setServicosExtrasData] = useState<any[]>([])
  const [showSecondSemesterTurnover, setShowSecondSemesterTurnover] = useState(false)
  const [showSecondSemesterServices, setShowSecondSemesterServices] = useState(false)
  const [hasActiveAlerts, setHasActiveAlerts] = useState(false)
  const [proximosCompromissosReais, setProximosCompromissosReais] = useState<Compromisso[]>([])
  const [totalDocumentosDrive, setTotalDocumentosDrive] = useState(0)
  const [alertaBackup, setAlertaBackup] = useState(false)
  const [audienciasProximas, setAudienciasProximas] = useState<any[]>([])
  const [hasImportantAppointments, setHasImportantAppointments] = useState(false)

  // Destaques do Mês
  const [destaqueAtual, setDestaqueAtual] = useState<Funcionario | null>(null)
  const [candidatosVotacao, setCandidatosVotacao] = useState<any[]>([])
  const [showAddCandidatosDialog, setShowAddCandidatosDialog] = useState(false)
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<string[]>([])
  const [votosUsuario, setVotosUsuario] = useState<string | null>(null)

  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false)
  const [senhaFinalizar, setSenhaFinalizar] = useState("")
  const [erroSenha, setErroSenha] = useState(false)

  const [enquetesAtivas, setEnquetesAtivas] = useState<any[]>([])
  const [showNovaEnqueteDialog, setShowNovaEnqueteDialog] = useState(false)
  const [novaEnquete, setNovaEnquete] = useState({
    pergunta: "",
    alternativas: ["", ""],
    dataFim: "",
  })
  const [votosEnquetes, setVotosEnquetes] = useState<Record<string, string>>({})

  const obterNomeProximoMes = () => {
    const hoje = new Date()
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
    return (
      proximoMes.toLocaleDateString("pt-BR", { month: "long" }).charAt(0).toUpperCase() +
      proximoMes.toLocaleDateString("pt-BR", { month: "long" }).slice(1)
    )
  }

  const verificarPeriodoVotacao = () => {
    const hoje = new Date()
    const dia = hoje.getDate()
    return dia >= 1 && dia <= 30
  }

  const obterVencedorAtual = () => {
    if (candidatosVotacao.length === 0) return null
    return candidatosVotacao.reduce((prev, current) => (current.votos > prev.votos ? current : prev))
  }

  // Verificar e finalizar votação automaticamente no dia 1
  useEffect(() => {
    const verificarFinalizacaoAutomatica = async () => {
      const hoje = new Date()
      const dia = hoje.getDate()

      // Se é dia 1 e há candidatos, finalizar votação automaticamente
      if (dia === 1 && candidatosVotacao.length > 0) {
        const ultimaFinalizacao = localStorage.getItem("ultima_finalizacao_votacao")
        const mesAtual = `${hoje.getFullYear()}-${hoje.getMonth()}`

        // Verificar se já finalizou este mês
        if (ultimaFinalizacao !== mesAtual) {
          try {
            await finalizarVotacao()
            localStorage.setItem("ultima_finalizacao_votacao", mesAtual)
          } catch (error) {
            console.error("[v0] Erro ao finalizar votação automaticamente:", error)
          }
        }
      }
    }

    verificarFinalizacaoAutomatica()
  }, [candidatosVotacao])

  const verificarElegibilidadeCandidato = async (funcionarioId: string, funcionarioStatus: string) => {
    // Verificar se o status é "Ativo"
    if (funcionarioStatus !== "Ativo") {
      return {
        elegivel: false,
        motivo: `Status inválido: ${funcionarioStatus}. Apenas funcionários com status "Ativo" são elegíveis.`,
      }
    }

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const hoje = new Date()
      const umAnoAtras = new Date()
      umAnoAtras.setFullYear(hoje.getFullYear() - 1)

      const tresMesesAtras = new Date()
      tresMesesAtras.setMonth(hoje.getMonth() - 3)

      // Buscar suspensões nos últimos 12 meses
      const { data: suspensoes, error: errorSuspensoes } = await supabase
        .from("employee_sanctions")
        .select("*")
        .eq("employee_id", funcionarioId)
        .eq("tipo", "Suspensão")
        .gte("data", umAnoAtras.toISOString().split("T")[0])

      if (errorSuspensoes) {
        console.error("[v0] Erro ao buscar suspensões:", errorSuspensoes)
      }

      if (suspensoes && suspensoes.length > 0) {
        return {
          elegivel: false,
          motivo: `Possui ${suspensoes.length} suspensão(ões) nos últimos 12 meses.`,
        }
      }

      // Buscar advertências nos últimos 3 meses
      const { data: advertencias, error: errorAdvertencias } = await supabase
        .from("employee_sanctions")
        .select("*")
        .eq("employee_id", funcionarioId)
        .eq("tipo", "Advertência")
        .gte("data", tresMesesAtras.toISOString().split("T")[0])

      if (errorAdvertencias) {
        console.error("[v0] Erro ao buscar advertências:", errorAdvertencias)
      }

      if (advertencias && advertencias.length > 0) {
        return {
          elegivel: false,
          motivo: `Possui ${advertencias.length} advertência(s) nos últimos 3 meses.`,
        }
      }

      return { elegivel: true, motivo: "" }
    } catch (error) {
      console.error("[v0] Erro ao verificar elegibilidade:", error)
      return { elegivel: false, motivo: "Erro ao verificar elegibilidade" }
    }
  }

  const [elegibilidadeFuncionarios, setElegibilidadeFuncionarios] = useState<
    Record<string, { elegivel: boolean; motivo: string }>
  >({})

  useEffect(() => {
    if (showAddCandidatosDialog && funcionarios) {
      const verificarTodos = async () => {
        const resultados: Record<string, { elegivel: boolean; motivo: string }> = {}

        for (const funcionario of funcionarios) {
          if (funcionario.status !== "Destaque") {
            const resultado = await verificarElegibilidadeCandidato(funcionario.id, funcionario.status || "")
            resultados[funcionario.id] = resultado
          }
        }

        setElegibilidadeFuncionarios(resultados)
      }

      verificarTodos()
    }
  }, [showAddCandidatosDialog, funcionarios])

  useEffect(() => {
    if (candidatosVotacao.length === 0) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Subscrever a mudanças na tabela de sanções
    const channel = supabase
      .channel("sanctions-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "employee_sanctions",
        },
        async (payload) => {
          console.log("[v0] Nova sanção detectada:", payload)

          const sancao = payload.new as any
          const employeeId = sancao.employee_id
          const tipoSancao = sancao.tipo

          // Verificar se é suspensão ou advertência
          if (tipoSancao === "Suspensão" || tipoSancao === "Advertência") {
            // Verificar se o funcionário é um candidato
            const candidato = candidatosVotacao.find((c) => c.id === employeeId)

            if (candidato) {
              console.log("[v0] Candidato recebeu sanção, removendo da votação:", candidato.nome)

              try {
                // Remover candidato da votação
                await votacaoOperations.removerCandidato(employeeId)

                // Mostrar notificação
                toast({
                  title: "Candidato Desqualificado",
                  description: `${candidato.nome} foi excluído da votação de destaque por receber sanção disciplinar dentro do período. Por favor, substitua-o.`,
                  variant: "destructive",
                  duration: 10000,
                })
              } catch (error) {
                console.error("[v0] Erro ao remover candidato:", error)
              }
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [candidatosVotacao])

  const filtrarDadosPorSemestre = (dados: any[], mostrarSegundoSemestre: boolean) => {
    const mesesOrdenados = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

    if (mostrarSegundoSemestre) {
      // Agosto a Dezembro (índices 7-11)
      return dados
        .filter((item) => {
          const mesIndex = mesesOrdenados.indexOf(item.mes?.toLowerCase())
          return mesIndex >= 7 && mesIndex <= 11
        })
        .sort((a, b) => {
          const indexA = mesesOrdenados.indexOf(a.mes?.toLowerCase())
          const indexB = mesesOrdenados.indexOf(b.mes?.toLowerCase())
          return indexA - indexB
        })
    } else {
      // Janeiro a Julho (índices 0-6)
      return dados
        .filter((item) => {
          const mesIndex = mesesOrdenados.indexOf(item.mes?.toLowerCase())
          return mesIndex >= 0 && mesIndex <= 6
        })
        .sort((a, b) => {
          const indexA = mesesOrdenados.indexOf(a.mes?.toLowerCase())
          const indexB = mesesOrdenados.indexOf(b.mes?.toLowerCase())
          return indexA - indexB
        })
    }
  }

  const calcularTurnoverData = (dadosInfo: DataEntry[], funcionarios: any[]) => {
    const mesesData = []
    const hoje = new Date()

    console.log("[v0] Total de registros em dadosInfo:", dadosInfo.length)
    console.log("[v0] Total de funcionários:", funcionarios.length)

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - i)
      const targetMonth = targetDate.getMonth()
      const targetYear = targetDate.getFullYear()

      const demissoesDoMes = dadosInfo.filter((dado) => {
        if (dado.type === "rescisao") {
          const dataRescisao = new Date(dado.date)
          return dataRescisao.getMonth() === targetMonth && dataRescisao.getFullYear() === targetYear
        }
        return false
      })

      if (demissoesDoMes.length > 0) {
        console.log(
          `[v0] Demissões em ${targetDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}:`,
          demissoesDoMes.length,
        )
        console.log(
          "[v0] Detalhes das demissões:",
          demissoesDoMes.map((d) => ({
            id: d.id,
            date: d.date,
            description: d.description,
          })),
        )
      }

      const admissoesDoMes = funcionarios.filter((func: any) => {
        const dataAdmissao = func.data_admissao || func.dataAdmissao || func.hire_date
        if (!dataAdmissao) return false
        const admissaoDate = new Date(dataAdmissao)
        return admissaoDate.getMonth() === targetMonth && admissaoDate.getFullYear() === targetYear
      })

      if (admissoesDoMes.length > 0) {
        console.log(
          `[v0] Admissões em ${targetDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}:`,
          admissoesDoMes.length,
        )
        console.log(
          "[v0] Funcionários admitidos:",
          admissoesDoMes.map((f) => ({
            id: f.id,
            nome: f.nome || f.name,
            data_admissao: f.data_admissao || f.dataAdmissao || f.hire_date,
          })),
        )
      }

      const totalFuncionarios = funcionarios.length || 1
      const turnover = ((admissoesDoMes.length + demissoesDoMes.length) / 2 / totalFuncionarios) * 100

      mesesData.push({
        mes: targetDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        admissoes: admissoesDoMes.length,
        demissoes: demissoesDoMes.length,
        turnover: Number(turnover.toFixed(1)),
      })
    }

    console.log("[v0] Dados de turnover calculados:", mesesData)
    return mesesData
  }

  const calcularServicosExtrasData = (dadosInfo: DataEntry[]) => {
    const mesesData = []

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - i)
      const targetMonth = targetDate.getMonth()
      const targetYear = targetDate.getFullYear()

      const servicosDoMes = dadosInfo.filter((dado) => {
        if (dado.type === "servico-extra") {
          const dataServico = new Date(dado.date)
          return dataServico.getMonth() === targetMonth && dataServico.getFullYear() === targetYear
        }
        return false
      })

      const quantidade = servicosDoMes.length
      const valor = servicosDoMes.reduce((total, servico) => total + servico.value, 0)

      mesesData.push({
        mes: targetDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        quantidade,
        valor,
      })
    }

    return mesesData
  }

  const [compromissosState, setCompromissosState] = useState<Compromisso[]>([])

  useEffect(() => {
    if (!loadingDataEntries && dadosInfo) {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const rescissoesEsteMes = dadosInfo.filter((dado) => {
        if (dado.type === "rescisao") {
          const dataRescisao = new Date(dado.date)
          return dataRescisao.getMonth() === currentMonth && dataRescisao.getFullYear() === currentYear
        }
        return false
      })

      setDismissalsThisMonth(rescissoesEsteMes.length)

      if (!loadingEmployees && funcionarios) {
        const turnoverCalculado = calcularTurnoverData(dadosInfo, funcionarios)
        const servicosCalculado = calcularServicosExtrasData(dadosInfo)

        setTurnoverData(turnoverCalculado)
        setServicosExtrasData(servicosCalculado)
      }
    }
  }, [dadosInfo, loadingDataEntries, funcionarios, loadingEmployees])

  useEffect(() => {
    if (!loadingEmployees && funcionarios) {
      setTotalEmployees(funcionarios.length)
    }
  }, [funcionarios, loadingEmployees])

  useEffect(() => {
    if (!loadingClients && clients) {
      setTotalClients(clients.length)
    }
  }, [clients, loadingClients])

  useEffect(() => {
    if (!loadingAppointments && compromissos) {
      const hoje = new Date()
      const seteDiasFrente = new Date()
      seteDiasFrente.setDate(hoje.getDate() + 7)

      const compromissosProximos = compromissos
        .filter((compromisso: any) => {
          const dataCompromisso = new Date(compromisso.data || compromisso.date)
          return dataCompromisso >= hoje && dataCompromisso <= seteDiasFrente
        })
        .sort((a: any, b: any) => new Date(a.data || a.date).getTime() - new Date(b.data || b.date).getTime())

      setProximosCompromissosReais(compromissosProximos)

      const temImportantes = compromissosProximos.some(
        (c: any) => c.prioridade === "importante" || c.priority === "importante",
      )
      setHasImportantAppointments(temImportantes)

      const umDiaFrente = new Date()
      umDiaFrente.setDate(hoje.getDate() + 1)
      umDiaFrente.setHours(23, 59, 59, 999)

      const audiencias = compromissos
        .filter((compromisso: any) => {
          const dataCompromisso = new Date(compromisso.data || compromisso.date)
          const tipo = compromisso.tipo || compromisso.type
          return tipo === "audiencia" && dataCompromisso >= hoje && dataCompromisso <= umDiaFrente
        })
        .map((audiencia: any) => {
          const dataAudiencia = new Date(audiencia.data || audiencia.date)
          const diffTime = dataAudiencia.getTime() - hoje.getTime()
          const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return {
            ...audiencia,
            diasRestantes,
          }
        })
        .sort((a: any, b: any) => a.diasRestantes - b.diasRestantes)

      setAudienciasProximas(audiencias)
    }
  }, [compromissos, loadingAppointments])

  useEffect(() => {
    if (loadingEmployees || !funcionarios) return

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const alertasTemp: any[] = []

    audienciasProximas.forEach((audiencia) => {
      alertasTemp.push({
        mensagem: `${audiencia.titulo || audiencia.title} - ${new Date(audiencia.data || audiencia.date).toLocaleDateString("pt-BR")} às ${audiencia.hora || audiencia.time}`,
        status: "Audiência",
        dataLimite: audiencia.data || audiencia.date,
        diasRestantes: audiencia.diasRestantes,
        prioridade: 1,
        linkPortalJuridico: true,
      })
    })

    funcionarios.forEach((funcionario: any) => {
      const nome = funcionario.nome || funcionario.name
      const dataLimite = funcionario.data_limite || funcionario.dataLimite

      console.log("[v0] Verificando funcionário:", nome, "Status:", funcionario.status, "Data limite:", dataLimite)

      if (funcionario.status === "Em férias" && dataLimite) {
        const dataLimiteDate = new Date(dataLimite)
        dataLimiteDate.setHours(0, 0, 0, 0)
        const diffTime = dataLimiteDate.getTime() - hoje.getTime()
        const diasRestantes = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        console.log("[v0] Em férias - Dias restantes:", diasRestantes)

        if (diasRestantes >= 0 && diasRestantes <= 5) {
          alertasTemp.push({
            mensagem: `${nome} - Em férias até ${new Date(dataLimite).toLocaleDateString("pt-BR")}`,
            status: "Em férias",
            dataLimite: dataLimite,
            diasRestantes,
            prioridade: 3,
            funcionarioNome: nome,
          })
        }
      }

      if (funcionario.status === "Aviso prévio" && dataLimite) {
        const dataLimiteDate = new Date(dataLimite)
        dataLimiteDate.setHours(0, 0, 0, 0)
        const diffTime = dataLimiteDate.getTime() - hoje.getTime()
        const diasRestantes = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        console.log("[v0] Aviso prévio - Dias restantes:", diasRestantes)

        if (diasRestantes >= 0 && diasRestantes <= 5) {
          alertasTemp.push({
            mensagem: `${nome} - Aviso prévio até ${new Date(dataLimite).toLocaleDateString("pt-BR")}`,
            status: "Aviso prévio",
            dataLimite: dataLimite,
            diasRestantes,
            prioridade: 2,
            funcionarioNome: nome,
          })
        }
      }

      if (funcionario.status === "Em Experiência" && dataLimite) {
        const dataLimiteDate = new Date(dataLimite)
        dataLimiteDate.setHours(0, 0, 0, 0)
        const diffTime = dataLimiteDate.getTime() - hoje.getTime()
        const diasRestantes = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        console.log("[v0] Em Experiência - Dias restantes:", diasRestantes)

        if (diasRestantes >= 0 && diasRestantes <= 5) {
          alertasTemp.push({
            mensagem: `${nome} - Em Experiência até ${new Date(dataLimite).toLocaleDateString("pt-BR")}`,
            status: "Em Experiência",
            dataLimite: dataLimite,
            diasRestantes,
            prioridade: 2,
            funcionarioNome: nome,
          })
        }
      }
    })

    if (alertaBackup) {
      alertasTemp.push({
        mensagem: `Você tem ${totalDocumentosDrive} documentos no Drive. Recomendamos fazer um backup dos seus dados.`,
        status: "Backup",
        dataLimite: new Date().toISOString(),
        diasRestantes: 0,
        prioridade: 4,
      })
    }

    alertasTemp.sort((a, b) => a.prioridade - b.prioridade)

    console.log("[v0] Total de alertas gerados:", alertasTemp.length)
    console.log("[v0] Alertas:", alertasTemp)

    setAlertas(alertasTemp)
    setHasActiveAlerts(alertasTemp.length > 0)
  }, [funcionarios, loadingEmployees, alertaBackup, totalDocumentosDrive, audienciasProximas])

  useEffect(() => {
    try {
      const savedPastas = localStorage.getItem("drive-pastas")
      const savedArquivos = localStorage.getItem("drive-arquivos")

      let totalDocumentos = 0

      if (savedPastas) {
        const pastas = JSON.parse(savedPastas)
        totalDocumentos += pastas.length
        pastas.forEach((pasta: any) => {
          totalDocumentos += pasta.arquivos.length
        })
      }

      if (savedArquivos) {
        const arquivos = JSON.parse(savedArquivos)
        totalDocumentos += arquivos.length
      }

      setTotalDocumentosDrive(totalDocumentos)
      setAlertaBackup(totalDocumentos >= 200)
    } catch (error) {
      console.error("Erro ao carregar dados do drive:", error)
    }
  }, [])

  useEffect(() => {
    if (!loadingEmployees && funcionarios) {
      // Encontrar funcionário com status "Destaque"
      const destaque = funcionarios.find((f: any) => f.status === "Destaque")
      setDestaqueAtual(destaque || null)

      setCandidatosVotacao([])
      setVotosUsuario(null)

      // Subscrever a mudanças em tempo real
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const channel = supabase
        .channel("votacao-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "destaques_votacao",
          },
          () => {
            console.log("[v0] Mudança detectada na votação, recarregando...")
            // Recarregar candidatos se necessário
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [funcionarios, loadingEmployees])

  useEffect(() => {
    const carregarEnquetes = async () => {
      try {
        const enquetes = await enqueteOperations.getAtivas()
        setEnquetesAtivas(enquetes)

        // Verificar votos do usuário
        const userIdentifier = localStorage.getItem("user_identifier") || crypto.randomUUID()
        if (!localStorage.getItem("user_identifier")) {
          localStorage.setItem("user_identifier", userIdentifier)
        }

        const votosMap: Record<string, string> = {}
        for (const enquete of enquetes) {
          const votoId = await enqueteOperations.verificarVoto(enquete.id, userIdentifier)
          if (votoId) {
            votosMap[enquete.id] = votoId
          }
        }
        setVotosEnquetes(votosMap)
      } catch (error) {
        console.error("[v0] Erro ao carregar enquetes:", error)
      }
    }

    carregarEnquetes()

    // Subscrever a mudanças em tempo real
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const channel = supabase
      .channel("enquetes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "enquetes",
        },
        () => {
          console.log("[v0] Mudança detectada nas enquetes, recarregando...")
          carregarEnquetes()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "enquetes_alternativas",
        },
        () => {
          console.log("[v0] Mudança detectada nas alternativas, recarregando...")
          carregarEnquetes()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const adicionarAlternativa = () => {
    if (novaEnquete.alternativas.length < 6) {
      setNovaEnquete({
        ...novaEnquete,
        alternativas: [...novaEnquete.alternativas, ""],
      })
    }
  }

  const removerAlternativa = (index: number) => {
    if (novaEnquete.alternativas.length > 2) {
      setNovaEnquete({
        ...novaEnquete,
        alternativas: novaEnquete.alternativas.filter((_, i) => i !== index),
      })
    }
  }

  const atualizarAlternativa = (index: number, valor: string) => {
    const novasAlternativas = [...novaEnquete.alternativas]
    novasAlternativas[index] = valor
    setNovaEnquete({
      ...novaEnquete,
      alternativas: novasAlternativas,
    })
  }

  const criarEnquete = async () => {
    if (!novaEnquete.pergunta.trim()) {
      alert("Por favor, insira uma pergunta")
      return
    }

    if (!novaEnquete.dataFim) {
      alert("Por favor, selecione a data de término da votação")
      return
    }

    const alternativasValidas = novaEnquete.alternativas.filter((a) => a.trim() !== "")
    if (alternativasValidas.length < 2) {
      alert("Por favor, insira pelo menos 2 alternativas")
      return
    }

    try {
      await enqueteOperations.create({
        pergunta: novaEnquete.pergunta,
        alternativas: alternativasValidas,
        data_fim: novaEnquete.dataFim,
      })

      setNovaEnquete({
        pergunta: "",
        alternativas: ["", ""],
        dataFim: "",
      })
      setShowNovaEnqueteDialog(false)

      toast({
        title: "Enquete Criada",
        description: "A enquete foi criada com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao criar enquete:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar enquete. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const votarEnquete = async (enqueteId: string, alternativaId: string) => {
    if (votosEnquetes[enqueteId]) {
      alert("Você já votou nesta enquete!")
      return
    }

    try {
      const userIdentifier = localStorage.getItem("user_identifier") || crypto.randomUUID()
      if (!localStorage.getItem("user_identifier")) {
        localStorage.setItem("user_identifier", userIdentifier)
      }

      await enqueteOperations.votar(enqueteId, alternativaId, userIdentifier)
      setVotosEnquetes({ ...votosEnquetes, [enqueteId]: alternativaId })

      toast({
        title: "Voto Registrado",
        description: "Seu voto foi registrado com sucesso!",
      })
    } catch (error: any) {
      console.error("[v0] Erro ao votar:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar voto. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const excluirEnquete = async (enqueteId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta enquete? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      await enqueteOperations.delete(enqueteId)

      toast({
        title: "Enquete Excluída",
        description: "A enquete foi excluída com sucesso!",
      })
      // Re-fetch enquetes to update the list
      const updatedEnquetes = await enqueteOperations.getAtivas()
      setEnquetesAtivas(updatedEnquetes)
    } catch (error: any) {
      console.error("[v0] Erro ao excluir enquete:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir enquete. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const adicionarCompromisso = () => {
    if (novoCompromisso.titulo && novoCompromisso.data && novoCompromisso.hora) {
      const compromisso: Compromisso = {
        id: Date.now().toString(),
        ...novoCompromisso,
      }
      setCompromissosState([...compromissosState, compromisso])
      setNovoCompromisso({
        titulo: "",
        data: "",
        hora: "",
        tipo: "",
        descricao: "",
        responsaveis: [],
        prioridade: "normal",
      })
      setDialogOpen(false)
    }
  }

  const adicionarCandidatos = async () => {
    if (funcionariosSelecionados.length !== 3) {
      alert("Você deve selecionar exatamente 3 funcionários para votação")
      return
    }

    try {
      await votacaoOperations.adicionarCandidatos(funcionariosSelecionados)
      setFuncionariosSelecionados([])
      setShowAddCandidatosDialog(false)
      setVotosUsuario(null)

      toast({
        title: "Candidatos Adicionados",
        description: "A votação foi iniciada com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao adicionar candidatos:", error)
      toast({
        title: "Erro",
        description: "Erro ao iniciar votação. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const votarCandidato = async (candidatoId: string) => {
    if (votosUsuario) {
      alert("Você já votou! Só é permitido um voto por usuário.")
      return
    }

    try {
      const userIdentifier = localStorage.getItem("user_identifier") || crypto.randomUUID()
      if (!localStorage.getItem("user_identifier")) {
        localStorage.setItem("user_identifier", userIdentifier)
      }

      await votacaoOperations.votar(candidatoId, userIdentifier)
      setVotosUsuario(candidatoId)

      toast({
        title: "Voto Registrado",
        description: "Seu voto foi registrado com sucesso!",
      })
    } catch (error: any) {
      console.error("[v0] Erro ao votar:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar voto. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const editarCompromisso = () => {
    if (editandoCompromisso) {
      setCompromissosState(compromissosState.map((c) => (c.id === editandoCompromisso.id ? editandoCompromisso : c)))
      setEditandoCompromisso(null)
      setEditDialogOpen(false)
    }
  }

  const removerCompromisso = (id: string) => {
    setCompromissosState(compromissosState.filter((c) => c.id !== id))
  }

  const toggleResponsavel = (responsavel: string, isEdit = false) => {
    if (isEdit && editandoCompromisso) {
      const responsaveis = editandoCompromisso.responsaveis.includes(responsavel)
        ? editandoCompromisso.responsaveis.filter((r) => r !== responsavel)
        : [...editandoCompromisso.responsaveis, responsavel]
      setEditandoCompromisso({ ...editandoCompromisso, responsaveis })
    } else {
      const responsaveis = novoCompromisso.responsaveis.includes(responsavel)
        ? novoCompromisso.responsaveis.filter((r) => r !== responsavel)
        : [...novoCompromisso.responsaveis, responsavel]
      setNovoCompromisso({ ...novoCompromisso, responsaveis })
    }
  }

  const finalizarVotacao = async () => {
    if (candidatosVotacao.length === 0) return

    try {
      const vencedor = await votacaoOperations.finalizarVotacao()

      toast({
        title: "Votação Finalizada",
        description: `${vencedor.employee.nome} foi eleito(a) como Destaque do Mês com ${vencedor.votos} votos!`,
      })

      // Limpar estado local
      setCandidatosVotacao([])
      setVotosUsuario(null)
      setShowFinalizarDialog(false)
      setSenhaFinalizar("")
      setErroSenha(false)
    } catch (error) {
      console.error("[v0] Erro ao finalizar votação:", error)
      toast({
        title: "Erro",
        description: "Erro ao finalizar votação. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleFinalizarComSenha = () => {
    if (senhaFinalizar === "123456789") {
      finalizarVotacao()
    } else {
      setErroSenha(true)
      setTimeout(() => setErroSenha(false), 3000)
    }
  }

  const toggleFuncionarioSelecionado = (id: string) => {
    if (funcionariosSelecionados.includes(id)) {
      setFuncionariosSelecionados(funcionariosSelecionados.filter((fId) => fId !== id))
    } else {
      if (funcionariosSelecionados.length < 3) {
        setFuncionariosSelecionados([...funcionariosSelecionados, id])
      }
    }
  }

  const hoje = new Date()
  const proximosCompromissos = (compromissos || [])
    .filter((c: any) => {
      const dataCompromisso = new Date(c.data || c.date)
      const diffTime = dataCompromisso.getTime() - hoje.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 7
    })
    .sort((a: any, b: any) => new Date(a.data || a.date).getTime() - new Date(b.data || b.date).getTime())

  const calcularAniversariantes = () => {
    if (!funcionarios) return { aniversariantesDoMes: [], aniversariantesDoDia: [] }

    const mesAtual = hoje.getMonth()
    const diaAtual = hoje.getDate()

    const statusPermitidos = ["Ativo", "Em experiência", "Férias", "Em Experiência"]

    const aniversariantesDoMes = funcionarios.filter((funcionario: any) => {
      try {
        // Verificar status do funcionário
        const status = funcionario.status || "Ativo"
        if (!statusPermitidos.includes(status)) {
          return false
        }

        if (!funcionario.dataNascimento && !funcionario.birth_date && !funcionario.data_nascimento) {
          return false
        }

        const dataNasc = funcionario.dataNascimento || funcionario.birth_date || funcionario.data_nascimento

        if (!dataNasc || typeof dataNasc !== "string" || dataNasc.trim() === "") {
          return false
        }

        const [ano, mes, dia] = dataNasc.split("-").map(Number)

        if (isNaN(ano) || isNaN(mes) || isNaN(dia)) {
          return false
        }

        const mesNascimento = mes - 1

        return mesNascimento === mesAtual
      } catch (error) {
        return false
      }
    })

    const aniversariantesDoDia = aniversariantesDoMes.filter((funcionario: any) => {
      try {
        const dataNasc = funcionario.dataNascimento || funcionario.birth_date || funcionario.data_nascimento

        if (!dataNasc || typeof dataNasc !== "string" || dataNasc.trim() === "") {
          return false
        }

        const [ano, mes, dia] = dataNasc.split("-").map(Number)

        if (isNaN(dia)) {
          return false
        }

        return dia === diaAtual
      } catch (error) {
        return false
      }
    })

    return { aniversariantesDoMes, aniversariantesDoDia }
  }

  const { aniversariantesDoMes, aniversariantesDoDia } = calcularAniversariantes()

  const responsaveisDisponiveis = ["Leandro", "Aline", "Diego", "Thiago", "Sabrina", "Simone"]

  const abrirModalAniversariante = (funcionario: Funcionario) => {
    setSelectedAniversariante(funcionario)
    setShowAniversarianteModal(true)
  }

  const fecharModalAniversariante = () => {
    setSelectedAniversariante(null)
    setShowAniversarianteModal(false)
  }

  if (loadingEmployees || loadingClients || loadingDataEntries || loadingAppointments) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl">Dashboard</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{totalEmployees}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">funcionários ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{totalClients}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Demissões Este Mês</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{dismissalsThisMonth}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">rescisões registradas</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-gray-50 transition-colors relative"
          onClick={() => router.push("/agenda")}
        >
          {hasImportantAppointments && (
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded-full animate-pulse shadow-lg" />
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Compromissos Próximos</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{proximosCompromissosReais.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">nos próximos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Alertas - Primeiro */}
        <Card className={alertas.length > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={`flex items-center gap-2 ${alertas.length > 0 ? "text-orange-800" : ""}`}>
                  <CalendarDays className="h-5 w-5" />
                  Alertas
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {alertas.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Nenhum alerta no momento</div>
            ) : (
              <div className="space-y-3">
                {alertas.map((alerta, index) => {
                  const isAlertaCritico =
                    alerta.diasRestantes === 0 &&
                    (alerta.status === "Aviso prévio" || alerta.status === "Em Experiência")

                  const handleClickAlerta = () => {
                    if (alerta.linkPortalJuridico) {
                      router.push("/portal-admissao")
                    } else if (alerta.funcionarioNome) {
                      router.push("/basics")
                    }
                  }

                  return (
                    <div
                      key={index}
                      onClick={handleClickAlerta}
                      className={`p-4 border-l-4 rounded-lg shadow-sm relative ${
                        alerta.status === "Audiência"
                          ? "bg-red-600 border-red-900 animate-pulse cursor-pointer hover:bg-red-700 transition-colors"
                          : isAlertaCritico
                            ? "bg-white border-orange-400 animate-pulse cursor-pointer hover:bg-orange-50 transition-colors"
                            : alerta.funcionarioNome
                              ? "bg-white border-orange-400 cursor-pointer hover:bg-orange-50 transition-colors"
                              : "bg-white border-orange-400"
                      }`}
                    >
                      {isAlertaCritico && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full animate-pulse shadow-lg border-2 border-white" />
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`font-medium text-sm leading-relaxed ${
                              alerta.status === "Audiência" ? "text-white font-bold text-base" : "text-orange-900"
                            }`}
                          >
                            {alerta.mensagem}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                alerta.status === "Audiência"
                                  ? "bg-red-900 text-white font-bold"
                                  : alerta.status === "Em férias"
                                    ? "bg-blue-100 text-blue-800"
                                    : alerta.status === "Aviso prévio"
                                      ? "bg-red-100 text-red-800"
                                      : alerta.status === "Backup"
                                        ? "bg-orange-100 text-orange-800"
                                        : alerta.status === "Em Experiência"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {alerta.status}
                            </span>
                            {alerta.status !== "Backup" && (
                              <span
                                className={`text-xs ${alerta.status === "Audiência" ? "text-white" : "text-gray-600"}`}
                              >
                                até {new Date(alerta.dataLimite).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`text-2xl font-bold ${
                              alerta.status === "Audiência"
                                ? "text-white text-3xl animate-bounce"
                                : alerta.diasRestantes === 0
                                  ? "text-red-600 animate-pulse"
                                  : alerta.diasRestantes <= 2
                                    ? "text-orange-600"
                                    : "text-yellow-600"
                            }`}
                          >
                            {alerta.status === "Backup"
                              ? "⚠️"
                              : alerta.status === "Audiência"
                                ? "⚖️"
                                : alerta.diasRestantes === 0
                                  ? "HOJE"
                                  : `${alerta.diasRestantes}d`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Aniversariantes - Segundo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Aniversariantes
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {aniversariantesDoMes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Nenhum aniversariante este mês</div>
            ) : (
              <div className="space-y-6 max-h-[300px] overflow-y-auto">
                {aniversariantesDoDia.length > 0 && (
                  <div>
                    <h3 className="text-sm text-black mb-4">Aniversariantes de Hoje</h3>
                    <div className="space-y-2">
                      {aniversariantesDoDia.map((funcionario: any) => (
                        <div
                          key={funcionario.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => abrirModalAniversariante(funcionario)}
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{funcionario.nome || funcionario.name}</p>
                            <p className="text-sm text-gray-600">
                              {(() => {
                                const dataNasc =
                                  funcionario.dataNascimento || funcionario.birth_date || funcionario.data_nascimento
                                if (!dataNasc || typeof dataNasc !== "string") return "Data não disponível"
                                const parts = dataNasc.split("-")
                                if (parts.length !== 3) return "Data inválida"
                                const [ano, mes, dia] = parts.map(Number)
                                if (isNaN(ano) || isNaN(mes) || isNaN(dia)) return "Data inválida"
                                return `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}/${ano}`
                              })()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-none animate-pulse mr-2">
                              HOJE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aniversariantesDoMes.filter((f: any) => !aniversariantesDoDia.includes(f)).length > 0 && (
                  <div>
                    <h3 className="text-sm text-black mb-4">Aniversariantes do Mês</h3>
                    <div className="space-y-2">
                      {aniversariantesDoMes
                        .filter((f: any) => !aniversariantesDoDia.includes(f))
                        .sort((a: any, b: any) => {
                          const dateA = new Date(a.dataNascimento || a.birth_date || a.data_nascimento)
                          const dateB = new Date(b.dataNascimento || b.birth_date || b.data_nascimento)
                          return dateA.getDate() - dateB.getDate()
                        })
                        .map((funcionario: any) => (
                          <div
                            key={funcionario.id}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => abrirModalAniversariante(funcionario)}
                          >
                            <div>
                              <p className="font-medium text-gray-800">{funcionario.nome || funcionario.name}</p>
                              <p className="text-sm text-gray-600">
                                {(() => {
                                  const dataNasc =
                                    funcionario.dataNascimento || funcionario.birth_date || funcionario.data_nascimento
                                  if (!dataNasc || typeof dataNasc !== "string") return "Data não disponível"
                                  const parts = dataNasc.split("-")
                                  if (parts.length !== 3) return "Data inválida"
                                  const [ano, mes, dia] = parts.map(Number)
                                  if (isNaN(ano) || isNaN(mes) || isNaN(dia)) return "Data inválida"
                                  return `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}`
                                })()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">
                                {(() => {
                                  const dataNasc =
                                    funcionario.dataNascimento || funcionario.birth_date || funcionario.data_nascimento
                                  if (!dataNasc || typeof dataNasc !== "string") return "Data não disponível"
                                  const parts = dataNasc.split("-")
                                  if (parts.length !== 3) return "Data inválida"
                                  const [ano, mes, dia] = parts.map(Number)
                                  if (isNaN(ano) || isNaN(mes) || isNaN(dia)) return "Data inválida"
                                  return `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}`
                                })()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Turnover - Terceiro */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Turnover de Funcionários</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecondSemesterTurnover(!showSecondSemesterTurnover)}
                className="text-xs"
              >
                {showSecondSemesterTurnover ? "1º Sem" : "2º Sem"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filtrarDadosPorSemestre(turnoverData, showSecondSemesterTurnover)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "turnover") return [`${value}%`, "Turnover"]
                    if (name === "admissoes") return [value, "Admissões"]
                    if (name === "demissoes") return [value, "Demissões"]
                    return [value, name]
                  }}
                />
                <Line type="monotone" dataKey="admissoes" stroke="#10b981" strokeWidth={2} name="Admissões" />
                <Line type="monotone" dataKey="demissoes" stroke="#ef4444" strokeWidth={2} name="Demissões" />
                <Line
                  type="monotone"
                  dataKey="turnover"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Turnover (%)"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* The following Card for "Destaques do Mês" has been updated */}
      <Card className="bg-gradient-to-br from-yellow-50/50 to-orange-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Destaques do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-0 relative">
              <div className="bg-white rounded-l-lg p-6 border-2 border-r-0 border-yellow-300">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  Destaque Atual
                </h3>
                {destaqueAtual ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-800">{destaqueAtual.nome}</p>
                      <p className="text-sm text-gray-600">{destaqueAtual.cargo}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {destaqueAtual.departamento || "Departamento não informado"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-4">
                    Nenhum destaque definido ainda. Inicie uma votação para escolher o próximo destaque!
                  </div>
                )}
              </div>

              <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-yellow-300 transform -translate-x-1/2 z-10" />

              <div className="bg-white rounded-r-lg p-6 border-2 border-l-0 border-yellow-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-orange-600" />
                    Destaque do Próximo Mês
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">{obterNomeProximoMes()}</p>

                {/* Botão de adicionar candidatos */}
                {candidatosVotacao.length === 0 && (
                  <Button
                    onClick={() => setShowAddCandidatosDialog(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 w-full mb-4"
                    disabled={!verificarPeriodoVotacao()}
                  >
                    Adicionar Candidatos
                  </Button>
                )}

                {/* Aviso de período de votação */}
                {!verificarPeriodoVotacao() && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-700">⚠️ Votação disponível apenas do dia 1 ao dia 30 de cada mês</p>
                  </div>
                )}

                {candidatosVotacao.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-8">
                    Nenhuma votação em andamento. Clique em "Adicionar Candidatos" para iniciar.
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-600 py-4">
                    Votação em andamento. O vencedor será revelado após a finalização.
                  </div>
                )}
              </div>
            </div>

            {candidatosVotacao.length > 0 && (
              <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-gray-600" />
                  Votação em Andamento
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  {candidatosVotacao.map((candidato) => {
                    const jaVotou = votosUsuario === candidato.id

                    return (
                      <Card
                        key={candidato.id}
                        className={`transition-all ${
                          jaVotou
                            ? "border-gray-400 bg-gray-50"
                            : verificarPeriodoVotacao() && !votosUsuario
                              ? "hover:border-gray-300 cursor-pointer"
                              : "opacity-60 cursor-not-allowed"
                        }`}
                        onClick={() => verificarPeriodoVotacao() && !votosUsuario && votarCandidato(candidato.id)}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                          <CardTitle className="text-xs sm:text-sm font-medium truncate">{candidato.nome}</CardTitle>
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                            {candidato.votos}
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{candidato.cargo}</p>
                          {jaVotou && (
                            <div className="text-[10px] sm:text-xs text-gray-700 font-medium flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mt-2">
                              <ThumbsUp className="h-3 w-3" />
                              Seu voto
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    onClick={() => setShowFinalizarDialog(true)}
                    variant="outline"
                    className="border-gray-600 text-gray-600 bg-transparent w-full"
                  >
                    Finalizar Votação
                  </Button>

                  {votosUsuario && (
                    <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      ✓ Você já votou! Aguarde o resultado da votação.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Enquetes
            </CardTitle>
            <Button onClick={() => setShowNovaEnqueteDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Enquete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enquetesAtivas.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma enquete ativa no momento. Clique em "Nova Enquete" para criar uma.
            </div>
          ) : (
            <div className="space-y-6">
              {enquetesAtivas.map((enquete) => {
                const jaVotou = !!votosEnquetes[enquete.id]
                const totalVotos = enquete.alternativas.reduce((sum: number, alt: any) => sum + alt.votos, 0)
                const vencedor = enquete.alternativas.reduce(
                  (max: any, alt: any) => (alt.votos > (max?.votos || 0) ? alt : max),
                  null,
                )
                const enqueteEncerrada = !enquete.ativa

                return (
                  <div key={enquete.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg">{enquete.pergunta}</h3>
                      <div className="flex items-center gap-2">
                        {enqueteEncerrada && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Encerrada</span>
                        )}
                        {!enqueteEncerrada && enquete.data_fim && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Termina em {new Date(enquete.data_fim).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <Button
                          onClick={() => excluirEnquete(enquete.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {enquete.alternativas.map((alternativa: any) => {
                        const porcentagem = totalVotos > 0 ? (alternativa.votos / totalVotos) * 100 : 0
                        const votouNesta = votosEnquetes[enquete.id] === alternativa.id
                        const isVencedor = enqueteEncerrada && vencedor?.id === alternativa.id

                        return (
                          <div
                            key={alternativa.id}
                            onClick={() => !jaVotou && !enqueteEncerrada && votarEnquete(enquete.id, alternativa.id)}
                            className={`relative border-2 rounded-lg p-3 transition-all ${
                              isVencedor
                                ? "border-green-500 bg-green-50"
                                : votouNesta
                                  ? "border-blue-500 bg-blue-50"
                                  : jaVotou || enqueteEncerrada
                                    ? "border-gray-200 cursor-default"
                                    : "border-gray-200 hover:border-blue-300 cursor-pointer"
                            }`}
                          >
                            <div
                              className={`absolute inset-0 rounded-lg opacity-30 ${
                                isVencedor ? "bg-green-200" : "bg-blue-100"
                              }`}
                              style={{ width: `${porcentagem}%` }}
                            />
                            <div className="relative flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{alternativa.texto}</span>
                                {isVencedor && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-bold">
                                    🏆 Vencedor
                                  </span>
                                )}
                                {votouNesta && !enqueteEncerrada && (
                                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Seu voto</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 font-medium">{alternativa.votos} votos</span>
                                <span className="text-sm font-semibold text-blue-600">{porcentagem.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 text-sm text-gray-600 text-center">Total de votos: {totalVotos}</div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNovaEnqueteDialog} onOpenChange={setShowNovaEnqueteDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Enquete</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Pergunta</label>
              <Input
                value={novaEnquete.pergunta}
                onChange={(e) => setNovaEnquete({ ...novaEnquete, pergunta: e.target.value })}
                placeholder="Digite a pergunta da enquete"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Data de Término da Votação</label>
              <Input
                type="date"
                value={novaEnquete.dataFim}
                onChange={(e) => setNovaEnquete({ ...novaEnquete, dataFim: e.target.value })}
                className="mt-1"
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-gray-500 mt-1">A enquete será encerrada automaticamente nesta data</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Alternativas</label>
                <Button
                  onClick={adicionarAlternativa}
                  size="sm"
                  variant="outline"
                  disabled={novaEnquete.alternativas.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {novaEnquete.alternativas.map((alternativa, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={alternativa}
                      onChange={(e) => atualizarAlternativa(index, e.target.value)}
                      placeholder={`Alternativa ${index + 1}`}
                    />
                    {novaEnquete.alternativas.length > 2 && (
                      <Button onClick={() => removerAlternativa(index)} size="sm" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Mínimo 2 alternativas, máximo 6</p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={() => {
                setShowNovaEnqueteDialog(false)
                setNovaEnquete({ pergunta: "", alternativas: ["", ""], dataFim: "" })
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={criarEnquete} className="flex-1">
              Criar Enquete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
