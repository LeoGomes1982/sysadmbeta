"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Lock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Landmark,
  Filter,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"
import { useClientsSuppliers } from "@/hooks/use-realtime"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface CashFlowRecord {
  id: string
  tipo: "recebimento" | "despesa"
  categoria: string
  valor: number
  data: string
  descricao?: string
  pago: boolean
  mes_referencia: string
  mes_consolidado: boolean
  parcelado: boolean
  numero_parcelas: number
  parcela_atual: number
  id_parcelamento?: string
  cliente_id?: string // Adicionar campo cliente_id
  forma_pagamento: string // Adicionar campo forma_pagamento
  created_at: string
  empresa: string // Adicionar campo empresa
  funcionario_id?: string // Adicionar campo funcionario_id
  tipo_despesa?: "variavel" | "fixa" | null // Adicionar campo tipo_despesa
  recorrencia_meses?: number | null // Adicionar campo recorrencia_meses
  id_recorrencia?: string | null // Adicionar campo id_recorrencia
  nome?: string // Adicionar campo nome
  banco_pagamento?: string // Adicionar campo banco_pagamento
  banco_registro: string // Adicionar campo banco_registro
}

interface MonthlyBalance {
  id: string
  mes_referencia: string
  saldo_final: number
  consolidado_em: string
  empresa: string // Adicionar campo empresa
}

interface BankBalance {
  id: string
  empresa: string
  banco: string
  data: string
  valor: number
  created_at: string
  updated_at: string
}

const categoriasRecebimento = [
  "Prestação de Serviços",
  "Venda de Produtos",
  "Recebimento de Clientes",
  "Outros Recebimentos",
]

const categoriasDespesa = [
  "Folha de Pagamento",
  "Vale Alimentação", // Mover para o topo para facilitar identificação
  "Fornecedores",
  "Aluguel",
  "Energia Elétrica",
  "Água",
  "Telefone/Internet",
  "Manutenção",
  "Impostos",
  "Outras Despesas",
]

const formasPagamento = ["PIX", "Boleto", "Transferência", "Cartão", "Débito automático"]

export default function CashFlowPage() {
  const [empresaSelecionada, setEmpresaSelecionada] = useState<"GA Serviços" | "Gomes & Guidotti">("GA Serviços")

  const [bancosExpanded, setBancosExpanded] = useState(false)
  const [registrosExpanded, setRegistrosExpanded] = useState(true)

  const bancosConfig = {
    "GA Serviços": [
      {
        nome: "Santander",
        logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R-0kzF8oef50Qmu8GDU2RsIIXadxZf0b.png",
      },
      {
        nome: "Sicoob",
        logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem-destacada-sicoob-PC2GbewpzLOI9OHKjr2vK4DnBb3iqJ.png",
      },
      {
        nome: "Itaú",
        logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Banco-Itau-Logo-New-IWvXumWEIPXlkSsQJ5VtUoQEUm5EF7.png",
      },
      {
        nome: "Assas",
        logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/asaas-1-laGEv5EsVR8tiATF8mtLKu0lzTXmmL.webp",
      },
    ],
    "Gomes & Guidotti": [
      {
        nome: "Santander",
        logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/R-0kzF8oef50Qmu8GDU2RsIIXadxZf0b.png",
      },
      {
        nome: "Sicoob",
        logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem-destacada-sicoob-PC2GbewpzLOI9OHKjr2vK4DnBb3iqJ.png",
      },
      {
        nome: "Itaú",
        logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Banco-Itau-Logo-New-IWvXumWEIPXlkSsQJ5VtUoQEUm5EF7.png",
      },
    ],
  }

  const bancosEmpresa = bancosConfig[empresaSelecionada]

  const [mesVisualizado, setMesVisualizado] = useState("")
  const [mesAtualReal, setMesAtualReal] = useState("") // Mês atual real (hoje)

  useEffect(() => {
    console.log("[v0] Empresa selecionada:", empresaSelecionada)
  }, [empresaSelecionada])

  const [records, setRecords] = useState<CashFlowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false) // Renomeado de dialogOpen
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false) // Renomeado de detailsDialogOpen
  const [selectedRecord, setSelectedRecord] = useState<CashFlowRecord | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<"recebimento" | "despesa">("recebimento")
  const [saldoAnterior, setSaldoAnterior] = useState<MonthlyBalance | null>(null)
  // const [mesAtual, setMesAtual] = useState("") // Removido, substituído por mesVisualizado e mesAtualReal

  const [tipoParcelamento, setTipoParcelamento] = useState<"avista" | "parcelado">("avista")
  const [numeroParcelas, setNumeroParcelas] = useState("1")
  const [showParcelamentoAlert, setShowParcelamentoAlert] = useState(false)
  const [parcelamentoAction, setParcelamentoAction] = useState<"edit" | "delete" | null>(null)
  const [deleteScope, setDeleteScope] = useState<"atual" | "todos">("atual")

  const [tipoDespesa, setTipoDespesa] = useState<"variavel" | "fixa">("variavel")
  const [mesesRecorrencia, setMesesRecorrencia] = useState("1")

  const [clienteId, setClienteId] = useState("")
  const [editClienteId, setEditClienteId] = useState("")

  const [funcionarioId, setFuncionarioId] = useState("")
  const [editFuncionarioId, setEditFuncionarioId] = useState("")
  const [funcionarios, setFuncionarios] = useState<any[]>([])

  const [formaPagamento, setFormaPagamento] = useState("PIX")
  const [editFormaPagamento, setEditFormaPagamento] = useState("PIX")

  const [nome, setNome] = useState("") // Adicionar estado para nome
  const [editNome, setEditNome] = useState("") // Adicionar estado para edição de nome
  const [bancoPagamento, setBancoPagamento] = useState("") // Adicionar estado para banco de pagamento
  const [editBancoPagamento, setEditBancoPagamento] = useState("") // Adicionar estado para edição de banco
  const [bancoRegistro, setBancoRegistro] = useState("") // Banco associado ao registro
  const [editBancoRegistro, setEditBancoRegistro] = useState("") // Banco associado ao registro em edição

  const { data: clientsSuppliers } = useClientsSuppliers()
  const clientes = clientsSuppliers.filter((item: any) => item.type === "cliente")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [bancoSelecionado, setBancoSelecionado] = useState("Santander") // Novo estado para banco selecionado
  const [bancoSaldoDialogOpen, setBancoSaldoDialogOpen] = useState(false)
  const [bancoSaldoNome, setBancoSaldoNome] = useState("")
  const [bancoSaldoData, setBancoSaldoData] = useState(new Date().toISOString().split("T")[0])
  const [bancoSaldoValor, setBancoSaldoValor] = useState("")

  const [bankBalances, setBankBalances] = useState<BankBalance[]>([]) // Removendo estados relacionados à senha de edição de banco
  // const [senhaEdicaoBanco, setSenhaEdicaoBanco] = useState("");
  // const [mostrarSenhaEdicao, setMostrarSenhaEdicao] = useState(false);
  const [bancoParaEditar, setBancoParaEditar] = useState<BankBalance | null>(null)

  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [filtros, setFiltros] = useState({
    nome: "",
    banco: "all",
    tipo: "all",
    tipoDespesa: "all",
    formaPagamento: "all",
    categoria: "all",
    status: "all",
    dataInicio: "",
    dataFim: "",
  })

  const registrosFiltrados = useMemo(() => {
    return records.filter((record) => {
      // Filtro por nome
      if (filtros.nome && !record.nome?.toLowerCase().includes(filtros.nome.toLowerCase())) {
        return false
      }

      // Atualizar filtro por banco para usar banco_registro
      if (filtros.banco && filtros.banco !== "all" && record.banco_registro !== filtros.banco) {
        return false
      }

      if (filtros.tipo && filtros.tipo !== "all" && record.tipo !== filtros.tipo) {
        return false
      }

      if (filtros.tipoDespesa && filtros.tipoDespesa !== "all" && record.tipo_despesa !== filtros.tipoDespesa) {
        return false
      }

      if (
        filtros.formaPagamento &&
        filtros.formaPagamento !== "all" &&
        record.forma_pagamento !== filtros.formaPagamento
      ) {
        return false
      }

      if (filtros.categoria && filtros.categoria !== "all" && record.categoria !== filtros.categoria) {
        return false
      }

      if (filtros.status && filtros.status !== "all") {
        if (filtros.status === "Pendente" && record.pago) return false
        if (filtros.status === "Pago" && record.tipo === "Despesa" && !record.pago) return false
        if (filtros.status === "Recebido" && record.tipo === "Recebimento" && !record.pago) return false
      }

      // Filtro por data início
      if (filtros.dataInicio && new Date(record.data) < new Date(filtros.dataInicio)) {
        return false
      }

      // Filtro por data fim
      if (filtros.dataFim && new Date(record.data) > new Date(filtros.dataFim)) {
        return false
      }

      return true
    })
  }, [records, filtros])

  const limparFiltros = () => {
    setFiltros({
      nome: "",
      banco: "all",
      tipo: "all",
      tipoDespesa: "all",
      formaPagamento: "all",
      categoria: "all",
      status: "all",
      dataInicio: "",
      dataFim: "",
    })
  }

  useEffect(() => {
    loadFuncionarios()
  }, [])

  const loadFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nome, cargo")
        .order("nome", { ascending: true })

      if (error) throw error
      setFuncionarios(data || [])
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error)
    }
  }

  useEffect(() => {
    const hoje = new Date()
    const mesRef = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
    setMesAtualReal(mesRef)
    setMesVisualizado(mesRef) // Inicialmente visualiza o mês atual
    loadRecords(mesRef)
    loadSaldoAnterior(mesRef)
    loadBankBalances() // Carregar saldos dos bancos
  }, [empresaSelecionada]) // Recarregar quando empresa mudar

  const loadSaldoAnterior = async (mesRef: string) => {
    try {
      const [ano, mes] = mesRef.split("-").map(Number)
      const mesAnterior = mes === 1 ? 12 : mes - 1
      const anoAnterior = mes === 1 ? ano - 1 : ano
      const mesAnteriorRef = `${anoAnterior}-${String(mesAnterior).padStart(2, "0")}`

      const { data, error } = await supabase
        .from("cash_flow_monthly_balance")
        .select("*")
        .eq("mes_referencia", mesAnteriorRef)
        .eq("empresa", empresaSelecionada)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar saldo anterior:", error)
      } else if (data) {
        setSaldoAnterior(data)
      } else {
        setSaldoAnterior(null)
      }
    } catch (error) {
      console.error("Erro ao carregar saldo anterior:", error)
    }
  }

  const loadBankBalances = async () => {
    try {
      const { data, error } = await supabase
        .from("bank_balances")
        .select("*")
        .eq("empresa", empresaSelecionada)
        .order("created_at", { ascending: false })

      if (error) throw error
      setBankBalances(data || [])
    } catch (error) {
      console.error("Erro ao carregar saldos dos bancos:", error)
    }
  }

  const navegarMes = (direcao: "anterior" | "proximo") => {
    const [ano, mes] = mesVisualizado.split("-").map(Number)
    let novoMes = mes
    let novoAno = ano

    if (direcao === "anterior") {
      novoMes = mes === 1 ? 12 : mes - 1
      novoAno = mes === 1 ? ano - 1 : ano
    } else {
      novoMes = mes === 12 ? 1 : mes + 1
      novoAno = mes === 12 ? ano + 1 : ano
    }

    const novoMesRef = `${novoAno}-${String(novoMes).padStart(2, "0")}`
    setMesVisualizado(novoMesRef)
    loadRecords(novoMesRef)
    loadSaldoAnterior(novoMesRef)
  }

  const loadRecords = async (mesRef?: string) => {
    try {
      setLoading(true)
      const mesReferencia = mesRef || mesVisualizado

      const { data, error } = await supabase
        .from("cash_flow")
        .select("*")
        .eq("mes_referencia", mesReferencia)
        .eq("empresa", empresaSelecionada)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error("Erro ao carregar registros:", error)
      toast.error("Erro ao carregar registros")
    } finally {
      setLoading(false)
    }
  }

  const [categoria, setCategoria] = useState("")
  const [valor, setValor] = useState("")
  const [data, setData] = useState(new Date().toISOString().split("T")[0])
  const [descricao, setDescricao] = useState("")

  const [editCategoria, setEditCategoria] = useState("")
  const [editValor, setEditValor] = useState("")
  const [editData, setEditData] = useState("")
  const [editDescricao, setEditDescricao] = useState("")

  const formatarValorInput = (value: string) => {
    const apenasNumeros = value.replace(/\D/g, "")
    if (!apenasNumeros) return ""

    const numero = Number.parseInt(apenasNumeros) / 100
    return numero.toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Iniciando salvamento de registro...")
    console.log("[v0] Dados do formulário:", {
      nome,
      categoria,
      valor,
      data,
      formaPagamento,
      tipoSelecionado,
      tipoDespesa,
      tipoParcelamento,
      bancoRegistro, // Adicionar banco_registro ao log
    })

    if (!nome || !categoria || !valor || !data || !formaPagamento || !bancoRegistro) {
      console.log("[v0] Campos obrigatórios faltando")
      toast.error("Preencha todos os campos obrigatórios (incluindo o banco)")
      return
    }

    // Validar cliente quando categoria for "Recebimento de Clientes"
    if (categoria === "Recebimento de Clientes" && !clienteId) {
      toast.error("Selecione um cliente para esta categoria")
      return
    }

    if ((categoria === "Folha de Pagamento" || categoria === "Vale Alimentação") && !funcionarioId) {
      toast.error("Selecione um funcionário para esta categoria")
      return
    }

    if (categoria === "Folha de Pagamento" && !bancoPagamento) {
      toast.error("Selecione um banco para pagamento da folha")
      return
    }

    try {
      console.log("[v0] Tentando salvar no Supabase...")

      if (tipoSelecionado === "despesa" && tipoDespesa === "fixa") {
        const idRecorrencia = crypto.randomUUID()
        const dataPrimeiroRegistro = new Date(data + "T00:00:00")
        const registros = []

        for (let i = 0; i < Number.parseInt(mesesRecorrencia); i++) {
          const dataRegistro = new Date(dataPrimeiroRegistro)
          dataRegistro.setMonth(dataRegistro.getMonth() + i)

          const mesRef = `${dataRegistro.getFullYear()}-${String(dataRegistro.getMonth() + 1).padStart(2, "0")}`
          const dataFormatada = dataRegistro.toISOString().split("T")[0]

          registros.push({
            tipo: tipoSelecionado,
            categoria,
            valor: Number.parseFloat(valor),
            data: dataFormatada,
            descricao: descricao || null,
            pago: false,
            mes_referencia: mesRef,
            mes_consolidado: false,
            parcelado: false,
            numero_parcelas: 1,
            parcela_atual: 1,
            id_parcelamento: null,
            cliente_id: clienteId || null,
            forma_pagamento: formaPagamento,
            empresa: empresaSelecionada,
            funcionario_id: funcionarioId || null,
            tipo_despesa: tipoDespesa,
            recorrencia_meses: Number.parseInt(mesesRecorrencia),
            id_recorrencia: idRecorrencia,
            nome,
            banco_pagamento: bancoPagamento || null,
            banco_registro: bancoRegistro, // Adicionar banco_registro
          })
        }

        const { error } = await supabase.from("cash_flow").insert(registros)
        if (error) {
          console.error("[v0] Erro ao salvar despesa fixa:", error)
          throw error
        }

        console.log("[v0] Despesa fixa salva com sucesso!")
        toast.success(`Despesa fixa cadastrada com sucesso! ${mesesRecorrencia} registros criados.`)
        setIsDialogOpen(false)
        resetForm()
        loadRecords()
        return
      }

      if (tipoParcelamento === "parcelado") {
        const idParcelamento = crypto.randomUUID()
        const valorParcela = Number.parseFloat(valor)
        const dataPrimeiraParcela = new Date(data + "T00:00:00")

        const registros = []
        for (let i = 0; i < Number.parseInt(numeroParcelas); i++) {
          const dataParcela = new Date(dataPrimeiraParcela)
          dataParcela.setMonth(dataParcela.getMonth() + i)

          const mesRef = `${dataParcela.getFullYear()}-${String(dataParcela.getMonth() + 1).padStart(2, "0")}`
          const dataFormatada = dataParcela.toISOString().split("T")[0]

          registros.push({
            tipo: tipoSelecionado,
            categoria,
            valor: valorParcela,
            data: dataFormatada,
            descricao: descricao || null,
            pago: false,
            mes_referencia: mesRef,
            mes_consolidado: false,
            parcelado: true,
            numero_parcelas: Number.parseInt(numeroParcelas),
            parcela_atual: i + 1,
            id_parcelamento: idParcelamento,
            cliente_id: clienteId || null,
            forma_pagamento: formaPagamento,
            empresa: empresaSelecionada,
            funcionario_id: funcionarioId || null,
            tipo_despesa: tipoSelecionado === "despesa" ? tipoDespesa : null,
            recorrencia_meses: null,
            id_recorrencia: null,
            nome,
            banco_pagamento: bancoPagamento || null,
            banco_registro: bancoRegistro,
          })
        }

        const { error } = await supabase.from("cash_flow").insert(registros)
        if (error) {
          console.error("[v0] Erro ao salvar parcelado:", error)
          throw error
        }

        console.log("[v0] Parcelado salvo com sucesso!")
        toast.success(
          `${tipoSelecionado === "recebimento" ? "Recebimento" : "Despesa"} parcelado em ${numeroParcelas}x cadastrado com sucesso!`,
        )
      } else {
        const dataObj = new Date(data + "T00:00:00")
        const mesRef = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, "0")}`

        const { error } = await supabase.from("cash_flow").insert({
          tipo: tipoSelecionado,
          categoria,
          valor: Number.parseFloat(valor),
          data,
          descricao: descricao || null,
          pago: false,
          mes_referencia: mesRef,
          mes_consolidado: false,
          parcelado: false,
          numero_parcelas: 1,
          parcela_atual: 1,
          id_parcelamento: null,
          cliente_id: clienteId || null, // Incluir cliente_id
          forma_pagamento: formaPagamento,
          empresa: empresaSelecionada, // Adicionar empresa
          funcionario_id: funcionarioId || null, // Incluir<bos>id
          tipo_despesa: tipoSelecionado === "despesa" ? tipoDespesa : null, // Adicionar tipo_despesa
          recorrencia_meses: null,
          id_recorrencia: null,
          nome, // Adicionar nome
          banco_pagamento: bancoPagamento || null, // Adicionar banco_pagamento
          banco_registro: bancoRegistro, // Adicionar banco_registro
        })

        if (error) {
          console.error("[v0] Erro ao salvar registro:", error)
          throw error
        }

        console.log("[v0] Registro salvo com sucesso!")
        toast.success(`${tipoSelecionado === "recebimento" ? "Recebimento" : "Despesa"} cadastrado com sucesso!`)
      }

      setIsDialogOpen(false)
      resetForm()
      loadRecords()
    } catch (error) {
      console.error("[v0] Erro completo:", error)
      toast.error("Erro ao salvar registro")
    }
  }

  const handleUpdateWithValidation = async () => {
    if (!selectedRecord) return

    if (selectedRecord.parcelado && selectedRecord.id_parcelamento) {
      // Verificar se há parcelas em meses anteriores ao atual
      const { data: parcelas, error } = await supabase
        .from("cash_flow")
        .select("*")
        .eq("id_parcelamento", selectedRecord.id_parcelamento)
        .lt("mes_referencia", mesAtualReal) // Usar mesAtualReal para comparação
        .eq("empresa", empresaSelecionada) // Adicionar filtro de empresa

      if (error) {
        console.error("Erro ao verificar parcelas:", error)
        toast.error("Erro ao verificar parcelas")
        return
      }

      if (parcelas && parcelas.length > 0) {
        setParcelamentoAction("edit")
        setShowParcelamentoAlert(true)
        return
      }
    }

    // Se não é parcelado ou não há parcelas anteriores, editar normally
    await handleUpdate()
  }

  const handleUpdate = async () => {
    if (!selectedRecord) return

    if (!editNome || !editCategoria || !editValor || !editData || !editFormaPagamento || !editBancoRegistro) {
      toast.error("Preencha todos os campos obrigatórios (incluindo o banco)")
      return
    }

    // Validar cliente quando categoria for "Recebimento de Clientes"
    if (editCategoria === "Recebimento de Clientes" && !editClienteId) {
      toast.error("Selecione um cliente para esta categoria")
      return
    }

    if ((editCategoria === "Folha de Pagamento" || editCategoria === "Vale Alimentação") && !editFuncionarioId) {
      toast.error("Selecione um funcionário para esta categoria")
      return
    }

    if (editCategoria === "Folha de Pagamento" && !editBancoPagamento) {
      toast.error("Selecione um banco para pagamento da folha")
      return
    }

    try {
      const { error } = await supabase
        .from("cash_flow")
        .update({
          nome: editNome, // Adicionar nome
          categoria: editCategoria,
          valor: Number.parseFloat(editValor),
          data: editData,
          descricao: editDescricao || null,
          cliente_id: editClienteId || null, // Incluir cliente_id
          forma_pagamento: editFormaPagamento,
          funcionario_id: editFuncionarioId || null, // Incluir funcionario_id
          banco_pagamento: editBancoPagamento || null, // Adicionar banco_pagamento
          banco_registro: editBancoRegistro, // Adicionar banco_registro
        })
        .eq("id", selectedRecord.id)
        .eq("empresa", empresaSelecionada) // Adicionar filtro de empresa

      if (error) throw error

      toast.success("Registro atualizado com sucesso!")
      setIsDetailsDialogOpen(false)
      setSelectedRecord(null)
      loadRecords()
    } catch (error) {
      console.error("Erro ao atualizar registro:", error)
      toast.error("Erro ao atualizar registro")
    }
  }

  const handleDeleteWithValidation = async () => {
    if (deletePassword !== "123456789") {
      toast.error("Senha incorreta!")
      return
    }

    if (!selectedRecord) return

    if (selectedRecord.parcelado && selectedRecord.id_parcelamento) {
      // Verificar se há parcelas em meses anteriores ao atual
      const { data: parcelas, error } = await supabase
        .from("cash_flow")
        .select("*")
        .eq("id_parcelamento", selectedRecord.id_parcelamento)
        .lt("mes_referencia", mesAtualReal) // Usar mesAtualReal para comparação
        .eq("empresa", empresaSelecionada) // Adicionar filtro de empresa

      if (error) {
        console.error("Erro ao verificar parcelas:", error)
        toast.error("Erro ao verificar parcelas")
        return
      }

      if (parcelas && parcelas.length > 0) {
        setParcelamentoAction("delete")
        setShowParcelamentoAlert(true)
        return
      }
    }

    // Se não é parcelado ou não há parcelas anteriores, excluir normally
    await handleDelete()
  }

  const handleDelete = async () => {
    if (!selectedRecord) return

    try {
      if (selectedRecord.parcelado && selectedRecord.id_parcelamento) {
        // Excluir baseado no escopo escolhido
        if (deleteScope === "atual") {
          // Excluir apenas a parcela atual
          const { error } = await supabase
            .from("cash_flow")
            .delete()
            .eq("id", selectedRecord.id)
            .eq("empresa", empresaSelecionada)
          if (error) throw error
          toast.success("Parcela excluída com sucesso!")
        } else {
          // Excluir do mês atual para frente
          const { error } = await supabase
            .from("cash_flow")
            .delete()
            .eq("id_parcelamento", selectedRecord.id_parcelamento)
            .gte("mes_referencia", mesAtualReal) // Usar mesAtualReal para comparação
            .eq("empresa", empresaSelecionada) // Adicionar filtro de empresa

          if (error) throw error
          toast.success("Parcelas excluídas com sucesso!")
        }
      } else if (selectedRecord.id_recorrencia) {
        // Excluir despesa fixa
        if (deleteScope === "atual") {
          // Excluir apenas o registro atual
          const { error } = await supabase
            .from("cash_flow")
            .delete()
            .eq("id", selectedRecord.id)
            .eq("empresa", empresaSelecionada)
          if (error) throw error
          toast.success("Registro excluído com sucesso!")
        } else {
          // Excluir todos os registros da recorrência
          const { error } = await supabase
            .from("cash_flow")
            .delete()
            .eq("id_recorrencia", selectedRecord.id_recorrencia)
            .eq("empresa", empresaSelecionada)
          if (error) throw error
          toast.success("Registros da recorrência excluídos com sucesso!")
        }
      } else {
        // Excluir registro único
        const { error } = await supabase
          .from("cash_flow")
          .delete()
          .eq("id", selectedRecord.id)
          .eq("empresa", empresaSelecionada)
        if (error) throw error
        toast.success("Registro excluído com sucesso!")
      }

      setIsDetailsDialogOpen(false)
      setShowDeleteConfirm(false)
      setDeletePassword("")
      setSelectedRecord(null)
      setShowParcelamentoAlert(false)
      setDeleteScope("atual")
      loadRecords()
    } catch (error) {
      console.error("Erro ao excluir registro:", error)
      toast.error("Erro ao excluir registro")
    }
  }

  const togglePago = async (record: CashFlowRecord) => {
    try {
      // Atualizar estado local imediatamente (optimistic update)
      const novoStatus = !record.pago
      setRecords((prevRecords) => prevRecords.map((r) => (r.id === record.id ? { ...r, pago: novoStatus } : r)))

      // Atualizar no banco de dados em background
      const { error } = await supabase
        .from("cash_flow")
        .update({ pago: novoStatus })
        .eq("id", record.id)
        .eq("empresa", empresaSelecionada)

      if (error) {
        // Se der erro, reverter a mudança local
        setRecords((prevRecords) => prevRecords.map((r) => (r.id === record.id ? { ...r, pago: !novoStatus } : r)))
        throw error
      }

      toast.success(
        record.pago
          ? "Marcado como não pago"
          : record.tipo === "recebimento"
            ? "Marcado como recebido"
            : "Marcado como pago",
      )

      // O saldo do banco é calculado dinamicamente pela função calcularSaldoBancoComRegistros
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast.error("Erro ao atualizar status")
    }
  }

  // Removido a função updateBankBalance pois o saldo do banco é calculado dinamicamente.

  const abrirModalDetalhes = (record: CashFlowRecord) => {
    console.log("[v0] Abrindo modal de detalhes para o registro:", record)
    console.log("[v0] Dados do registro:", {
      nome: record.nome,
      categoria: record.categoria,
      valor: record.valor,
      data: record.data,
      descricao: record.descricao,
      cliente_id: record.cliente_id,
      forma_pagamento: record.forma_pagamento,
      funcionario_id: record.funcionario_id,
      banco_pagamento: record.banco_pagamento,
      banco_registro: record.banco_registro,
      tipo_despesa: record.tipo_despesa,
      recorrencia_meses: record.recorrencia_meses,
    })

    setSelectedRecord(record)
    setEditNome(record.nome || "") // Carregar nome
    setEditCategoria(record.categoria)
    setEditValor(record.valor.toFixed(2))
    setEditData(record.data)
    setEditDescricao(record.descricao || "")
    setEditClienteId(record.cliente_id || "") // Carregar cliente_id
    setEditFormaPagamento(record.forma_pagamento || "PIX")
    setEditFuncionarioId(record.funcionario_id || "") // Carregar funcionario_id
    setEditBancoPagamento(record.banco_pagamento || "") // Carregar banco_pagamento
    setEditBancoRegistro(record.banco_registro || "") // Restaurar banco_registro

    // Se for uma despesa, carregar o tipo e a recorrência
    if (record.tipo === "despesa") {
      setTipoDespesa(record.tipo_despesa || "variavel")
      setMesesRecorrencia(record.recorrencia_meses ? String(record.recorrencia_meses) : "1")
      // Se for um registro de recorrência, definir o deleteScope para 'todos' por padrão
      if (record.id_recorrencia) {
        setDeleteScope("todos")
      }
    }

    console.log("[v0] Estados definidos:", {
      editNome: record.nome || "",
      editCategoria: record.categoria,
      editValor: record.valor.toFixed(2),
      editData: record.data,
      editDescricao: record.descricao || "",
      editClienteId: record.cliente_id || "",
      editFormaPagamento: record.forma_pagamento || "PIX",
      editFuncionarioId: record.funcionario_id || "",
      editBancoPagamento: record.banco_pagamento || "",
      editBancoRegistro: record.banco_registro || "",
    })

    setShowDeleteConfirm(false)
    setDeletePassword("")
    setIsEditing(false)
    setIsDetailsDialogOpen(true)
  }

  // Função para abrir o modal de status (para ser usada com o Switch)
  const abrirModalStatus = (record: CashFlowRecord) => {
    setSelectedRecord(record)
    setIsDetailsDialogOpen(true)
  }

  const resetForm = () => {
    setTipoSelecionado("recebimento")
    setCategoria("")
    setValor("")
    setData("")
    setDescricao("")
    setClienteId("")
    setFormaPagamento("PIX")
    setFuncionarioId("")
    setTipoDespesa("variavel")
    setMesesRecorrencia("1")
    setTipoParcelamento("avista")
    setNumeroParcelas("2")
    setNome("")
    setBancoPagamento("")
    setBancoRegistro("") // Resetar banco_registro
  }

  const calcularSaldoBancoComRegistros = (nomeBanco: string): number => {
    // Pegar saldo inicial do banco (da tabela bank_balances)
    const saldoInicial = bankBalances.find((b) => b.banco === nomeBanco)
    const saldoBase = saldoInicial ? Number(saldoInicial.valor) : 0

    // Calcular saldo baseado nos registros pagos/recebidos
    const saldoRegistros = records
      .filter((r) => r.banco_registro === nomeBanco && r.pago) // Apenas registros pagos/recebidos deste banco
      .reduce((sum, r) => {
        // Recebimentos somam, despesas subtraem
        return sum + (r.tipo === "recebimento" ? Number(r.valor) : -Number(r.valor))
      }, 0)

    return saldoBase + saldoRegistros
  }

  const getSaldoBanco = (nomeBanco: string): number => {
    return calcularSaldoBancoComRegistros(nomeBanco)
  }

  const getBankIconColor = (nomeBanco: string): string => {
    switch (nomeBanco) {
      case "Santander":
        return "text-red-600"
      case "Sicoob":
        return "text-green-600"
      case "Itaú":
        return "text-orange-600"
      case "Assas":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const calcularTotais = () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Filtrar apenas registros do mês atual para frente
    const [anoAtual, mesAtual] = mesAtualReal.split("-").map(Number)
    const recordsFuturos = records.filter((r) => {
      const [anoReg, mesReg] = r.mes_referencia.split("-").map(Number)
      return anoReg > anoAtual || (anoReg === anoAtual && mesReg >= mesAtual)
    })

    // A receber - Vencidos (data < hoje e não pago)
    const aReceberVencidos = recordsFuturos
      .filter((r) => {
        const dataReg = new Date(r.data + "T00:00:00")
        return r.tipo === "recebimento" && !r.pago && dataReg < hoje
      })
      .reduce((sum, r) => sum + Number(r.valor), 0)

    // A receber - Vencem hoje (data = hoje e não pago)
    const aReceberHoje = recordsFuturos
      .filter((r) => {
        const dataReg = new Date(r.data + "T00:00:00")
        return r.tipo === "recebimento" && !r.pago && dataReg.getTime() === hoje.getTime()
      })
      .reduce((sum, r) => sum + Number(r.valor), 0)

    // A pagar - Vencidos (data < hoje e não pago)
    const aPagarVencidos = recordsFuturos
      .filter((r) => {
        const dataReg = new Date(r.data + "T00:00:00")
        return r.tipo === "despesa" && !r.pago && dataReg < hoje
      })
      .reduce((sum, r) => sum + Number(r.valor), 0)

    // A pagar - Vencem hoje (data = hoje e não pago)
    const aPagarHoje = recordsFuturos
      .filter((r) => {
        const dataReg = new Date(r.data + "T00:00:00")
        return r.tipo === "despesa" && !r.pago && dataReg.getTime() === hoje.getTime()
      })
      .reduce((sum, r) => sum + Number(r.valor), 0)

    // Saldo (apenas registros efetivados do mês visualizado)
    const totalRecebimentos = records
      .filter((r) => r.tipo === "recebimento" && r.pago)
      .reduce((sum, r) => sum + Number(r.valor), 0)

    const totalDespesas = records
      .filter((r) => r.tipo === "despesa" && r.pago)
      .reduce((sum, r) => sum + Number(r.valor), 0)

    const saldoMesVisualizado = totalRecebimentos - totalDespesas

    const somaSaldosBancos = bankBalances.reduce((sum, b) => sum + Number(b.valor), 0)
    const saldoComAnterior = saldoMesVisualizado + (saldoAnterior?.saldo_final || 0) + somaSaldosBancos

    const saldoDia = records
      .filter((r) => {
        const dataReg = new Date(r.data + "T00:00:00")
        return r.pago && dataReg.getTime() === hoje.getTime()
      })
      .reduce((sum, r) => {
        return sum + (r.tipo === "recebimento" ? Number(r.valor) : -Number(r.valor))
      }, 0)

    return {
      aReceberVencidos,
      aReceberHoje,
      aPagarVencidos,
      aPagarHoje,
      saldo: saldoComAnterior,
      saldoDia,
    }
  }

  const { aReceberVencidos, aReceberHoje, aPagarVencidos, aPagarHoje, saldo, saldoDia } = calcularTotais()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return String(date.getDate()).padStart(2, "0")
  }

  const formatMonth = (mesRef: string) => {
    const [ano, mes] = mesRef.split("-")
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return `${meses[Number.parseInt(mes) - 1]} de ${ano}`
  }

  const getNomeMesVisualizado = () => {
    const [ano, mes] = mesVisualizado.split("-")
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return meses[Number.parseInt(mes) - 1]
  }

  const getClienteName = (clienteId?: string) => {
    if (!clienteId) return null
    const cliente = clientes.find((c: any) => c.id === clienteId)
    return cliente?.name || null
  }

  const getFuncionarioName = (funcionarioId?: string) => {
    if (!funcionarioId) return null
    const funcionario = funcionarios.find((f: any) => f.id === funcionarioId)
    return funcionario?.nome || null
  }

  const cancelEdit = () => {
    if (selectedRecord) {
      setEditNome(selectedRecord.nome || "") // Restaurar nome
      setEditCategoria(selectedRecord.categoria)
      setEditValor(selectedRecord.valor.toFixed(2))
      setEditData(selectedRecord.data)
      setEditDescricao(selectedRecord.descricao || "")
      setEditClienteId(selectedRecord.cliente_id || "")
      setEditFormaPagamento(selectedRecord.forma_pagamento || "PIX")
      setEditFuncionarioId(selectedRecord.funcionario_id || "") // Restaurar funcionario_id
      setEditBancoPagamento(selectedRecord.banco_pagamento || "") // Restaurar banco_pagamento
      setEditBancoRegistro(selectedRecord.banco_registro || "") // Restaurar banco_registro
      // Restaurar tipo de despesa e meses de recorrência
      if (selectedRecord.tipo === "despesa") {
        setTipoDespesa(selectedRecord.tipo_despesa || "variavel")
        setMesesRecorrencia(selectedRecord.recorrencia_meses ? String(selectedRecord.recorrencia_meses) : "1")
      }
    }
    setIsEditing(false)
  }

  const bancos = [
    // Novo array de bancos
    { nome: "Santander", logo: "🏦" },
    { nome: "Sicoob", logo: "🏦" },
    { nome: "Itaú", logo: "🏦" },
    { nome: "Assas", logo: "💳" },
  ]

  const abrirModalSaldoBanco = (nomeBanco: string) => {
    // Verificar se já existe saldo para este banco
    const saldoExistente = bankBalances.find((b) => b.banco === nomeBanco)

    if (saldoExistente) {
      // Se já existe saldo, pedir senha para editar
      // setBancoParaEditar(saldoExistente);
      // setMostrarSenhaEdicao(true);
      // Removendo a chamada de senha de edição de banco
      setBancoSaldoNome(saldoExistente.banco)
      setBancoSaldoData(saldoExistente.data)
      setBancoSaldoValor(saldoExistente.valor.toFixed(2))
      setBancoSaldoDialogOpen(true)
      setBancoParaEditar(saldoExistente)
    } else {
      // Se não existe saldo, abrir modal para adicionar
      setBancoSaldoNome(nomeBanco)
      setBancoSaldoData(new Date().toISOString().split("T")[0])
      setBancoSaldoValor("")
      setBancoSaldoDialogOpen(true)
    }
  }

  // const verificarSenhaEdicao = () => {
  //   if (senhaEdicaoBanco !== "987654321") {
  //     toast.error("Senha incorreta!");
  //     return;
  //   }

  //   if (bancoParaEditar) {
  //     setBancoSaldoNome(bancoParaEditar.banco);
  //     setBancoSaldoData(bancoParaEditar.data);
  //     setBancoSaldoValor(bancoParaEditar.valor.toFixed(2));
  //     setMostrarSenhaEdicao(false);
  //     setSenhaEdicaoBanco("");
  //     setBancoSaldoDialogOpen(true);
  //   }
  // };

  const salvarSaldoBanco = async () => {
    if (!bancoSaldoValor || !bancoSaldoData) {
      toast.error("Preencha todos os campos")
      return
    }

    try {
      const valorNumerico = Number.parseFloat(bancoSaldoValor)

      if (bancoParaEditar) {
        // Atualizar saldo existente
        const { error } = await supabase
          .from("bank_balances")
          .update({
            data: bancoSaldoData,
            valor: valorNumerico,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bancoParaEditar.id)
          .eq("empresa", empresaSelecionada)

        if (error) throw error
        toast.success(`Saldo do banco ${bancoSaldoNome} atualizado com sucesso!`)
      } else {
        // Inserir novo saldo
        const { error } = await supabase.from("bank_balances").insert({
          empresa: empresaSelecionada,
          banco: bancoSaldoNome,
          data: bancoSaldoData,
          valor: valorNumerico,
        })

        if (error) throw error
        toast.success(`Saldo do banco ${bancoSaldoNome} adicionado com sucesso!`)
      }

      setBancoSaldoDialogOpen(false)
      setBancoSaldoValor("")
      setBancoParaEditar(null)
      loadBankBalances()
    } catch (error) {
      console.error("Erro ao salvar saldo do banco:", error)
      toast.error("Erro ao salvar saldo do banco")
    }
  }

  // Função para alterar o status do registro (para ser usada com o Switch)
  const alterarStatusRegistro = async (id: string, novoStatus: string) => {
    const registroAtual = records.find((r) => r.id === id)
    if (!registroAtual) return

    const isPago = novoStatus === "Pago" || novoStatus === "Recebido"

    try {
      const { error } = await supabase
        .from("cash_flow")
        .update({ pago: isPago })
        .eq("id", id)
        .eq("empresa", empresaSelecionada)

      if (error) throw error

      toast.success(
        isPago
          ? registroAtual.tipo === "recebimento"
            ? "Marcado como recebido"
            : "Marcado como pago"
          : "Marcado como pendente",
      )
      loadRecords()
    } catch (error) {
      console.error("Erro ao alterar status do registro:", error)
      toast.error("Erro ao alterar status do registro")
    }
  }

  // const scrollContainerRef = useRef<HTMLDivElement>(null)
  // const scrollPositionRef = useRef<number>(0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Fluxo de Caixa</CardTitle>
        </CardHeader>
      </Card>

      <div className="flex justify-start">
        <Tabs
          value={empresaSelecionada}
          onValueChange={(v) => setEmpresaSelecionada(v as any)}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="GA Serviços"
              className="data-[state=inactive]:opacity-40 data-[state=inactive]:text-muted-foreground"
            >
              GA Serviços
            </TabsTrigger>
            <TabsTrigger
              value="Gomes & Guidotti"
              className="data-[state=inactive]:opacity-40 data-[state=inactive]:text-muted-foreground"
            >
              Gomes & Guidotti
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-2 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(aReceberVencidos)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vencidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-lime-600">{formatCurrency(aReceberHoje)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vencem hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">A Pagar</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-orange-600">{formatCurrency(aPagarVencidos)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vencidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">A Pagar</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-orange-600">{formatCurrency(aPagarHoje)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vencem hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{formatCurrency(saldo)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">saldo atual</p>
          </CardContent>
        </Card>
      </div>

      {saldoAnterior && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Fluxo de caixa de {formatMonth(saldoAnterior.mes_referencia)}
                  </p>
                  <p className="text-xs text-blue-700">Saldo consolidado</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(saldoAnterior.saldo_final)}</p>
                <Badge className="bg-blue-600 hover:bg-blue-700">Consolidado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registros do Mês</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="rounded-none">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl">Adicionar Registro</DialogTitle>
                  <DialogDescription>Preencha os dados do registro financeiro</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Registro *</Label>
                    <Input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Pagamento fornecedor X, Recebimento cliente Y"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Registro *</Label>
                    <Select
                      value={tipoSelecionado}
                      onValueChange={(value) => {
                        setTipoSelecionado(value as "recebimento" | "despesa")
                        setCategoria("")
                        setClienteId("") // Limpa o cliente ao mudar o tipo
                        setFuncionarioId("") // Limpa o funcionário ao mudar o tipo
                        setTipoDespesa("variavel") // Resetar tipo de despesa ao mudar tipo
                        setBancoPagamento("") // Limpar banco ao mudar tipo
                        setBancoRegistro("") // Limpar banco_registro ao mudar tipo
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recebimento">Recebimento</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoSelecionado === "despesa" && (
                    <div className="space-y-2">
                      <Label>Tipo de Despesa *</Label>
                      <RadioGroup value={tipoDespesa} onValueChange={(v) => setTipoDespesa(v as any)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="variavel" id="variavel" />
                          <Label htmlFor="variavel" className="font-normal cursor-pointer">
                            Variável
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixa" id="fixa" />
                          <Label htmlFor="fixa" className="font-normal cursor-pointer">
                            Fixa
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {tipoSelecionado === "despesa" && tipoDespesa === "fixa" && (
                    <div className="space-y-2">
                      <Label>Até quantos meses haverá o registro? *</Label>
                      <Select value={mesesRecorrencia} onValueChange={setMesesRecorrencia}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {Array.from({ length: 48 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num} {num === 1 ? "mês" : "meses"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Serão criados {mesesRecorrencia} registros mensais a partir da data inicial
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={categoria}
                      onValueChange={(value) => {
                        setCategoria(value)
                        if (value !== "Folha de Pagamento" && value !== "Vale Alimentação") {
                          setFuncionarioId("")
                        }
                        if (value !== "Folha de Pagamento") {
                          setBancoPagamento("") // Limpar banco se não for folha
                        }
                        // Limpa banco_registro se a categoria não for folha de pagamento
                        if (value !== "Folha de Pagamento") {
                          setBancoRegistro("")
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tipoSelecionado === "recebimento" ? categoriasRecebimento : categoriasDespesa).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoSelecionado === "despesa" &&
                    (categoria === "Folha de Pagamento" || categoria === "Vale Alimentação") && (
                      <div className="space-y-2">
                        <Label>Funcionário *</Label>
                        <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o funcionário" />
                          </SelectTrigger>
                          <SelectContent>
                            {funcionarios.map((funcionario: any) => (
                              <SelectItem key={funcionario.id} value={funcionario.id}>
                                {funcionario.nome} - {funcionario.cargo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {funcionarios.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Nenhum funcionário cadastrado. Cadastre funcionários na página Gestão de Funcionários.
                          </p>
                        )}
                      </div>
                    )}

                  {tipoSelecionado === "despesa" && categoria === "Folha de Pagamento" && (
                    <div className="space-y-2">
                      <Label>Banco para Pagamento *</Label>
                      <Select value={bancoPagamento} onValueChange={setBancoPagamento}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {bancosEmpresa.map((banco) => (
                            <SelectItem key={banco.nome} value={banco.nome}>
                              {banco.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {tipoSelecionado === "recebimento" && categoria === "Recebimento de Clientes" && (
                    <div className="space-y-2">
                      <Label>Cliente *</Label>
                      <Select value={clienteId} onValueChange={setClienteId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente: any) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {clientes.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Nenhum cliente cadastrado. Cadastre clientes na página Clientes e Fornecedores.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Forma de Pagamento *</Label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento.map((forma) => (
                          <SelectItem key={forma} value={forma}>
                            {forma}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!(tipoSelecionado === "despesa" && tipoDespesa === "fixa") && (
                    <>
                      <div className="space-y-2">
                        <Label>Parcelamento *</Label>
                        <RadioGroup value={tipoParcelamento} onValueChange={(v) => setTipoParcelamento(v as any)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="avista" id="avista" />
                            <Label htmlFor="avista" className="font-normal cursor-pointer">
                              À vista
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="parcelado" id="parcelado" />
                            <Label htmlFor="parcelado" className="font-normal cursor-pointer">
                              Parcelado
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {tipoParcelamento === "parcelado" && (
                        <div className="space-y-2">
                          <Label>Número de Parcelas *</Label>
                          <Select value={numeroParcelas} onValueChange={setNumeroParcelas}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                                <SelectItem key={num} value={String(num)}>
                                  {num}x
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>
                      {tipoSelecionado === "despesa" && tipoDespesa === "fixa"
                        ? "Data do Primeiro Registro *"
                        : tipoParcelamento === "parcelado"
                          ? "Data da Primeira Parcela *"
                          : "Data *"}
                    </Label>
                    <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="text"
                      value={valor}
                      onChange={(e) => setValor(formatarValorInput(e.target.value))}
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Banco *</Label>
                    <Select value={bancoRegistro} onValueChange={setBancoRegistro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {bancosEmpresa.map((banco) => (
                          <SelectItem key={banco.nome} value={banco.nome}>
                            {banco.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Banco onde o valor será creditado (recebimento) ou debitado (despesa)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Informações adicionais sobre o registro"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar Registro</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => navegarMes("anterior")} className="rounded-none">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Mês Anterior
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-semibold">{formatMonth(mesVisualizado)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navegarMes("proximo")} className="rounded-none">
              Próximo Mês
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full mt-4 rounded-none bg-transparent">
                <Filter className="mr-2 h-4 w-4" />
                {filtrosAbertos ? "Ocultar Filtros" : "Mostrar Filtros"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 p-4 border rounded-md bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro por Nome */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-nome">Nome</Label>
                  <Input
                    id="filtro-nome"
                    placeholder="Buscar por nome..."
                    value={filtros.nome}
                    onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-banco">Banco</Label>
                  <Select value={filtros.banco} onValueChange={(value) => setFiltros({ ...filtros, banco: value })}>
                    <SelectTrigger id="filtro-banco">
                      <SelectValue placeholder="Todos os bancos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os bancos</SelectItem>
                      <SelectItem value="Santander">Santander</SelectItem>
                      <SelectItem value="Sicoob">Sicoob</SelectItem>
                      <SelectItem value="Itaú">Itaú</SelectItem>
                      <SelectItem value="Assas">Assas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Tipo */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-tipo">Tipo</Label>
                  <Select value={filtros.tipo} onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}>
                    <SelectTrigger id="filtro-tipo">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="recebimento">Recebimento</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Tipo de Despesa */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-tipo-despesa">Tipo de Despesa</Label>
                  <Select
                    value={filtros.tipoDespesa}
                    onValueChange={(value) => setFiltros({ ...filtros, tipoDespesa: value })}
                  >
                    <SelectTrigger id="filtro-tipo-despesa">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="fixa">Fixa</SelectItem>
                      <SelectItem value="variavel">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Forma de Pagamento */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-forma-pagamento">Forma de Pagamento</Label>
                  <Select
                    value={filtros.formaPagamento}
                    onValueChange={(value) => setFiltros({ ...filtros, formaPagamento: value })}
                  >
                    <SelectTrigger id="filtro-forma-pagamento">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Débito automático">Débito automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Categoria */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-categoria">Categoria</Label>
                  <Select
                    value={filtros.categoria}
                    onValueChange={(value) => setFiltros({ ...filtros, categoria: value })}
                  >
                    <SelectTrigger id="filtro-categoria">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {[...categoriasRecebimento, ...categoriasDespesa].map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Status */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-status">Status</Label>
                  <Select value={filtros.status} onValueChange={(value) => setFiltros({ ...filtros, status: value })}>
                    <SelectTrigger id="filtro-status">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Recebido">Recebido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Data Início */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-data-inicio">Data Início</Label>
                  <Input
                    id="filtro-data-inicio"
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  />
                </div>

                {/* Filtro por Data Fim */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-data-fim">Data Fim</Label>
                  <Input
                    id="filtro-data-fim"
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  />
                </div>
              </div>

              {/* Botão Limpar Filtros */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={limparFiltros} className="rounded-none bg-transparent">
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando registros...</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableBody>
                  <TableRow
                    className="bg-muted/50 hover:bg-muted cursor-pointer"
                    onClick={() => setBancosExpanded(!bancosExpanded)}
                  >
                    <TableCell colSpan={7} className="font-bold">
                      <div className="flex items-center gap-2">
                        {bancosExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        Bancos
                      </div>
                    </TableCell>
                  </TableRow>

                  {bancosExpanded &&
                    bancos.map((banco) => (
                      <TableRow
                        key={`banco-${banco.nome}`}
                        className="bg-blue-50 hover:bg-blue-100 border-b-2 cursor-pointer"
                        onClick={() => abrirModalSaldoBanco(banco.nome)}
                      >
                        <TableCell colSpan={2}>
                          <div className="flex items-center gap-2">
                            <Landmark className={`h-4 w-4 ${getBankIconColor(banco.nome)}`} />
                            <span className="font-semibold text-sm">{banco.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                        <TableCell colSpan={2} className="text-right">
                          <span
                            className={`text-sm font-semibold ${getSaldoBanco(banco.nome) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(getSaldoBanco(banco.nome))}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}

                  <TableRow
                    className="bg-muted/50 hover:bg-muted cursor-pointer"
                    onClick={() => setRegistrosExpanded(!registrosExpanded)}
                  >
                    <TableCell colSpan={7} className="font-bold">
                      <div className="flex items-center gap-2">
                        {registrosExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        Registros
                      </div>
                    </TableCell>
                  </TableRow>

                  {registrosExpanded &&
                    registrosFiltrados.map((record: any) => {
                      const isToday = new Date(record.data + "T00:00:00").toDateString() === new Date().toDateString()
                      const isPendente = !record.pago
                      const shouldPulse = isToday && isPendente

                      return (
                        <TableRow
                          key={record.id}
                          className={`border-b hover:bg-muted/50 cursor-pointer ${
                            shouldPulse ? "animate-pulse-red" : ""
                          }`}
                          onClick={() => abrirModalDetalhes(record)} // Corrigindo onClick para chamar abrirModalDetalhes em vez de abrirModalStatus
                        >
                          <TableCell className="text-xs md:text-sm">
                            {format(new Date(record.data + "T00:00:00"), "dd")}
                          </TableCell>
                          <TableCell>
                            <Badge className="rounded-none bg-black text-white hover:bg-black flex items-center gap-1 w-24 justify-center">
                              {record.tipo === "recebimento" ? (
                                <>
                                  <ArrowUp className="h-3 w-3 text-green-500" />
                                  Entradas
                                </>
                              ) : (
                                <>
                                  <ArrowDown className="h-3 w-3 text-red-500" />
                                  Saídas
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell colSpan={2}>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs md:text-sm">{record.nome || "-"}</span>
                              {record.parcelado && (
                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                  Parcela {record.parcela_atual} de {record.numero_parcelas}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell colSpan={1}></TableCell>
                          <TableCell className="text-right text-xs md:text-sm">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(record.valor)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={record.pago}
                              onCheckedChange={(checked) => {
                                // Prevenir propagação do evento para não abrir o modal
                                togglePago(record)
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              className={`h-5 ${
                                record.tipo === "recebimento"
                                  ? "data-[state=checked]:bg-green-500"
                                  : "data-[state=checked]:bg-red-500"
                              }`}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Detalhes do Registro</DialogTitle>
            <DialogDescription>
              {isEditing ? "Edite as informações do registro" : "Visualize as informações do registro"}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Registro *</Label>
                <Input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Ex: Pagamento fornecedor X"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Registro</Label>
                <div className="flex items-center gap-2">
                  <Badge className="rounded-none bg-black text-white hover:bg-black flex items-center gap-1">
                    {selectedRecord.tipo === "recebimento" ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-500" />
                        Entradas
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-500" />
                        Saídas
                      </>
                    )}
                  </Badge>
                  {selectedRecord.parcelado && (
                    <Badge variant="outline" className="rounded-none">
                      Parcela {selectedRecord.parcela_atual} de {selectedRecord.numero_parcelas}
                    </Badge>
                  )}
                  {selectedRecord.tipo_despesa === "fixa" && (
                    <Badge variant="secondary" className="rounded-none">
                      Fixa ({selectedRecord.recorrencia_meses} meses)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={editCategoria}
                  onValueChange={(value) => {
                    setEditCategoria(value)
                    if (value !== "Folha de Pagamento" && value !== "Vale Alimentação") {
                      setEditFuncionarioId("")
                    }
                    if (value !== "Folha de Pagamento") {
                      setEditBancoPagamento("") // Limpar banco se não for folha
                    }
                    // Limpa banco_registro se a categoria não for folha de pagamento
                    if (value !== "Folha de Pagamento") {
                      setEditBancoRegistro("")
                    }
                  }}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedRecord.tipo === "recebimento" ? categoriasRecebimento : categoriasDespesa).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRecord.tipo === "despesa" &&
                (editCategoria === "Folha de Pagamento" || editCategoria === "Vale Alimentação") && (
                  <div className="space-y-2">
                    <Label>Funcionário *</Label>
                    <Select value={editFuncionarioId} onValueChange={setEditFuncionarioId} disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.map((funcionario: any) => (
                          <SelectItem key={funcionario.id} value={funcionario.id}>
                            {funcionario.nome} - {funcionario.cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {selectedRecord.tipo === "despesa" && editCategoria === "Folha de Pagamento" && (
                <div className="space-y-2">
                  <Label>Banco para Pagamento *</Label>
                  <Select value={editBancoPagamento} onValueChange={setEditBancoPagamento} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {bancosEmpresa.map((banco) => (
                        <SelectItem key={banco.nome} value={banco.nome}>
                          {banco.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedRecord.tipo === "recebimento" && editCategoria === "Recebimento de Clientes" && (
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={editClienteId} onValueChange={setEditClienteId} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente: any) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={editFormaPagamento} onValueChange={setEditFormaPagamento} disabled={!isEditing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent>
                    {formasPagamento.map((forma) => (
                      <SelectItem key={forma} value={forma}>
                        {forma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mostrar campo Tipo de Despesa e meses de recorrência apenas se for despesa e editável */}
              {selectedRecord.tipo === "despesa" && isEditing && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Despesa *</Label>
                    <RadioGroup value={tipoDespesa} onValueChange={(v) => setTipoDespesa(v as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="variavel" id="edit-variavel" />
                        <Label htmlFor="edit-variavel" className="font-normal cursor-pointer">
                          Variável
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixa" id="edit-fixa" />
                        <Label htmlFor="edit-fixa" className="font-normal cursor-pointer">
                          Fixa
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {tipoDespesa === "fixa" && (
                    <div className="space-y-2">
                      <Label>Até quantos meses haverá o registro? *</Label>
                      <Select value={mesesRecorrencia} onValueChange={setMesesRecorrencia}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {Array.from({ length: 48 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num} {num === 1 ? "mês" : "meses"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Serão criados {mesesRecorrencia} registros mensais a partir da data inicial
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="text"
                  value={editValor}
                  onChange={(e) => setEditValor(formatarValorInput(e.target.value))}
                  placeholder="0,00"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Banco *</Label>
                <Select value={editBancoRegistro} onValueChange={setEditBancoRegistro} disabled={!isEditing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancosEmpresa.map((banco) => (
                      <SelectItem key={banco.nome} value={banco.nome}>
                        {banco.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  placeholder="Informações adicionais sobre o registro"
                  disabled={!isEditing}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Status de Pagamento</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedRecord.pago}
                    onCheckedChange={() => togglePago(selectedRecord)}
                    disabled={!isEditing} // Desabilitar switch se não estiver editando
                    className={
                      selectedRecord.pago
                        ? selectedRecord.tipo === "recebimento"
                          ? "data-[state=checked]:bg-green-600"
                          : "data-[state=checked]:bg-red-600"
                        : ""
                    }
                  />
                  <span className="text-sm">
                    {selectedRecord.pago ? (selectedRecord.tipo === "recebimento" ? "Recebido" : "Pago") : "Pendente"}
                  </span>
                </div>
              </div>

              {!isEditing && !showDeleteConfirm && (
                <div className="pt-4 border-t">
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Registro
                  </Button>
                </div>
              )}

              {showDeleteConfirm && (
                <div className="pt-4 border-t space-y-3">
                  {/* Definir escopo de exclusão apenas se for parcelado ou recorrência */}
                  {(selectedRecord.parcelado || selectedRecord.id_recorrencia) && (
                    <div className="space-y-2">
                      <Label>Escopo da Exclusão</Label>
                      <RadioGroup value={deleteScope} onValueChange={(v) => setDeleteScope(v as any)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="atual" id="delete-atual" />
                          <Label htmlFor="delete-atual" className="font-normal cursor-pointer">
                            Apenas este registro
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="todos" id="delete-todos" />
                          <Label htmlFor="delete-todos" className="font-normal cursor-pointer">
                            Todos os registros relacionados
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Digite a senha para confirmar exclusão</Label>
                    <Input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Digite a senha"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleDeleteWithValidation()
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Senha necessária para excluir o registro</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeletePassword("")
                        setDeleteScope("atual") // Resetar escopo ao cancelar
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteWithValidation} className="flex-1">
                      Confirmar Exclusão
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                {!isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDetailsDialogOpen(false)
                        setShowDeleteConfirm(false)
                        setDeletePassword("")
                        setDeleteScope("atual")
                        setIsEditing(false)
                      }}
                    >
                      Fechar
                    </Button>
                    <Button onClick={() => setIsEditing(true)}>Editar</Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancelar Edição
                    </Button>
                    <Button onClick={handleUpdateWithValidation}>Salvar Alterações</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showParcelamentoAlert} onOpenChange={setShowParcelamentoAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Atenção: Registro Parcelado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Devido aos caixas anteriores fechados, a {parcelamentoAction === "edit" ? "edição" : "exclusão"} de
                dados parcelados pode ser feita apenas do mês atual para frente.
              </p>
              <p className="font-medium">
                {parcelamentoAction === "edit"
                  ? "A edição será aplicada apenas a esta parcela."
                  : "Deseja excluir apenas o mês atual ou dali para frente?"}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowParcelamentoAlert(false)
                setParcelamentoAction(null)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowParcelamentoAlert(false)
                if (parcelamentoAction === "edit") {
                  handleUpdate()
                } else {
                  handleDelete()
                }
                setParcelamentoAction(null)
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de senha removido */}

      <Dialog open={bancoSaldoDialogOpen} onOpenChange={setBancoSaldoDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {bancoParaEditar ? "Editar" : "Adicionar"} Saldo - {bancoSaldoNome}
            </DialogTitle>
            <DialogDescription>
              {bancoParaEditar
                ? `Saldo atual: ${formatCurrency(bancoParaEditar.valor)}. Defina o novo saldo do banco.`
                : "Informe a data e o valor inicial do saldo do banco"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={bancoSaldoData} onChange={(e) => setBancoSaldoData(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Novo Saldo (R$) *</Label>
              <Input
                type="text"
                value={bancoSaldoValor}
                onChange={(e) => setBancoSaldoValor(formatarValorInput(e.target.value))}
                placeholder="0,00"
                required
              />
              {bancoParaEditar && (
                <p className="text-xs text-muted-foreground">
                  Digite o novo saldo total do banco (não é um valor a adicionar/subtrair)
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBancoSaldoDialogOpen(false)
                  setBancoParaEditar(null)
                }}
              >
                Cancelar
              </Button>
              <Button onClick={salvarSaldoBanco}>{bancoParaEditar ? "Atualizar" : "Salvar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
