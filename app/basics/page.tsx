"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Eye,
  Edit,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Upload,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Circle,
} from "lucide-react"
import { employeeOperations } from "@/lib/database/operations"
import {
  useEmployees,
  useEmployeeDependents,
  useEmployeeHistory,
  useGlobalSync,
  useClientsSuppliers,
  useRealtimeData,
} from "@/hooks/use-realtime"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast" // Import toast

interface Funcionario {
  id?: string
  nome: string
  cpf: string
  rg?: string
  cargo: string
  departamento: string
  empresa?: string
  rgOrgaoEmissor?: string
  rgUf?: string
  rgDataExpedicao?: string
  sexo?: string
  raca?: string
  nomePai?: string
  nomeMae?: string
  nacionalidade?: string
  grauInstrucao?: string
  estadoCivil?: string
  nomeConjuge?: string
  pis?: string
  ctpsNumero?: string
  ctpsSerie?: string
  ctpsUf?: string
  cnhNumero?: string
  cnhCategoria?: string
  cnhDataVencimento?: string
  pensaoAlimenticia?: boolean | string
  pensaoAlimenticiaValor?: string | null
  pensaoAlimenticiaConta?: string
  dataAfastamento?: string
  motivoAfastamento?: string
  cep?: string
  rua?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  funcao: string
  cargaHoraria?: string
  horarioTrabalho?: string
  reemprego?: boolean | string
  tipoContrato?: string
  utilizaValeTransporte?: boolean | string
  quantidadeValeTransporte?: number | null | string
  nivel: string
  dataAdmissao: string
  dataNascimento?: string
  salario?: string | null
  telefone?: string
  email?: string
  endereco?: string
  observacoes?: string
  status: string
  dataLimite?: string
  dataDemissao?: string
  motivoDemissao?: string
  destaqueInicio?: string
  destaqueFim?: string
  destaqueCount?: number
  ultimoDestaque?: string
  pontuacaoGeral?: number
  points?: number // Campo para o valor direto do banco de dados
}

interface Dependente {
  id: number
  funcionarioId: number
  nome: string
  cpf: string
  parentesco: string
  dataNascimento: string
  telefone?: string // Removido do insert, mas mantido na interface para consistência
  observacoes?: string // Removido do insert, mas mantido na interface para consistência
  arquivos?: string[] // Mantido para compatibilidade, mas agora usa birth_certificate_url no Supabase
  birth_certificate_url?: string // Novo campo para URL da certidão
}

interface Documento {
  id: number
  funcionarioId: number
  tipoDocumento: string
  numeroDocumento: string
  dataEmissao: string
  dataVencimento?: string
  arquivo?: string
  file_url?: string
}

interface HistoricoEvento {
  id: string // Changed to string as UUID is used
  employee_id: string // Changed to string as it's an employee ID
  tipo?: string // Keeping for backward compatibility, but event_type is preferred
  event_type?: string // New field for event type
  data: string
  descricao: string
  observacoes?: string // Removido no <updates>
}

const StatusModal = ({
  showStatusModal,
  setShowStatusModal,
  tempStatus,
  setTempStatus,
  salvarStatus,
  selectedFuncionario,
  funcionarios,
  calcularPontuacaoGeral,
}) => {
  if (!showStatusModal) return null

  // Função para selecionar e salvar o status automaticamente
  const selecionarESalvarStatus = async (novoStatus: string) => {
    setTempStatus(novoStatus)
    // Aguarda um momento para o estado ser atualizado
    setTimeout(async () => {
      await salvarStatus()
      setShowStatusModal(false)
    }, 100)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Alterar Status</h3>
        <p className="text-sm text-muted-foreground mb-4">Selecione o novo status para {selectedFuncionario?.nome}</p>
        <div className="space-y-2">
          <button
            onClick={() => selecionarESalvarStatus("Ativo")}
            className="w-full p-3 text-left rounded border hover:bg-green-50 hover:border-green-300 transition-colors"
          >
            <div className="font-medium">Ativo</div>
            <div className="text-sm text-muted-foreground">Funcionário em atividade normal</div>
          </button>
          <button
            onClick={() => selecionarESalvarStatus("Em férias")}
            className="w-full p-3 text-left rounded border hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="font-medium">Em férias</div>
            <div className="text-sm text-muted-foreground">Funcionário em período de férias (será solicitada data)</div>
          </button>
          <button
            onClick={() => selecionarESalvarStatus("Aviso prévio")}
            className="w-full p-3 text-left rounded border hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <div className="font-medium">Aviso prévio</div>
            <div className="text-sm text-muted-foreground">Funcionário em aviso prévio (será solicitada data)</div>
          </button>
          <button
            onClick={() => selecionarESalvarStatus("Em Experiência")}
            className="w-full p-3 text-left rounded border hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
          >
            <div className="font-medium">Em Experiência</div>
            <div className="text-sm text-muted-foreground">
              Funcionário em período de experiência (será solicitada data)
            </div>
          </button>
          {/* ... existing code ... */}
          <button
            onClick={() => selecionarESalvarStatus("Em Afastamento")}
            className="w-full p-3 text-left rounded border hover:bg-orange-50 hover:border-orange-300 transition-colors"
          >
            <div className="font-medium">Em Afastamento</div>
            <div className="text-sm text-muted-foreground">
              Funcionário em afastamento (será solicitada data e motivo)
            </div>
          </button>
          {/* ... existing code ... */}
          <button
            onClick={() => selecionarESalvarStatus("Destaque")}
            className="w-full p-3 text-left rounded border hover:bg-purple-50 hover:border-purple-300 transition-colors"
          >
            <div className="font-medium">Destaque</div>
            <div className="text-sm text-muted-foreground">Funcionário em destaque por 30 dias</div>
          </button>
          <button
            onClick={() => selecionarESalvarStatus("INATIVO")}
            className="w-full p-3 text-left rounded border hover:bg-gray-200 hover:border-gray-400 transition-colors"
          >
            <div className="font-medium">INATIVO</div>
            <div className="text-sm text-muted-foreground">Funcionário demitido (será solicitada data e motivo)</div>
          </button>
        </div>
        {/* ... existing code ... */}
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowStatusModal(false)} className="w-full">
            Cancelar
          </Button>
        </div>

        {/* The logic for showing these fields should likely be in the main component or handled by salvarStatus directly */}
        {/* For now, this modal doesn't directly use the 'funcionario' state from the main component. */}
        {/* The handling for 'Em Afastamento' should ideally trigger a separate modal or flow */}
        {/* If the intention is to show fields *within* this modal, it needs access to 'funcionario' and its setters. */}
        {/* Given the structure, the best place for this conditional logic is likely after selecting 'Em Afastamento' from the buttons above, which would then trigger a different modal or flow. */}
      </div>
    </div>
  )
}

// Adicionando modal de exclusão
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, senha, setSenha }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
        <p className="mb-4">Tem certeza que deseja excluir este funcionário? Esta ação é irreversível.</p>
        <div className="space-y-3">
          <Label htmlFor="senhaExclusao">Digite a senha para confirmar</Label>
          <Input
            id="senhaExclusao"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha de exclusão"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="destructive" onClick={onConfirm} disabled={senha !== "123456789"}>
            Excluir
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

const calcularTemAlerta = (funcionario: any) => {
  console.log("[v0] Verificando alerta para:", funcionario.nome)
  console.log("[v0] Status:", funcionario.status)
  console.log("[v0] dataLimite:", funcionario.dataLimite)
  console.log("[v0] data_limite:", (funcionario as any).data_limite)

  // Verificar ambos os nomes de campo (dataLimite e data_limite)
  const dataLimiteValue = funcionario.dataLimite || (funcionario as any).data_limite

  if (!dataLimiteValue) {
    console.log("[v0] Sem data limite, sem alerta")
    return false
  }

  if (!["Em férias", "Aviso prévio", "Em Experiência"].includes(funcionario.status)) {
    console.log("[v0] Status não requer alerta")
    return false
  }

  const hoje = new Date()
  const dataLimite = new Date(dataLimiteValue)
  const diffTime = dataLimite.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  console.log("[v0] Dias até expiração:", diffDays)
  console.log("[v0] Tem alerta?", diffDays <= 5 && diffDays >= 0)

  return diffDays <= 5 && diffDays >= 0
}

const getStatusPulseColor = (status: string) => {
  switch (status) {
    case "Em férias":
      return "bg-blue-50 border-blue-300"
    case "Aviso prévio":
      return "bg-red-50 border-red-300"
    case "Em Experiência":
      return "bg-yellow-50 border-yellow-300"
    case "Em Afastamento":
      return "bg-orange-50 border-orange-300"
    default:
      return "bg-red-50 border-red-300"
  }
}

export default function GestaoFuncionarios() {
  const { data: funcionarios, loading, setData: setFuncionarios } = useEmployees()
  const { data: dependentes, setData: setDependentes } = useEmployeeDependents()
  // const { data: historico, setData: setHistorico } = useEmployeeHistory() // Original line
  const { data: clientesFornecedores, loading: loadingClients } = useClientsSuppliers()

  const { data: allHistoricos } = useRealtimeData("employee_history")
  const { data: allSancoes } = useRealtimeData("employee_sanctions")
  const { data: allAvaliacoes } = useRealtimeData("employee_evaluations")
  const { data: allFiscalizacoes } = useRealtimeData("employee_inspections")

  // Ensure historico state is initialized and can be updated
  const { data: historicoData, setData: setHistorico } = useRealtimeData("employee_history")

  // Initializing state for employee updates
  const [atualizacoes, setAtualizacoes] = useState<any[]>([])
  const [novaAtualizacao, setNovaAtualizacao] = useState({
    data: new Date().toISOString().split("T")[0],
    texto: "",
  })

  // Function to add an update
  const adicionarAtualizacao = async () => {
    if (!selectedFuncionario && !editMode) {
      toast({ title: "Erro", description: "Selecione um funcionário primeiro." })
      return
    }
    const funcionarioId = funcionario.id || selectedFuncionario?.id
    if (!funcionarioId) {
      toast({ title: "Erro", description: "ID do funcionário não encontrado." })
      return
    }
    if (!novaAtualizacao.data || !novaAtualizacao.texto) {
      toast({ title: "Erro", description: "Preencha a data e a descrição da atualização." })
      return
    }

    try {
      const { data, error } = await supabase.from("employee_updates").insert([
        {
          employee_id: funcionarioId,
          update_date: novaAtualizacao.data,
          update_text: novaAtualizacao.texto,
        },
      ])
      if (error) throw error
      setAtualizacoes([...atualizacoes, data[0]]) // Add to local state
      setNovaAtualizacao({ data: new Date().toISOString().split("T")[0], texto: "" }) // Clear form
      toast({ title: "Sucesso", description: "Atualização adicionada com sucesso." })
      await triggerSync()
    } catch (err) {
      toast({ title: "Erro", description: `Falha ao adicionar atualização: ${err.message}`, variant: "destructive" })
    }
  }

  // Function to remove an update
  const removerAtualizacao = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover esta atualização?")) return

    try {
      const { error } = await supabase.from("employee_updates").delete().eq("id", id)
      if (error) throw error
      setAtualizacoes(atualizacoes.filter((a) => a.id !== id)) // Remove from local state
      toast({ title: "Sucesso", description: "Atualização removida com sucesso." })
      await triggerSync()
    } catch (err) {
      toast({ title: "Erro", description: `Falha ao remover atualização: ${err.message}`, variant: "destructive" })
    }
  }

  useEffect(() => {
    console.log("[v0] ===== DADOS CARREGADOS PARA CÁLCULO DE PONTUAÇÃO =====")
    console.log("[v0] Total de sanções:", allSancoes?.length || 0)
    console.log("[v0] Sanções completas:", JSON.stringify(allSancoes, null, 2))
    console.log("[v0] Total de avaliações:", allAvaliacoes?.length || 0)
    console.log("[v0] Total de fiscalizações:", allFiscalizacoes?.length || 0)
    console.log("[v0] Total de históricos:", allHistoricos?.length || 0)
  }, [allSancoes, allAvaliacoes, allFiscalizacoes, allHistoricos])

  // useEffect para lidar com o carregamento inicial de clientes e fornecedores
  useEffect(() => {
    if (!loadingClients && clientesFornecedores) {
      // O código aqui pode ser usado para processar clientesFornecedores após o carregamento
      // Por exemplo, inicializar algum estado com base nesses dados
    }
  }, [clientesFornecedores, loadingClients])

  const triggerSync = useGlobalSync().triggerSync // Renomeado para evitar conflito
  const supabase = createClient()
  const { toast } = useToast() // Initialize toast

  const [view, setView] = useState<"list" | "form" | "details">("list")
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)
  const [editMode, setEditMode] = useState(false)

  const { data: dependentesData } = useEmployeeDependents(selectedFuncionario?.id?.toString() || "")
  const { data: historicosData } = useEmployeeHistory(selectedFuncionario?.id?.toString() || "") // This fetches history for the selected employee only
  const [documentosData, setDocumentosData] = useState<any[]>([])

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [tempStatus, setTempStatus] = useState("")

  const [showDateModal, setShowDateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [statusComData, setStatusComData] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [departamentoFilter, setDepartamentoFilter] = useState("")
  const [empresaFilter, setEmpresaFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Estados para o modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState<any>(null)
  const [senhaExclusao, setSenhaExclusao] = useState("")

  const [statusModalAberto, setStatusModalAberto] = useState(false)
  const [funcionarioStatusSelecionado, setFuncionarioStatusSelecionado] = useState<any>(null)

  // --- Novas variáveis de estado para o modal de data limite inline ---
  const [mostrarModalDataLimite, setMostrarModalDataLimite] = useState(false)
  const [dataLimite, setDataLimite] = useState("")
  const [statusSelecionado, setStatusSelecionado] = useState("") // Para armazenar o status selecionado antes de abrir o modal de data

  const [mostrarModalDemissao, setMostrarModalDemissao] = useState(false)
  const [dataDemissao, setDataDemissao] = useState("")
  const [motivoDemissao, setMotivoDemissao] = useState("")

  // --- Início das mudanças para o modal de demissão rápido ---
  const [mostrarModalDemissaoRapido, setMostrarModalDemissaoRapido] = useState(false)
  const [dataDemissaoModal, setDataDemissaoModal] = useState("")
  const [motivoDemissaoModal, setMotivoDemissaoModal] = useState("")

  const confirmarDemissaoModal = async () => {
    if (!selectedFuncionario || !dataDemissaoModal || !motivoDemissaoModal) {
      toast({
        title: "Erro",
        description: "Preencha a data e o motivo da demissão.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("[v0] Confirmando demissão...")
      console.log("[v0] Funcionário:", selectedFuncionario.nome)
      console.log("[v0] Data demissão:", dataDemissaoModal)
      console.log("[v0] Motivo:", motivoDemissaoModal)

      const updates: any = {
        status: "INATIVO",
        updated_at: new Date().toISOString(),
      }

      // Atualizar no Supabase
      const { error } = await supabase.from("employees").update(updates).eq("id", selectedFuncionario.id)

      if (error) {
        console.error("[v0] Erro ao atualizar status INATIVO:", error)
        throw error
      }

      console.log("[v0] Status INATIVO salvo com sucesso!")

      // Atualizar estado local
      const funcionariosAtualizados = funcionarios.map((f: any) =>
        f.id === selectedFuncionario.id ? { ...f, ...updates } : f,
      )
      setFuncionarios(funcionariosAtualizados)
      setSelectedFuncionario({ ...selectedFuncionario, ...updates })

      // Disparar sincronização global
      await triggerSync()

      toast({
        title: "Status atualizado",
        description: "Funcionário marcado como INATIVO com sucesso.",
      })

      setMostrarModalDemissaoRapido(false)
      setDataDemissaoModal("")
      setMotivoDemissaoModal("")
      setShowStatusModal(false) // Fechar o modal de status principal também
      setTempStatus("")
    } catch (error: any) {
      console.error("[v0] Erro ao salvar demissão:", error)
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      })
    }
  }
  // --- Fim das mudanças para o modal de demissão rápido ---

  const selecionarStatus = (status: string) => {
    setStatusSelecionado(status) // Armazena o status para usar no modal inline

    if (status === "INATIVO") {
      setMostrarModalDemissao(true)
      setFuncionario({ ...funcionario, status: status })
    } else if (status === "Em Férias" || status === "Aviso prévio" || status === "Em Experiência") {
      setMostrarModalDataLimite(true) // Exibe o modal de data limite
      setFuncionario({ ...funcionario, status: status }) // Atualiza o status do funcionário
    } else {
      setFuncionario({ ...funcionario, status: status }) // Atualiza o status do funcionário
      setMostrarModalDataLimite(false) // Garante que o modal de data esteja oculto se não for necessário
      setMostrarModalDemissao(false)
    }
  }

  const confirmarDataLimite = () => {
    if (!dataLimite) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione uma data limite",
        variant: "destructive",
      })
      return
    }
    setFuncionario({ ...funcionario, dataLimite: dataLimite, status: statusSelecionado }) // Atualiza o funcionário com data limite e status
    setMostrarModalDataLimite(false)
    setDataLimite("")
    setStatusSelecionado("") // Limpa o status selecionado
  }

  const confirmarDemissao = () => {
    if (!dataDemissao || !motivoDemissao.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, preencha a data da demissão e o motivo",
        variant: "destructive",
      })
      return
    }
    setFuncionario({
      ...funcionario,
      status: "INATIVO",
      dataDemissao: dataDemissao,
      motivoDemissao: motivoDemissao,
    })
    setMostrarModalDemissao(false)
    setDataDemissao("")
    setMotivoDemissao("")
    setStatusSelecionado("")
  }

  useEffect(() => {
    // Carregar documentos ainda do localStorage (até migrar para Supabase)
    const savedDocumentos = localStorage.getItem("sysathos_documentos")
    if (savedDocumentos) {
      setDocumentosData(JSON.parse(savedDocumentos))
    }
  }, [])

  const saveToSupabase = async (funcionariosAtualizados: any[]) => {
    try {
      for (const funcionario of funcionariosAtualizados) {
        const { error } = await supabase.from("employees").upsert({
          id: funcionario.id,
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          funcao: funcionario.funcao,
          nivel: funcionario.nivel,
          data_admissao: funcionario.dataAdmissao,
          data_nascimento: funcionario.dataNascimento,
          salario: funcionario.salario,
          telefone: funcionario.telefone,
          email: funcionario.email,
          endereco: funcionario.endereco,
          observacoes: funcionario.observacoes,
          status: funcionario.status,
          data_limite: funcionario.dataLimite,
          rg: funcionario.rg,
          rg_orgao_emissor: funcionario.rgOrgaoEmissor,
          rg_uf: funcionario.rgUf,
          rg_data_expedicao: funcionario.rgDataExpedicao,
          sexo: funcionario.sexo,
          raca: funcionario.raca,
          nome_pai: funcionario.nomePai,
          nome_mae: funcionario.nomeMae,
          nacionalidade: funcionario.nacionalidade,
          grau_instrucao: funcionario.grauInstrucao,
          estado_civil: funcionario.estadoCivil,
          nome_conjuge: funcionario.nomeConjuge,
          pis: funcionario.pis,
          ctps_numero: funcionario.ctpsNumero,
          ctps_serie: funcionario.ctpsSerie,
          ctps_uf: funcionario.ctpsUf,
          cnh_numero: funcionario.cnhNumero,
          cnh_categoria: funcionario.cnhCategoria,
          cnh_data_vencimento: funcionario.cnhDataVencimento,
          cep: funcionario.cep,
          carga_horaria: funcionario.cargaHoraria,
          horario_trabalho: funcionario.horarioTrabalho,
          reemprego: funcionario.reemprego === true ? true : funcionario.reemprego === false ? false : null,
          tipoContrato: funcionario.tipoContrato,
          utilizaValeTransporte:
            funcionario.utilizaValeTransporte === true
              ? true
              : funcionario.utilizaValeTransporte === false
                ? false
                : null,
          quantidadeValeTransporte:
            funcionario.quantidadeValeTransporte !== null && funcionario.quantidadeValeTransporte !== ""
              ? Number(funcionario.quantidadeValeTransporte)
              : null,
          empresa: funcionario.empresa,
          departamento: funcionario.departamento,
          cargo: funcionario.cargo,
          // Adicionando a atualização do campo 'points' aqui, se necessário
          // points: funcionario.points,

          // Adicionando campos de endereço separados
          rua: funcionario.rua,
          numero: funcionario.numero,
          complemento: funcionario.complemento,
          bairro: funcionario.bairro,
          cidade: funcionario.cidade,
          estado: funcionario.estado,

          // Saving alimony fields
          pensao_alimenticia: funcionario.pensaoAlimenticia === true || funcionario.pensaoAlimenticia === "true",
          pensao_alimenticia_valor: funcionario.pensaoAlimenticiaValor,
          pensao_alimenticia_conta: funcionario.pensaoAlimenticiaConta,

          // Saving leave fields
          data_afastamento: funcionario.dataAfastamento,
          motivo_afastamento: funcionario.motivoAfastamento,
        })

        if (error) {
          console.error("Erro ao salvar funcionário:", error)
        }
      }

      // Disparar sincronização global
      triggerSync()
    } catch (error) {
      console.error("Erro ao salvar no Supabase:", error)
    }
  }

  const [funcionario, setFuncionario] = useState<Funcionario>({
    id: 0, // Default ID, will be updated if editing
    nome: "",
    cpf: "",
    rg: "",
    rgOrgaoEmissor: "",
    rgUf: "",
    rgDataExpedicao: "",
    sexo: "",
    raca: "",
    nomePai: "",
    nomeMae: "",
    nacionalidade: "",
    grauInstrucao: "",
    estadoCivil: "",
    nomeConjuge: "",
    pis: "",
    ctpsNumero: "",
    ctpsSerie: "",
    ctpsUf: "",
    cnhNumero: "",
    cnhCategoria: "",
    cnhDataVencimento: "",
    cep: "",
    rua: "", // Inicializando campos de endereço
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    funcao: "",
    cargaHoraria: "",
    horarioTrabalho: "",
    reemprego: "nao",
    tipoContrato: "",
    utilizaValeTransporte: "nao",
    quantidadeValeTransporte: "",
    nivel: "",
    departamento: "",
    empresa: "",
    cargo: "",
    dataAdmissao: "",
    dataNascimento: "",
    salario: "",
    telefone: "",
    email: "",
    endereco: "",
    observacoes: "",
    status: "Ativo", // Default status
    pontuacaoGeral: 0,
    points: 0,
    // Initializing fields for demissão
    dataDemissao: "",
    motivoDemissao: "",

    // Initializing alimony fields
    pensaoAlimenticia: false,
    pensaoAlimenticiaValor: null,
    pensaoAlimenticiaConta: "",
    // Initializing leave fields
    dataAfastamento: "",
    motivoAfastamento: "",
  })

  const [dependente, setDependente] = useState({
    nome: "",
    cpf: "",
    parentesco: "",
    dataNascimento: "",
    telefone: "", // Mantido no estado local do formulário
    observacoes: "", // Mantido no estado local do formulário
  })

  const [documento, setDocumento] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
    dataEmissao: "",
    dataVencimento: "",
  })

  // Corrigindo o redeclare de 'historico' e 'setHistorico'
  const [historicoEventoState, setHistoricoEventoState] = useState({
    tipoEvento: "",
    dataEvento: "",
    descricao: "",
    observacoes: "", // Este campo foi removido da interface e banco de dados, mas mantido aqui por enquanto
  })

  const filteredFuncionarios = funcionarios
    .filter((func: any) => {
      const matchesSearch =
        (func.nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (func.cpf || "").includes(searchTerm) ||
        (func.funcao?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || // Alterado para buscar por função
        (func.nivel?.toLowerCase() || "").includes(searchTerm.toLowerCase()) // Alterado para buscar por nível

      const matchesStatus = !statusFilter || statusFilter === "all" || func.status === statusFilter
      const matchesDepartamento =
        !departamentoFilter || departamentoFilter === "all" || func.departamento === departamentoFilter
      const matchesEmpresa = !empresaFilter || empresaFilter === "all" || func.empresa === empresaFilter
      const matchesNivel = !departamentoFilter || departamentoFilter === "all" || func.nivel === departamentoFilter

      return matchesSearch && matchesStatus && matchesNivel && matchesEmpresa
    })
    .sort((a: any, b: any) => {
      // Funcionários INATIVOS vão para o final
      if (a.status === "INATIVO" && b.status !== "INATIVO") return 1
      if (a.status !== "INATIVO" && b.status === "INATIVO") return -1
      // Ordenação normal por nome
      return a.nome.localeCompare(b.nome)
    })

  const totalPages = Math.ceil(filteredFuncionarios.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentFuncionarios = filteredFuncionarios.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, departamentoFilter, empresaFilter, itemsPerPage])

  const adicionarFuncionario = () => {
    setEditMode(false)
    setFuncionario({
      id: 0,
      nome: "",
      cpf: "",
      rg: "",
      rgOrgaoEmissor: "",
      rgUf: "",
      rgDataExpedicao: "",
      sexo: "",
      raca: "",
      nomePai: "",
      nomeMae: "",
      nacionalidade: "",
      grauInstrucao: "",
      estadoCivil: "",
      nomeConjuge: "",
      pis: "",
      ctpsNumero: "",
      ctpsSerie: "",
      ctpsUf: "",
      cnhNumero: "",
      cnhCategoria: "",
      cnhDataVencimento: "",
      cep: "",
      rua: "", // Resetando campos de endereço
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      funcao: "",
      cargaHoraria: "",
      horarioTrabalho: "",
      reemprego: "nao",
      tipoContrato: "",
      utilizaValeTransporte: "nao",
      quantidadeValeTransporte: "",
      nivel: "",
      departamento: "",
      empresa: "",
      cargo: "",
      dataAdmissao: "",
      dataNascimento: "",
      salario: "",
      telefone: "",
      email: "",
      endereco: "",
      observacoes: "",
      status: "Ativo",
      pontuacaoGeral: 0,
      points: 0,
      // Resetando campos de demissão
      dataDemissao: "",
      motivoDemissao: "",
      // Resetando campos de pensão e afastamento
      pensaoAlimenticia: false,
      pensaoAlimenticiaValor: null,
      pensaoAlimenticiaConta: "",
      dataAfastamento: "",
      motivoAfastamento: "",
    })
    setView("form")
  }

  const visualizarFuncionario = (func: Funcionario) => {
    setSelectedFuncionario(func)
    setEditMode(false)
    setView("details")
  }

  const editarFuncionario = (func: Funcionario) => {
    console.log("[v0] Editando funcionário:", func.nome)
    console.log("[v0] Data admissão do banco (data_admissao):", (func as any).data_admissao)
    console.log("[v0] Data nascimento do banco (data_nascimento):", (func as any).data_nascimento)
    console.log("[v0] Data limite do banco (data_limite):", (func as any).data_limite)
    console.log("[v0] Pontos do banco (points):", (func as any).points)

    setSelectedFuncionario(func)
    setFuncionario({
      id: func.id,
      nome: func.nome ?? "",
      cpf: func.cpf ?? "",
      rg: func.rg ?? "",
      rgOrgaoEmissor: (func as any).rg_orgao_emissor ?? "",
      rgUf: (func as any).rg_uf ?? "",
      rgDataExpedicao: (func as any).rg_data_expedicao ?? "",
      sexo: (func as any).sexo ?? "",
      raca: (func as any).raca ?? "",
      nomePai: (func as any).nome_pai ?? "",
      nomeMae: (func as any).nome_mae ?? "",
      nacionalidade: (func as any).nacionalidade ?? "",
      grauInstrucao: (func as any).grau_instrucao ?? "",
      estadoCivil: (func as any).estado_civil ?? "",
      nomeConjuge: (func as any).nome_conjuge ?? "",
      pis: (func as any).pis ?? "",
      ctpsNumero: (func as any).ctps_numero ?? "",
      ctpsSerie: (func as any).ctps_serie ?? "",
      ctpsUf: (func as any).ctps_uf ?? "",
      cnhNumero: (func as any).cnh_numero ?? "",
      cnhCategoria: (func as any).cnh_categoria ?? "",
      cnhDataVencimento: (func as any).cnh_data_vencimento ?? "",
      cep: (func as any).cep ?? "",
      rua: (func as any).rua ?? "", // Carregando campos de endereço
      numero: (func as any).numero ?? "",
      complemento: (func as any).complemento ?? "",
      bairro: (func as any).bairro ?? "",
      cidade: (func as any).cidade ?? "",
      estado: (func as any).estado ?? "",
      endereco: (func as any).endereco ?? "", // Campo legado
      funcao: (func as any).funcao ?? "",
      cargaHoraria: (func as any).carga_horaria ?? "",
      horarioTrabalho: (func as any).horario_trabalho ?? "",
      reemprego: func.reemprego === true ? "sim" : func.reemprego === false ? "nao" : String(func.reemprego || "nao"),
      tipoContrato: (func as any).tipo_contrato ?? "",
      utilizaValeTransporte:
        func.utilizaValeTransporte === true
          ? "sim"
          : func.utilizaValeTransporte === false
            ? "nao"
            : String(func.utilizaValeTransporte || "nao"),
      quantidadeValeTransporte: (func as any).quantidade_vale_transporte?.toString() ?? "",
      nivel: func.nivel ?? "",
      departamento: func.departamento ?? "",
      empresa: func.empresa ?? "",
      cargo: func.cargo ?? "",
      dataAdmissao: (func as any).data_admissao ?? "",
      dataNascimento: (func as any).data_nascimento ?? "",
      salario: func.salario?.toString() ?? "",
      telefone: func.telefone ?? "",
      email: func.email ?? "",
      observacoes: func.observacoes ?? "",
      status: func.status || "Ativo",
      dataLimite: (func as any).data_limite ?? "",
      pontuacaoGeral: func.pontuacaoGeral || 0, // Para exibição no formulário
      points: (func as any).points, // Para usar no cálculo e exibição mais precisa

      // Loading alimony and leave fields
      pensaoAlimenticia: (func as any).pensao_alimenticia || false,
      pensaoAlimenticiaValor: (func as any).pensao_alimenticia_valor,
      pensaoAlimenticiaConta: (func as any).pensao_alimenticia_conta || "",
      dataAfastamento: (func as any).data_afastamento,
      motivoAfastamento: (func as any).motivo_afastamento,
    })

    console.log("[v0] Estado funcionario.dataAdmissao:", (func as any).data_admissao ?? "")
    console.log("[v0] Estado funcionario.dataNascimento:", (func as any).data_nascimento ?? "")
    console.log("[v0] Estado funcionario.dataLimite:", (func as any).data_limite ?? "")

    const statusComDataLimite = ["Em férias", "Aviso prévio", "Em Experiência"]
    if (statusComDataLimite.includes(func.status || "")) {
      setMostrarModalDataLimite(true)
    }

    setEditMode(true)
    setView("form")
  }

  const voltarParaLista = () => {
    setView("list")
    setSelectedFuncionario(null)
    setEditMode(false)
  }

  const handleStatusChange = (novoStatus: string) => {
    console.log("[v0] Status selecionado:", novoStatus)
    setFuncionario({ ...funcionario, status: novoStatus })

    if (novoStatus === "INATIVO") {
      setMostrarModalDemissao(true)
    } else if (["Em férias", "Aviso prévio", "Em Experiência"].includes(novoStatus)) {
      setMostrarModalDataLimite(true) // Exibe o modal de data limite
    } else if (novoStatus === "Em Afastamento") {
      // Para afastamento, abrir um modal para coletar data e motivo
      // (A implementação deste modal seria semelhante aos de demissão/data limite)
      // Por enquanto, apenas atualiza o estado.
      console.log("[v0] Status 'Em Afastamento' selecionado. Implementar modal para data/motivo.")
    } else {
      setMostrarModalDataLimite(false)
      setMostrarModalDemissao(false)

      // Se for Destaque, calcular automaticamente 30 dias
      if (novoStatus === "Destaque") {
        const hoje = new Date()
        const dataFim = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
        setFuncionario({
          ...funcionario,
          status: novoStatus,
          dataLimite: dataFim.toISOString().split("T")[0],
        })
      } else {
        // Para outros status (como Ativo), garantir que dataLimite seja limpa se não aplicável
        setFuncionario({ ...funcionario, status: novoStatus, dataLimite: "" })
      }
    }
  }

  const salvarFuncionario = async () => {
    console.log("[v0] ========================================")
    console.log("[v0] BOTÃO ATUALIZAR/SALVAR CLICADO")
    console.log("[v0] ========================================")
    console.log("[v0] Iniciando salvarFuncionario")
    console.log("[v0] Dados do funcionário a salvar:", JSON.stringify(funcionario, null, 2))

    if (editMode && selectedFuncionario) {
      console.log("[v0] MODO EDIÇÃO - Verificando campos obrigatórios...")
    } else {
      console.log("[v0] MODO CRIAÇÃO - Verificando campos obrigatórios...")
    }

    const camposObrigatorios: Record<string, any> = {
      nome: funcionario.nome?.trim(),
      dataAdmissao: funcionario.dataAdmissao?.trim(),
      funcao: funcionario.funcao?.trim(),
      nivel: funcionario.nivel?.trim(),
      empresa: funcionario.empresa?.trim(),
      pensaoAlimenticia: funcionario.pensaoAlimenticia, // Now required
    }

    // No modo de edição, todos os campos continuam obrigatórios
    if (editMode && selectedFuncionario) {
      // Manter os mesmos campos obrigatórios no modo de edição
    }

    const camposFaltando = Object.entries(camposObrigatorios)
      .filter(([_, valor]) => !valor)
      .map(([campo]) => campo)

    if (camposFaltando.length > 0) {
      const nomesAmigaveis: Record<string, string> = {
        nome: "Nome",
        dataAdmissao: "Data de Admissão",
        funcao: "Função",
        nivel: "Nível",
        empresa: "Empresa",
        pensaoAlimenticia: "Indicação de Pensão Alimentícia",
      }

      const mensagem = `Os seguintes campos são obrigatórios: ${camposFaltando.map((c) => nomesAmigaveis[c]).join(", ")}`

      console.log("[v0] ERRO: Campos obrigatórios faltando:", camposFaltando)

      alert(`⚠️ ATENÇÃO!\n\n${mensagem}\n\nPor favor, preencha todos os campos obrigatórios antes de salvar.`)

      toast({
        title: "Campos obrigatórios",
        description: mensagem,
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Validação de campos obrigatórios OK")

    const salarioValue = funcionario.salario
      ? Number.parseFloat(funcionario.salario.replace(/[^\d,]/g, "").replace(",", "."))
      : 0

    console.log("[v0] Salário convertido:", salarioValue)

    const dataAdmissaoFormatada =
      funcionario.dataAdmissao && funcionario.dataAdmissao.trim() !== "" ? funcionario.dataAdmissao : undefined

    const dataNascimentoFormatada =
      funcionario.dataNascimento && funcionario.dataNascimento.trim() !== "" ? funcionario.dataNascimento : undefined

    console.log("[v0] Data de admissão formatada:", dataAdmissaoFormatada)
    console.log("[v0] Data de nascimento formatada:", dataNascimentoFormatada)

    const dadosBase: any = {
      nome: funcionario.nome,
      funcao: funcionario.funcao || null,
      nivel: funcionario.nivel || null,
      departamento: funcionario.departamento || null,
      cargo: funcionario.cargo || null,
      status: funcionario.status || "Ativo", // Usar o status do formulário
      // Adicionar campos que foram preenchidos e são obrigatórios no DB
      data_admissao: dataAdmissaoFormatada || null,
      empresa: funcionario.empresa || null,
      cpf: funcionario.cpf,
      rg: funcionario.rg,
      data_nascimento: dataNascimentoFormatada,
      sexo: funcionario.sexo,
      nacionalidade: funcionario.nacionalidade,
      grau_instrucao: funcionario.grauInstrucao,
      estado_civil: funcionario.estadoCivil,
      pis: funcionario.pis,
      ctps_numero: funcionario.ctpsNumero,
      ctps_serie: funcionario.ctpsSerie,
      ctps_uf: funcionario.ctpsUf,
      carga_horaria: funcionario.cargaHoraria,
      reemprego: funcionario.reemprego === "sim",
      utilizaValeTransporte: funcionario.utilizaValeTransporte === "sim",
    }

    // Adicionar campos opcionais apenas se tiverem valor
    if (funcionario.rgOrgaoEmissor) dadosBase.rg_orgao_emissor = funcionario.rgOrgaoEmissor
    if (funcionario.rgUf) dadosBase.rg_uf = funcionario.rgUf
    if (funcionario.rgDataExpedicao) dadosBase.rg_data_expedicao = funcionario.rgDataExpedicao
    if (funcionario.raca) dadosBase.raca = funcionario.raca
    if (funcionario.nomePai) dadosBase.nome_pai = funcionario.nomePai
    if (funcionario.nomeMae) dadosBase.nome_mae = funcionario.nomeMae
    if (funcionario.estadoCivil === "casado" && funcionario.nomeConjuge)
      dadosBase.nome_conjuge = funcionario.nomeConjuge
    if (salarioValue > 0) dadosBase.salario = salarioValue
    if (funcionario.telefone) dadosBase.telefone = funcionario.telefone
    if (funcionario.email) dadosBase.email = funcionario.email
    if (funcionario.observacoes) dadosBase.observacoes = funcionario.observacoes
    if (funcionario.ctpsNumero) dadosBase.ctps_numero = funcionario.ctpsNumero
    if (funcionario.ctpsSerie) dadosBase.ctps_serie = funcionario.ctpsSerie
    if (funcionario.ctpsUf) dadosBase.ctps_uf = funcionario.ctpsUf
    if (funcionario.cnhNumero) dadosBase.cnh_numero = funcionario.cnhNumero
    if (funcionario.cnhCategoria) dadosBase.cnh_categoria = funcionario.cnhCategoria
    if (funcionario.cnhDataVencimento) dadosBase.cnh_data_vencimento = funcionario.cnhDataVencimento

    // Adicionando campos de endereço separados
    if (funcionario.cep) dadosBase.cep = funcionario.cep
    if (funcionario.rua) dadosBase.rua = funcionario.rua
    if (funcionario.numero) dadosBase.numero = funcionario.numero
    if (funcionario.complemento) dadosBase.complemento = funcionario.complemento
    if (funcionario.bairro) dadosBase.bairro = funcionario.bairro
    if (funcionario.cidade) dadosBase.cidade = funcionario.cidade
    if (funcionario.estado) dadosBase.estado = funcionario.estado

    if (funcionario.cargaHoraria) dadosBase.carga_horaria = funcionario.cargaHoraria
    if (funcionario.horarioTrabalho) dadosBase.horario_trabalho = funcionario.horarioTrabalho
    if (funcionario.tipoContrato) dadosBase.tipo_contrato = funcionario.tipoContrato
    if (funcionario.quantidadeValeTransporte)
      dadosBase.quantidade_vale_transporte = Number(funcionario.quantidadeValeTransporte)

    // Adicionar dataLimite apenas se existir
    if (funcionario.dataLimite) {
      dadosBase.data_limite = funcionario.dataLimite
    }

    // Adicionar dataDemissao e motivoDemissao se o status for INATIVO e estiverem preenchidos
    if (funcionario.status === "INATIVO") {
      if (funcionario.dataDemissao) dadosBase.data_demissao = funcionario.dataDemissao
      if (funcionario.motivoDemissao) dadosBase.motivo_demissao = funcionario.motivoDemissao
    }

    // Adicionar campos de afastamento se o status for 'Em Afastamento'
    if (funcionario.status === "Em Afastamento") {
      if (funcionario.dataAfastamento) dadosBase.data_afastamento = funcionario.dataAfastamento
      if (funcionario.motivoAfastamento) dadosBase.motivo_afastamento = funcionario.motivoAfastamento
    }

    // Adicionar pontos se o campo 'points' foi atualizado no formulário (talvez não seja ideal salvar diretamente aqui)
    // Considerar que 'pontuacaoGeral' no formulário é apenas para visualização e o 'points' é o valor do banco
    // Se o usuário não mexeu em nada relacionado a pontos, não sobrescrevemos o valor do banco.
    // Se o formulário for resetado, 'points' será resetado para 0, o que pode não ser o desejado.
    // Uma abordagem melhor seria gerenciar pontos via histórico.
    // Se quisermos permitir a edição direta de pontos:
    // if (funcionario.points !== undefined && funcionario.points !== null) {
    //   dadosBase.points = funcionario.points
    // }

    console.log("[v0] Dados base para salvar/atualizar:", JSON.stringify(dadosBase, null, 2))

    try {
      if (editMode && selectedFuncionario) {
        console.log("[v0] ========================================")
        console.log("[v0] MODO EDIÇÃO - Atualizando funcionário")
        console.log("[v0] ID do funcionário:", selectedFuncionario.id)
        console.log("[v0] ========================================")

        console.log("[v0] Chamando employeeOperations.update...")

        const updatedEmployee = await employeeOperations.update(selectedFuncionario.id.toString(), dadosBase)

        console.log("[v0] ========================================")
        console.log("[v0] RESPOSTA DA ATUALIZAÇÃO:")
        console.log("[v0]", JSON.stringify(updatedEmployee, null, 2))
        console.log("[v0] ========================================")

        console.log("[v0] Chamando triggerSync para atualizar a lista...")
        await triggerSync()
        console.log("[v0] Sincronização concluída com sucesso!")

        toast({
          title: "Sucesso!",
          description: "Funcionário atualizado com sucesso!",
        })

        console.log("[v0] Resetando estados e voltando para lista...")
        setView("list")
        setEditMode(false)
        setSelectedFuncionario(null)
        setFuncionario({
          // Reset to default structure
          id: 0,
          nome: "",
          cpf: "",
          rg: "",
          rgOrgaoEmissor: "",
          rgUf: "",
          rgDataExpedicao: "",
          sexo: "",
          raca: "",
          nomePai: "",
          nomeMae: "",
          nacionalidade: "",
          grauInstrucao: "",
          estadoCivil: "",
          nomeConjuge: "",
          pis: "",
          ctpsNumero: "",
          ctpsSerie: "",
          ctpsUf: "",
          cnhNumero: "",
          cnhCategoria: "",
          cnhDataVencimento: "",
          cep: "",
          rua: "", // Resetando campos de endereço
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
          funcao: "",
          cargaHoraria: "",
          horarioTrabalho: "",
          reemprego: "nao",
          tipoContrato: "",
          utilizaValeTransporte: "nao",
          quantidadeValeTransporte: "",
          nivel: "",
          departamento: "",
          empresa: "",
          cargo: "",
          dataAdmissao: "",
          dataNascimento: "",
          salario: "",
          telefone: "",
          email: "",
          endereco: "",
          observacoes: "",
          status: "Ativo",
          pontuacaoGeral: 0,
          points: 0,
          // Resetando campos de demissão
          dataDemissao: "",
          motivoDemissao: "",
          // Resetando campos de pensão e afastamento
          pensaoAlimenticia: false,
          pensaoAlimenticiaValor: null,
          pensaoAlimenticiaConta: "",
          dataAfastamento: "",
          motivoAfastamento: "",
        })
        console.log("[v0] ========================================")
        console.log("[v0] ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!")
        console.log("[v0] ========================================")
      } else {
        console.log("[v0] ========================================")
        console.log("[v0] MODO CRIAÇÃO - Criando novo funcionário")
        console.log("[v0] ========================================")

        const dadosCriacao = {
          ...dadosBase,
          points: 10, // All new employees start with 10 points
        }

        console.log("[v0] Dados para criação:", JSON.stringify(dadosCriacao, null, 2))

        try {
          const newEmployee = await employeeOperations.create(dadosCriacao)
          console.log("[v0] Resposta da criação:", JSON.stringify(newEmployee, null, 2))

          await triggerSync()
          console.log("[v0] Sincronização concluída")

          toast({
            title: "Sucesso!",
            description: "Funcionário cadastrado com sucesso!",
          })

          setView("list")
          setFuncionario({
            // Reset to default structure
            id: 0,
            nome: "",
            cpf: "",
            rg: "",
            rgOrgaoEmissor: "",
            rgUf: "",
            rgDataExpedicao: "",
            sexo: "",
            raca: "",
            nomePai: "",
            nomeMae: "",
            nacionalidade: "",
            grauInstrucao: "",
            estadoCivil: "",
            nomeConjuge: "",
            pis: "",
            ctpsNumero: "",
            ctpsSerie: "",
            ctpsUf: "",
            cnhNumero: "",
            cnhCategoria: "",
            cnhDataVencimento: "",
            cep: "",
            rua: "", // Resetando campos de endereço
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: "",
            funcao: "",
            cargaHoraria: "",
            horarioTrabalho: "",
            reemprego: "nao",
            tipoContrato: "",
            utilizaValeTransporte: "nao",
            quantidadeValeTransporte: "",
            nivel: "",
            departamento: "",
            empresa: "",
            cargo: "",
            dataAdmissao: "",
            dataNascimento: "",
            salario: "",
            telefone: "",
            email: "",
            endereco: "",
            observacoes: "",
            status: "Ativo",
            pontuacaoGeral: 0,
            points: 0,
            // Resetando campos de demissão
            dataDemissao: "",
            motivoDemissao: "",
            // Resetando campos de pensão e afastamento
            pensaoAlimenticia: false,
            pensaoAlimenticiaValor: null,
            pensaoAlimenticiaConta: "",
            dataAfastamento: "",
            motivoAfastamento: "",
          })
          console.log("[v0] ========================================")
          console.log("[v0] CRIAÇÃO CONCLUÍDA COM SUCESSO!")
          console.log("[v0] ========================================")
        } catch (createError) {
          console.error("[v0] Erro específico na criação:", createError)
          throw createError
        }
      }
    } catch (error) {
      console.log("[v0] ========================================")
      console.log("[v0] ERRO AO SALVAR FUNCIONÁRIO:")
      if (error instanceof Error) {
        console.log("[v0] Mensagem:", error.message)
        console.log("[v0] Stack:", error.stack)
      } else {
        console.log("[v0] Erro completo:", JSON.stringify(error, null, 2))
      }
      console.log("[v0] ========================================")

      toast({
        title: "Erro ao salvar funcionário",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido. Verifique os dados e tente novamente.",
        variant: "destructive",
      })

      alert(
        `❌ ERRO AO SALVAR FUNCIONÁRIO\n\n${error instanceof Error ? error.message : "Erro desconhecido"}\n\nVerifique os dados e tente novamente.`,
      )
    }
  }

  const [uploadingFile, setUploadingFile] = useState(false)
  const [dependenteBirthCertificate, setDependenteBirthCertificate] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const isBirthCertificateRequired = (): boolean => {
    if (!dependente.parentesco || !dependente.dataNascimento) return false
    const requiresForRelationship = dependente.parentesco === "Filho(a)" || dependente.parentesco === "Outro"
    const age = calculateAge(dependente.dataNascimento)
    return requiresForRelationship && age < 14
  }

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    const response = await fetch("/api/upload-document", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload file")
    }

    const data = await response.json()
    return data.url
  }

  const salvarDependente = async () => {
    if (!selectedFuncionario && !editMode) {
      alert("Selecione um funcionário primeiro!")
      return
    }

    const funcionarioId = funcionario.id || selectedFuncionario?.id
    if (!funcionarioId) {
      toast({
        title: "Erro",
        description: "ID do funcionário não encontrado.",
        variant: "destructive",
      })
      return
    }

    // Check if birth certificate is required but not provided
    if (isBirthCertificateRequired() && !dependenteBirthCertificate) {
      toast({
        title: "Atenção",
        description: "Certidão de nascimento é obrigatória para dependentes menores de 14 anos.",
        variant: "destructive",
      })
      return
    }

    setUploadingFile(true)

    try {
      let birthCertificateUrl = ""

      // Upload birth certificate if provided
      if (dependenteBirthCertificate) {
        birthCertificateUrl = await uploadFile(dependenteBirthCertificate, "birth-certificates")
      }

      const newId = crypto.randomUUID()

      // Save to Supabase
      const { error } = await supabase.from("employee_dependents").insert([
        {
          id: newId,
          employee_id: funcionarioId,
          nome: dependente.nome,
          cpf: dependente.cpf,
          parentesco: dependente.parentesco,
          data_nascimento: dependente.dataNascimento || null,
          birth_certificate_url: birthCertificateUrl,
        },
      ])

      if (error) throw error

      const { data: updatedDependentes } = await supabase
        .from("employee_dependents")
        .select("*")
        .eq("employee_id", funcionarioId)

      if (updatedDependentes) {
        setDependentes(updatedDependentes)
      }

      await triggerSync()

      toast({
        title: "Sucesso",
        description: "Dependente salvo com sucesso!",
      })

      // Reset form
      setDependente({
        nome: "",
        cpf: "",
        parentesco: "",
        dataNascimento: "",
        telefone: "",
        observacoes: "",
      })
      setDependenteBirthCertificate(null)
    } catch (error: any) {
      console.error("Erro ao salvar dependente:", error)
      toast({
        title: "Erro",
        description: `Erro ao salvar dependente: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const salvarDocumento = async () => {
    if (!selectedFuncionario && !editMode) {
      alert("Selecione um funcionário primeiro!")
      return
    }

    const funcionarioId = funcionario.id || selectedFuncionario?.id
    if (!funcionarioId) {
      toast({
        title: "Erro",
        description: "ID do funcionário não encontrado.",
        variant: "destructive",
      })
      return
    }

    if (!documentFile) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione um arquivo para upload.",
        variant: "destructive",
      })
      return
    }

    setUploadingFile(true)

    try {
      // Upload document file
      const fileUrl = await uploadFile(documentFile, "employee-documents")

      const newId = crypto.randomUUID()

      const { error } = await supabase.from("employee_documents").insert([
        {
          id: newId,
          employee_id: funcionarioId,
          tipo: documento.tipoDocumento,
          numero: documento.numeroDocumento,
          data_emissao: documento.dataEmissao || null,
          data_vencimento: documento.dataVencimento || null,
          file_url: fileUrl,
        },
      ])

      if (error) throw error

      const { data: updatedDocumentos } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", funcionarioId)

      if (updatedDocumentos) {
        setDocumentosData(updatedDocumentos)
      }

      await triggerSync()

      toast({
        title: "Sucesso",
        description: "Documento salvo com sucesso!",
      })

      // Reset form
      setDocumento({
        tipoDocumento: "",
        numeroDocumento: "",
        dataEmissao: "",
        dataVencimento: "",
      })
      setDocumentFile(null)
    } catch (error: any) {
      console.error("Erro ao salvar documento:", error)
      toast({
        title: "Erro",
        description: `Erro ao salvar documento: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const salvarHistorico = async () => {
    console.log("[v0] ========================================")
    console.log("[v0] BOTÃO ADICIONAR HISTÓRICO CLICADO!")
    console.log("[v0] salvarHistorico chamado")
    console.log("[v0] selectedFuncionario:", selectedFuncionario)
    console.log("[v0] funcionario:", funcionario)
    console.log("[v0] editMode:", editMode)
    console.log("[v0] historicoEventoState:", historicoEventoState)
    console.log("[v0] ========================================")

    if (!selectedFuncionario && !editMode) {
      console.log("[v0] ERRO: Nenhum funcionário selecionado")
      alert("Selecione um funcionário primeiro!")
      return
    }

    const funcionarioId = funcionario.id || selectedFuncionario?.id
    console.log("[v0] funcionarioId obtido:", funcionarioId)

    if (!funcionarioId) {
      console.log("[v0] ERRO: funcionarioId é inválido")
      toast({
        title: "Erro",
        description: "ID do funcionário não encontrado.",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!historicoEventoState.tipoEvento) {
      console.log("[v0] ERRO: Tipo de evento não selecionado")
      toast({
        title: "Erro",
        description: "Selecione o tipo de evento.",
        variant: "destructive",
      })
      return
    }

    if (!historicoEventoState.dataEvento) {
      console.log("[v0] ERRO: Data do evento não preenchida")
      toast({
        title: "Erro",
        description: "Preencha a data do evento.",
        variant: "destructive",
      })
      return
    }

    if (!historicoEventoState.descricao) {
      console.log("[v0] ERRO: Descrição não preenchida")
      toast({
        title: "Erro",
        description: "Preencha a descrição do evento.",
        variant: "destructive",
      })
      return
    }

    // Validate event type
    if (!["positivo", "neutro", "negativo"].includes(historicoEventoState.tipoEvento)) {
      console.log("[v0] ERRO: Tipo de evento inválido:", historicoEventoState.tipoEvento)
      toast({
        title: "Erro",
        description: "Tipo de evento inválido. Escolha: positivo, neutro ou negativo.",
        variant: "destructive",
      })
      return
    }

    // Check monthly limit for positive/negative events
    if (historicoEventoState.tipoEvento !== "neutro") {
      const currentMonth = new Date(historicoEventoState.dataEvento).toISOString().slice(0, 7)
      // Usar historicosData para verificar o limite mensal, pois é o estado local atualizado
      const monthlyEvents = historicosData.filter(
        (h: any) =>
          h.employee_id === String(funcionarioId) &&
          h.data.startsWith(currentMonth) &&
          h.tipo !== "neutro" &&
          h.event_type !== "neutro",
      )

      console.log("[v0] Eventos do mês atual:", monthlyEvents.length)

      if (monthlyEvents.length >= 4) {
        console.log("[v0] ERRO: Limite mensal atingido")
        toast({
          title: "Limite atingido",
          description: "Este funcionário já recebeu 4 registros (positivos/negativos) este mês.",
          variant: "destructive",
        })
        return
      }
    }

    try {
      console.log("[v0] Iniciando salvamento do histórico...")

      // Calculate points change
      let pointsChange = 0
      if (historicoEventoState.tipoEvento === "positivo") {
        pointsChange = 5
      } else if (historicoEventoState.tipoEvento === "negativo") {
        pointsChange = -10
      }

      console.log("[v0] Mudança de pontos:", pointsChange)

      // Save history to Supabase
      const { data: insertedHistory, error: historyError } = await supabase
        .from("employee_history")
        .insert([
          {
            employee_id: String(funcionarioId),
            tipo: historicoEventoState.tipoEvento, // Use 'tipo' instead of 'event_type'
            data: historicoEventoState.dataEvento,
            descricao: historicoEventoState.descricao,
            // Saving event_type (if different from tipo)
            event_type: historicoEventoState.tipoEvento,
          },
        ])
        .select()

      if (historyError) {
        console.error("[v0] Erro ao salvar histórico:", historyError)
        throw historyError
      }

      console.log("[v0] Histórico salvo com sucesso:", insertedHistory)

      // Update employee points if not neutral
      if (pointsChange !== 0) {
        // Fetch current employee data to get the most up-to-date points
        const { data: currentEmployeeData, error: fetchError } = await supabase
          .from("employees")
          .select("id, points")
          .eq("id", funcionarioId)
          .single()

        if (fetchError) {
          console.error("[v0] Erro ao buscar pontos do funcionário:", fetchError)
          throw fetchError
        }

        const currentPoints = currentEmployeeData?.points ?? 0
        const newPoints = Math.max(0, currentPoints + pointsChange)

        console.log("[v0] Pontos atuais:", currentPoints)
        console.log("[v0] Novos pontos:", newPoints)

        const { error: pointsError } = await supabase
          .from("employees")
          .update({ points: newPoints, updated_at: new Date().toISOString() })
          .eq("id", funcionarioId)

        if (pointsError) {
          console.error("[v0] Erro ao atualizar pontos:", pointsError)
          throw pointsError
        }

        console.log("[v0] Pontos atualizados com sucesso")

        // Update local state
        if (selectedFuncionario) {
          setSelectedFuncionario({ ...selectedFuncionario, points: newPoints })
        }
        setFuncionario({ ...funcionario, points: newPoints, pontuacaoGeral: newPoints })
      }

      const { data: updatedHistory } = await supabase
        .from("employee_history")
        .select("*")
        .eq("employee_id", String(funcionarioId))
        .order("data", { ascending: false })

      if (updatedHistory) {
        setHistorico(updatedHistory)
      }

      // Refresh the employees list to reflect updated points
      const { data: updatedEmployees } = await supabase.from("employees").select("*").order("nome")
      if (updatedEmployees) {
        setFuncionarios(updatedEmployees)
      }

      await triggerSync()

      toast({
        title: "Sucesso",
        description: `Evento saved with success! ${pointsChange > 0 ? `+${pointsChange}` : pointsChange < 0 ? pointsChange : ""} points`,
      })

      console.log("[v0] Resetando formulário...")

      // Reset form
      setHistoricoEventoState({
        tipoEvento: "",
        dataEvento: "",
        descricao: "",
        observacoes: "",
      })

      console.log("[v0] ========================================")
      console.log("[v0] Histórico salvo com sucesso!")
      console.log("[v0] ========================================")
    } catch (error: any) {
      console.error("[v0] ========================================")
      console.error("[v0] Erro ao salvar histórico:", error)
      console.error("[v0] ========================================")
      toast({
        title: "Erro",
        description: `Erro ao salvar histórico: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const getDependentesByFuncionario = (funcionarioId: number) => {
    return dependentesData.filter((d: any) => d.employee_id === String(funcionarioId))
  }

  const getDocumentosByFuncionario = (funcionarioId: number) => {
    return documentosData.filter((d: any) => d.employee_id === String(funcionarioId))
  }

  const getHistoricoByFuncionario = (funcionarioId: string | number) => {
    // Ensure funcionarioId is treated as a string for comparison with employee_id from Supabase
    return historicoData.filter((h: any) => h.employee_id === String(funcionarioId)) // Use historicoData
  }

  const removerDependente = (id: string) => {
    // Removendo do Supabase
    const deleteDependenteFromSupabase = async () => {
      try {
        const { error } = await supabase.from("employee_dependents").delete().eq("id", id)
        if (error) throw error
        triggerSync()
        toast({
          title: "Sucesso",
          description: "Dependente removido com sucesso!",
        })
        // Atualizar o estado local para refletir a remoção
        setDependentes(dependentes.filter((dep: any) => dep.id !== id))
      } catch (error: any) {
        console.error("Erro ao remover dependente:", error)
        toast({
          title: "Erro",
          description: `Erro ao remover dependente: ${error.message}`,
          variant: "destructive",
        })
      }
    }
    deleteDependenteFromSupabase()
  }

  const removerDocumento = (id: string) => {
    // Removendo do Supabase
    const deleteDocumentFromSupabase = async () => {
      try {
        const { error } = await supabase.from("employee_documents").delete().eq("id", id)
        if (error) throw error
        triggerSync()
        toast({
          title: "Sucesso",
          description: "Documento removido com sucesso!",
        })
        // Atualizar o estado local para refletir a remoção
        setDocumentosData(documentosData.filter((doc: any) => doc.id !== id))
      } catch (error: any) {
        console.error("Erro ao remover documento:", error)
        toast({
          title: "Erro",
          description: `Erro ao remover documento: ${error.message}`,
          variant: "destructive",
        })
      }
    }
    deleteDocumentFromSupabase()
  }

  const removerHistorico = async (id: string) => {
    try {
      // Get the history record to know which employee it belongs to and the event type
      const { data: historyRecord } = await supabase
        .from("employee_history")
        .select("employee_id, tipo, event_type") // Include event_type
        .eq("id", id)
        .single()

      if (!historyRecord) {
        throw new Error("Registro de histórico não encontrado")
      }

      // Calculate points change to reverse
      let pointsChange = 0
      const eventType = historyRecord.event_type || historyRecord.tipo // Prioritize event_type
      if (eventType === "positivo") {
        pointsChange = -5 // Remove 5 points when deleting positive record
      } else if (eventType === "negativo") {
        pointsChange = 10 // Add 10 points back when deleting negative record
      }

      console.log("[v0] Tipo de evento deletado:", eventType)
      console.log("[v0] Mudança de pontos ao deletar:", pointsChange)

      // Delete the history record
      const { error: deleteError } = await supabase.from("employee_history").delete().eq("id", id)

      if (deleteError) throw deleteError

      // Update employee points if not neutral
      if (pointsChange !== 0) {
        // Fetch current employee data to get the most up-to-date points
        const { data: currentEmployeeData, error: fetchError } = await supabase
          .from("employees")
          .select("id, points")
          .eq("id", historyRecord.employee_id)
          .single()

        if (fetchError) {
          console.error("[v0] Erro ao buscar pontos do funcionário:", fetchError)
          throw fetchError
        }

        const currentPoints = currentEmployeeData?.points ?? 0
        const newPoints = Math.max(0, currentPoints + pointsChange) // Don't allow negative points

        console.log("[v0] Pontos atuais antes de deletar:", currentPoints)
        console.log("[v0] Novos pontos após deletar:", newPoints)

        const { error: updateError } = await supabase
          .from("employees")
          .update({ points: newPoints, updated_at: new Date().toISOString() })
          .eq("id", historyRecord.employee_id)

        if (updateError) {
          console.error("[v0] Erro ao atualizar pontos:", updateError)
          throw updateError
        }

        console.log("[v0] Pontos atualizados com sucesso após deletar histórico")

        // Update local states to reflect the point change
        const updatedEmployees = funcionarios.map((f: any) =>
          f.id === historyRecord.employee_id ? { ...f, points: newPoints } : f,
        )
        setFuncionarios(updatedEmployees)

        if (selectedFuncionario && selectedFuncionario.id === historyRecord.employee_id) {
          setSelectedFuncionario({ ...selectedFuncionario, points: newPoints })
        }
        setFuncionario((prev) => (prev.id === historyRecord.employee_id ? { ...prev, points: newPoints } : prev))
      }

      // Refresh history data
      const { data: updatedHistory } = await supabase
        .from("employee_history")
        .select("*")
        .eq("employee_id", historyRecord.employee_id)
        .order("data", { ascending: false })

      if (updatedHistory) {
        setHistorico(updatedHistory)
      }

      await triggerSync()

      toast({
        title: "Sucesso",
        description: "Evento do histórico removido com sucesso!",
      })
    } catch (error: any) {
      console.error("Erro ao remover histórico:", error)
      toast({
        title: "Erro",
        description: `Erro ao remover histórico: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
    const file = event.target.files?.[0]
    if (file) {
      alert(`Arquivo ${file.name} selecionado para ${tipo}`)
    }
  }

  const salvarStatusComData = async () => {
    if (!selectedDate) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione uma data limite",
        variant: "destructive",
      })
      return
    }

    try {
      // Atualizar apenas os campos de status no Supabase
      const { error } = await supabase
        .from("employees")
        .update({
          status: statusComData,
          data_limite: selectedDate,
          updated_at: new Date().toISOString(),
          // Saving date for afastamento if applicable
          ...(statusComData === "Em Afastamento" && { data_afastamento: selectedDate }),
          // Resetting other date-related fields if not applicable
          ...(statusComData !== "Em Afastamento" && { data_afastamento: null }),
          ...(statusComData !== "Em férias" &&
            statusComData !== "Aviso prévio" &&
            statusComData !== "Em Experiência" && { data_limite: null }),
        })
        .eq("id", selectedFuncionario?.id)

      if (error) throw error

      // Atualizar estado local
      const funcionariosAtualizados = funcionarios.map((f: any) =>
        f.id === selectedFuncionario?.id
          ? {
              ...f,
              status: statusComData,
              dataLimite: selectedDate,
              dataAfastamento: statusComData === "Em Afastamento" ? selectedDate : null,
            }
          : f,
      )
      setFuncionarios(funcionariosAtualizados)
      setSelectedFuncionario({
        ...selectedFuncionario,
        status: statusComData,
        dataLimite: selectedDate,
        dataAfastamento: statusComData === "Em Afastamento" ? selectedDate : null,
      })

      // Disparar sincronização global
      await triggerSync()

      setShowDateModal(false)
      setSelectedDate("")
      setStatusComData("")

      toast({
        title: "Sucesso",
        description: "Status com data salvo com sucesso!",
      })
    } catch (error: any) {
      console.error("Erro ao salvar status com data:", error)
      toast({
        title: "Erro",
        description: `Não foi possível salvar o status: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const mudarStatusRapido = async (novoStatus: string) => {
    const hoje = new Date()
    const updateData: any = {
      status: novoStatus,
      updated_at: new Date().toISOString(),
    }

    if (novoStatus === "Destaque") {
      const dataFim = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
      updateData.destaque_inicio = hoje.toISOString()
      updateData.data_limite = dataFim.toISOString().split("T")[0]

      // Incrementar contador de destaques
      const ultimoDestaque = funcionarioStatusSelecionado.ultimoDestaque
        ? new Date(funcionarioStatusSelecionado.ultimoDestaque)
        : new Date(0)
      const umAnoAtras = new Date()
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1)

      if (ultimoDestaque < umAnoAtras) {
        updateData.destaque_count = 1
      } else {
        updateData.destaque_count = (funcionarioStatusSelecionado.destaqueCount || 0) + 1
      }
      updateData.ultimo_destaque = hoje.toISOString()
    } else {
      // Resetar campos de destaque se o status não for Destaque
      updateData.destaque_inicio = null
      updateData.destaque_fim = null
      updateData.destaque_count = null
      updateData.ultimo_destaque = null
    }

    const statusesComData = ["Em férias", "Aviso prévio", "Em Experiência"]
    if (statusesComData.includes(novoStatus)) {
      setStatusComData(novoStatus)
      setShowDateModal(true)
      // setSelectedFuncionario(funcionario) // This was incorrect, should use the selected one from the modal context
    } else if (novoStatus === "Em Afastamento") {
      // Redirecionar para o modal de afastamento
      setStatusComData(novoStatus) // Usar statusComData para o modal de data
      setShowDateModal(true) // Usar o mesmo modal de data, mas tratar como afastamento
    } else {
      // Se não precisa de data, salva diretamente
      try {
        // Atualizar apenas os campos de status no Supabase
        const { error } = await supabase.from("employees").update(updateData).eq("id", funcionarioStatusSelecionado.id)

        if (error) throw error

        // Atualizar estado local
        const funcionariosAtualizados = funcionarios.map((f: any) =>
          f.id === funcionarioStatusSelecionado.id ? { ...f, ...updateData } : f,
        )
        setFuncionarios(funcionariosAtualizados)

        // Disparar sincronização global
        await triggerSync()

        toast({
          title: "Status atualizado",
          description:
            novoStatus === "Destaque"
              ? `Status alterado para ${novoStatus} e 10 pontos adicionados!`
              : `Status do funcionário alterado para ${novoStatus}.`,
        })
      } catch (error: any) {
        console.error("Erro ao mudar status:", error)
        toast({
          title: "Erro",
          description: `Não foi possível alterar o status: ${error.message}`,
          variant: "destructive",
        })
      }
    }
    // Fechar o modal após a ação
    setStatusModalAberto(false)
    setFuncionarioStatusSelecionado(null)
  }

  const podeBeDestaque = (funcionario: Funcionario) => {
    const hoje = new Date()
    const umAnoAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate())

    // Verificar quantas vezes foi destaque nos últimos 12 meses
    const destaqueCount = funcionario.destaqueCount || 0
    if (destaqueCount >= 3) {
      return { pode: false, motivo: "Funcionário já foi destaque 3 vezes nos últimos 12 meses" }
    }

    // Verificar se já existem 2 funcionários em destaque
    const funcionariosDestaque = funcionarios.filter((f) => f.status === "Destaque").length
    if (funcionariosDestaque >= 2) {
      return { pode: false, motivo: "Já existem 2 funcionários em destaque simultaneamente" }
    }

    const pontuacao = calcularPontuacaoGeral(funcionario)
    if (pontuacao < 30) {
      return { pode: false, motivo: `Pontuação insuficiente (${pontuacao} pontos, mínimo 30)` }
    }

    const admissao = new Date(funcionario.dataAdmissao)
    const diasTrabalhados = Math.floor((hoje.getTime() - admissao.getTime()) / (1000 * 60 * 60 * 24))
    if (diasTrabalhados < 90) {
      return { pode: false, motivo: `Tempo de casa insuficiente (${diasTrabalhados} dias, mínimo 90)` }
    }

    return { pode: true, motivo: "" }
  }

  // --- Início das modificações para calcularPontuacaoGeral ---
  const calcularPontuacaoGeral = (funcionario: any): number => {
    console.log("[v0] ===== Calculando pontos para:", funcionario.nome, "=====")
    let pontos = 10 // Pontuação base
    console.log("[v0] Pontuação base:", pontos)

    // Históricos
    const historicos = allHistoricos.filter((h: any) => h.employee_id === String(funcionario.id))
    console.log("[v0] Históricos encontrados:", historicos.length)
    console.log("[v0] Históricos completos:", JSON.stringify(historicos))

    // Sanções
    console.log("[v0] allSancoes:", allSancoes ? `array com ${allSancoes.length} itens` : "undefined/null")
    const sancoes = allSancoes?.filter((s: any) => s.employee_id === String(funcionario.id)) || []
    console.log("[v0] Sanções encontradas:", sancoes.length)

    if (sancoes.length > 0) {
      console.log("[v0] Primeira sanção completa:", JSON.stringify(sancoes[0]))
      console.log("[v0] Iniciando loop de sanções...")
    }

    historicos.forEach((h: any) => {
      console.log("[v0] Processando histórico:", JSON.stringify(h))
      const tipoOriginal = h.event_type || h.tipo
      const tipo = tipoOriginal ? String(tipoOriginal).toLowerCase().trim() : ""
      console.log("[v0] Tipo do histórico (original):", tipoOriginal, "| Normalizado:", tipo)

      if (tipo === "positivo") {
        pontos += 5
        console.log("[v0] +5 pontos (histórico positivo). Pontuação atual:", pontos)
      } else if (tipo === "negativo") {
        pontos -= 10
        console.log("[v0] -10 pontos (histórico negativo). Pontuação atual:", pontos)
      } else if (tipo === "falta") {
        pontos -= 5
        console.log("[v0] -5 pontos (falta). Pontuação atual:", pontos)
      } else if (tipo === "neutro") {
        // Histórico neutro não altera pontuação
        console.log("[v0] 0 pontos (histórico neutro). Pontuação atual:", pontos)
      } else {
        console.log("[v0] AVISO: Tipo de histórico não reconhecido:", tipo)
      }
    })

    sancoes.forEach((s: any, index: number) => {
      console.log(`[v0] Processando sanção ${index + 1}/${sancoes.length}`)
      const tipoOriginal = s.tipo || s.tipo_sancao || s.sanctionType
      const tipo = tipoOriginal ? String(tipoOriginal).toLowerCase().trim() : ""
      console.log("[v0] Tipo da sanção (original):", tipoOriginal, "| Normalizado:", tipo)

      if (tipo === "advertencia" || tipo === "advertência") {
        pontos -= 10
        console.log("[v0] -10 pontos (advertência). Pontuação atual:", pontos)
      } else if (tipo === "suspensao_1_dia" || tipo === "suspensão 1 dia") {
        pontos -= 10
        console.log("[v0] -10 pontos (suspensão 1 dia). Pontuação atual:", pontos)
      } else if (tipo === "suspensao_3_dias" || tipo === "suspensão 3 dias") {
        pontos -= 20
        console.log("[v0] -20 pontos (suspensão 3 dias). Pontuação atual:", pontos)
      } else if (tipo === "suspensao_5_dias" || tipo === "suspensão 5+ dias") {
        pontos -= 50
        console.log("[v0] -50 pontos (suspensão 5+ dias). Pontuação atual:", pontos)
      } else {
        console.log("[v0] AVISO: Tipo de sanção não reconhecido:", tipo)
      }
    })

    if (sancoes.length > 0) {
      console.log("[v0] Loop de sanções concluído. Pontuação após sanções:", pontos)
    }

    // Buscar avaliações de desempenho
    const avaliacoes = allAvaliacoes.filter((a: any) => a.employee_id === String(funcionario.id))
    console.log("[v0] Avaliações encontradas:", avaliacoes.length)

    avaliacoes.forEach((a: any) => {
      const pontuacao = a.pontuacao || 0
      const primeiroDigito = Math.floor(pontuacao / 10)
      pontos += primeiroDigito
      console.log(`[v0] +${primeiroDigito} pontos (avaliação ${pontuacao}%). Pontuação atual:`, pontos)
    })

    // Buscar fiscalizações
    const fiscalizacoes = allFiscalizacoes.filter((f: any) => f.employee_id === String(funcionario.id))
    console.log("[v0] Fiscalizações encontradas:", fiscalizacoes.length)

    fiscalizacoes.forEach((f: any) => {
      const pontuacao = f.pontuacao || 0
      const primeiroDigito = Math.floor(pontuacao / 10)
      pontos += primeiroDigito
      console.log(`[v0] +${primeiroDigito} pontos (fiscalização ${pontuacao}%). Pontuação atual:`, pontos)
    })

    // Bônus de destaque
    if (funcionario.status === "Destaque") {
      pontos += 10
      console.log("[v0] +10 pontos (status destaque). Pontuação atual:", pontos)
    }

    console.log("[v0] ===== Pontuação final para", funcionario.nome + ":", pontos, "=====")
    return pontos
  }
  // --- Fim das modificações para calcularPontuacaoGeral ---

  const abrirModalExclusao = (funcionario: any) => {
    setFuncionarioParaExcluir(funcionario)
    setSenhaExclusao("") // Limpar senha a cada abertura
    setShowDeleteModal(true)
  }

  const excluirFuncionario = async () => {
    if (!funcionarioParaExcluir) return

    try {
      const { error } = await supabase.from("employees").delete().eq("id", funcionarioParaExcluir.id)
      if (error) throw error

      triggerSync()
      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso!",
      })
      setShowDeleteModal(false)
      setFuncionarioParaExcluir(null)
      setSenhaExclusao("")
      // Se estiver na tela de detalhes ou formulário, voltar para a lista
      if (view !== "list") {
        voltarParaLista()
      }
    } catch (error: any) {
      console.error("Erro ao excluir funcionário:", error)
      toast({
        title: "Erro",
        description: `Erro ao excluir funcionário: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const abrirModalStatusRapido = (func: any) => {
    console.log("[v0] Clicou no badge de status do funcionário:", func.nome)
    console.log("[v0] Status atual:", func.status)
    setFuncionarioStatusSelecionado(func)
    // setTempStatus(func.status) // This was not being used in the new dialog structure
    setStatusModalAberto(true)
    console.log("[v0] statusModalAberto definido como true")

    // Verificar se o estado foi realmente atualizado
    setTimeout(() => {
      console.log("[v0] Verificando statusModalAberto após timeout:", statusModalAberto)
    }, 100)
  }

  // Renomeado para salvarStatusRapido para evitar conflito com a função salvarStatus original
  // This function is no longer directly used due to the new dialog structure, but is kept for reference
  // const salvarStatusRapido = async () => {
  //   if (!funcionarioStatusSelecionado || !tempStatus) return

  //   try {
  //     const { error } = await supabase
  //       .from("employees")
  //       .update({
  //         status: tempStatus,
  //         ...(tempStatus === "Destaque" && { points: (funcionarioStatusSelecionado.points || 0) + 30 }),
  //         updated_at: new Date().toISOString(),
  //       })
  //       .eq("id", funcionarioStatusSelecionado.id)

  //     if (error) throw error

  //     toast({
  //       title: "Status atualizado",
  //       description: "O status do funcionário foi atualizado com sucesso.",
  //     })

  //     setStatusModalAberto(false)
  //     setFuncionarioStatusSelecionado(null)
  //     setTempStatus("") // Limpa o status temporário
  //     // Trigger sync to update the list immediately
  //     await triggerSync()
  //   } catch (error: any) {
  //     toast({
  //       title: "Erro ao atualizar status",
  //       description: error.message,
  //       variant: "destructive",
  //     })
  //   }
  // }

  const salvarStatus = async () => {
    if (!selectedFuncionario || !tempStatus) return

    try {
      const statusComDataLimite = ["Em férias", "Aviso prévio", "Em Experiência"]

      if (tempStatus === "INATIVO") {
        setStatusComData(tempStatus)
        setShowStatusModal(false)
        setMostrarModalDemissaoRapido(true) // Mudado de setMostrarModalDemissao para setMostrarModalDemissaoRapido
        return
      }

      if (statusComDataLimite.includes(tempStatus)) {
        setStatusComData(tempStatus)
        setShowStatusModal(false)
        setShowDateModal(true)
        return
      }

      // Handling "Em Afastamento" status
      if (tempStatus === "Em Afastamento") {
        setStatusComData(tempStatus)
        setShowStatusModal(false)
        setShowDateModal(true) // Reusing the date modal for afastamento
        return
      }

      const updates: any = {
        status: tempStatus,
        updated_at: new Date().toISOString(),
      }

      if (tempStatus === "Destaque") {
        const hoje = new Date()
        const fim = new Date()
        fim.setDate(fim.getDate() + 30)

        updates.destaque_inicio = hoje.toISOString()
        updates.data_limite = fim.toISOString().split("T")[0] // Adiciona data limite para destaque
        updates.destaque_count = (selectedFuncionario.destaqueCount || 0) + 1
        updates.ultimo_destaque = hoje.toISOString()
      } else {
        // Resetar campos de destaque se o status não for Destaque
        updates.destaque_inicio = null
        updates.destaque_fim = null
        updates.destaque_count = null
        updates.ultimo_destaque = null
        updates.data_limite = null // Limpa data limite se não for um status que a requer
      }

      // Atualizar no Supabase
      const { error } = await supabase.from("employees").update(updates).eq("id", selectedFuncionario.id)

      if (error) throw error

      // Atualizar estado local
      const funcionariosAtualizados = funcionarios.map((f: any) =>
        f.id === selectedFuncionario.id ? { ...f, ...updates } : f,
      )
      setFuncionarios(funcionariosAtualizados)
      setSelectedFuncionario({ ...selectedFuncionario, ...updates })

      // Disparar sincronização global
      await triggerSync()

      toast({
        title: "Status atualizado",
        description:
          tempStatus === "Destaque"
            ? "Status alterado para Destaque e 10 pontos adicionados!"
            : "O status do funcionário foi atualizado com sucesso.",
      })

      setShowStatusModal(false)
      setTempStatus("")
    } catch (error: any) {
      console.error("[v0] Erro ao salvar status:", error)
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestão de Funcionários</h1>
          <div className="text-sm text-gray-500">Carregando dados em tempo real...</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const modals = (
    <>
      {mostrarModalDemissao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Informações da Demissão</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dataDemissao">Data da Demissão</Label>
                <Input
                  id="dataDemissao"
                  type="date"
                  value={dataDemissao}
                  onChange={(e) => setDataDemissao(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="motivoDemissao">Motivo da Demissão</Label>
                <Textarea
                  id="motivoDemissao"
                  value={motivoDemissao}
                  onChange={(e) => setMotivoDemissao(e.target.value)}
                  placeholder="Descreva o motivo da demissão..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarModalDemissao(false)
                  setDataDemissao("")
                  setMotivoDemissao("")
                }}
                className="w-full"
              >
                Cancelar
              </Button>
              <Button onClick={confirmarDemissao} className="w-full">
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de demissão rápido (novo) */}
      {mostrarModalDemissaoRapido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Confirmação de Demissão</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Confirme os detalhes para marcar {selectedFuncionario?.nome} como INATIVO.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dataDemissaoModal">Data da Demissão</Label>
                <Input
                  id="dataDemissaoModal"
                  type="date"
                  value={dataDemissaoModal}
                  onChange={(e) => setDataDemissaoModal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="motivoDemissaoModal">Motivo da Demissão</Label>
                <Textarea
                  id="motivoDemissaoModal"
                  value={motivoDemissaoModal}
                  onChange={(e) => setMotivoDemissaoModal(e.target.value)}
                  placeholder="Descreva o motivo da demissão..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setMostrarModalDemissaoRapido(false)} className="w-full">
                Cancelar
              </Button>
              <Button onClick={confirmarDemissaoModal} className="w-full">
                Confirmar Demissão
              </Button>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={excluirFuncionario}
        senha={senhaExclusao}
        setSenha={setSenhaExclusao}
      />
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              {statusComData === "Em Afastamento" ? "Informações de Afastamento" : "Selecione a Data Limite"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusComData === "Em Afastamento"
                ? `Defina a data de início e o motivo do afastamento para ${selectedFuncionario?.nome}.`
                : `Defina a data limite para o status: ${statusComData}`}
            </p>
            <div className="space-y-4">
              <Label htmlFor="selectedDate">
                {statusComData === "Em Afastamento" ? "Data de Início do Afastamento" : "Data Limite"}
              </Label>
              <Input
                id="selectedDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
              {statusComData === "Em Afastamento" && (
                <>
                  <Label htmlFor="motivoAfastamento">Motivo do Afastamento</Label>
                  <Textarea
                    id="motivoAfastamento"
                    value={funcionario.motivoAfastamento || ""}
                    onChange={(e) => setFuncionario({ ...funcionario, motivoAfastamento: e.target.value })}
                    placeholder="Descreva o motivo do afastamento..."
                    rows={3}
                  />
                </>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDateModal(false)} className="w-full">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (statusComData === "Em Afastamento") {
                    // Lógica para salvar afastamento
                    const atualizacaoAfastamento = {
                      status: "Em Afastamento", // Ensure status is updated
                      data_afastamento: selectedDate,
                      motivo_afastamento: funcionario.motivoAfastamento,
                      updated_at: new Date().toISOString(),
                      data_limite: null, // Clear data_limite when status is Em Afastamento
                    }
                    supabase
                      .from("employees")
                      .update(atualizacaoAfastamento)
                      .eq("id", selectedFuncionario?.id)
                      .then(({ error }) => {
                        if (error) throw error
                        toast({ title: "Sucesso", description: "Afastamento registrado com sucesso!" })
                        triggerSync()
                        setShowDateModal(false)
                        setSelectedDate("")
                        setFuncionario({ ...funcionario, dataAfastamento: "", motivoAfastamento: "" }) // Reset states related to the form itself
                        setStatusComData("") // Clear statusComData state
                      })
                      .catch((e) =>
                        toast({
                          title: "Erro",
                          description: `Falha ao registrar afastamento: ${e.message}`,
                          variant: "destructive",
                        }),
                      )
                  } else {
                    salvarStatusComData() // Lógica para outros status com data
                  }
                }}
                className="w-full"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
      <StatusModal
        showStatusModal={statusModalAberto}
        setShowStatusModal={setStatusModalAberto}
        tempStatus={tempStatus} // Note: tempStatus might not be directly used here anymore depending on new logic
        setTempStatus={setTempStatus}
        salvarStatus={mudarStatusRapido} // Use mudarStatusRapido for quick status changes
        selectedFuncionario={funcionarioStatusSelecionado}
        funcionarios={funcionarios}
        calcularPontuacaoGeral={calcularPontuacaoGeral}
      />
    </>
  )

  if (view === "list") {
    return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Gestão de Funcionários</CardTitle>
            </div>
            <Button onClick={adicionarFuncionario} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Funcionário
            </Button>
          </CardHeader>
        </Card>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Filter className="w-4 h-4" />
              Buscar e Filtrar
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {(searchTerm || statusFilter !== "all" || departamentoFilter !== "all" || empresaFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setDepartamentoFilter("all")
                  setEmpresaFilter("all")
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">
              Mostrar:
            </Label>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Nome, Função ou Nível..." // Alterado placeholder
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusFilter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Em férias">Em férias</SelectItem>
                      <SelectItem value="Aviso prévio">Aviso prévio</SelectItem>
                      <SelectItem value="Em Experiência">Em Experiência</SelectItem>
                      <SelectItem value="Em Afastamento">Em Afastamento</SelectItem>
                      <SelectItem value="Destaque">Destaque</SelectItem>
                      <SelectItem value="INATIVO">INATIVO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departamentoFilter">Nível</Label> {/* Renomeado para Nível */}
                  <Select value={departamentoFilter} onValueChange={setDepartamentoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os Níveis" /> {/* Alterado placeholder */}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Níveis</SelectItem> {/* Alterado opção */}
                      <SelectItem value="Nível I">Nível I</SelectItem> {/* Adicionado Nível I */}
                      <SelectItem value="Nível II">Nível II</SelectItem> {/* Adicionado Nível II */}
                      <SelectItem value="Nível III">Nível III</SelectItem> {/* Adicionado Nível III */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresaFilter">Empresa</Label>
                  <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      <SelectItem value="GA SERVIÇOS">GA SERVIÇOS</SelectItem>
                      <SelectItem value="GOMES & GUIDOTTI">GOMES & GUIDOTTI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Funcionários Cadastrados</CardTitle>
              <CardDescription>
                Mostrando {currentFuncionarios.length} de {filteredFuncionarios.length} funcionários
                {filteredFuncionarios.length !== funcionarios.length && ` (${funcionarios.length} total)`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentFuncionarios.map((funcionario: any) => (
                <div
                  key={funcionario.id}
                  onClick={() => visualizarFuncionario(funcionario)} // Navega para detalhes ao clicar no card
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    funcionario.status === "INATIVO"
                      ? "bg-gray-200 hover:bg-gray-300 border-gray-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 truncate">{funcionario.nome}</h3>
                        {funcionario.pensaoAlimenticia === true || funcionario.pensaoAlimenticia === "true" ? (
                          <span className="text-orange-600" title="Possui pensão alimentícia">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                              <path d="M7 2v20" />
                              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                            </svg>
                          </span>
                        ) : null}
                        <span
                          onClick={(e) => {
                            e.stopPropagation() // Impede a navegação para detalhes ao clicar no status
                            abrirModalStatusRapido(funcionario)
                          }}
                          className={`px-3 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                            funcionario.status === "Ativo"
                              ? "bg-green-100 text-green-800"
                              : funcionario.status === "Em férias"
                                ? "bg-blue-100 text-blue-800 animate-pulse"
                                : funcionario.status === "Aviso prévio"
                                  ? "bg-red-100 text-red-800 animate-pulse"
                                  : funcionario.status === "Em Experiência"
                                    ? "bg-yellow-100 text-yellow-800 animate-pulse"
                                    : funcionario.status === "Em Afastamento"
                                      ? "bg-orange-100 text-orange-800 animate-pulse"
                                      : funcionario.status === "Destaque"
                                        ? "bg-purple-100 text-purple-800"
                                        : funcionario.status === "INATIVO"
                                          ? "bg-gray-400 text-gray-800"
                                          : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {funcionario.status}
                          {funcionario.dataLimite && (
                            <span className="ml-1 text-xs opacity-75">
                              até {new Date(funcionario.dataLimite).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        editarFuncionario(funcionario)
                      }}
                      className={`flex items-center gap-1 ${
                        funcionario.status === "INATIVO"
                          ? "bg-gray-300 text-gray-600 border-gray-400 hover:bg-gray-400"
                          : ""
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    {/* Botão de exclusão */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation() // Impede a navegação para detalhes ao clicar no botão
                        abrirModalExclusao(funcionario)
                      }}
                      className={`flex items-center gap-1 ${
                        funcionario.status === "INATIVO"
                          ? "bg-gray-300 text-gray-600 border-gray-400 hover:bg-gray-400"
                          : "text-red-600 hover:text-red-700"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {currentFuncionarios.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {filteredFuncionarios.length === 0
                  ? "Nenhum funcionário encontrado com os filtros aplicados."
                  : "Nenhum funcionário para exibir."}
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  // CHANGE: Fixed the conditional rendering structure - moved details view inside proper conditional
  if (view === "details") {
    const funcionarioDependentes = getDependentesByFuncionario(selectedFuncionario?.id || 0)
    const funcionarioDocumentos = getDocumentosByFuncionario(selectedFuncionario?.id || 0)
    const funcionarioHistorico = getHistoricoByFuncionario(selectedFuncionario?.id || 0)

    return (
      <>
        {modals}
        <div className="container mx-auto p-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">{selectedFuncionario?.nome}</CardTitle>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                    {selectedFuncionario ? calcularPontuacaoGeral(selectedFuncionario) : 0} pts
                  </span>
                  <button
                    onClick={() => {
                      setStatusModalAberto(true) // Open the quick status modal
                      setFuncionarioStatusSelecionado(selectedFuncionario) // Ensure the correct employee is selected
                    }}
                    className={`inline-flex items-center px-3 py-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                      selectedFuncionario?.status === "Ativo"
                        ? "bg-green-100 text-green-800"
                        : selectedFuncionario?.status === "Em férias"
                          ? "bg-blue-100 text-blue-800 animate-pulse"
                          : selectedFuncionario?.status === "Aviso prévio"
                            ? "bg-red-100 text-red-800 animate-pulse"
                            : selectedFuncionario?.status === "Em Experiência"
                              ? "bg-yellow-100 text-yellow-800 animate-pulse"
                              : selectedFuncionario?.status === "Em Afastamento"
                                ? "bg-orange-100 text-orange-800 animate-pulse"
                                : selectedFuncionario?.status === "Destaque"
                                  ? "bg-purple-100 text-purple-800"
                                  : selectedFuncionario?.status === "INATIVO"
                                    ? "bg-gray-400 text-gray-800"
                                    : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedFuncionario?.status || "Ativo"}
                  </button>
                </div>
                {(selectedFuncionario?.dataLimite || (selectedFuncionario as any)?.data_limite) && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      {selectedFuncionario?.status === "Em férias"
                        ? "Férias até:"
                        : selectedFuncionario?.status === "Aviso prévio"
                          ? "Aviso prévio até:"
                          : selectedFuncionario?.status === "Em Experiência"
                            ? "Experiência até:"
                            : selectedFuncionario?.status === "Em Afastamento"
                              ? "Afastamento até:" // Changed label for Afastamento
                              : selectedFuncionario?.status === "INATIVO" // Adicionando condição para INATIVO
                                ? "Demitido em:"
                                : "Período até:"}{" "}
                      <span className="font-semibold text-gray-900">
                        {new Date(
                          selectedFuncionario?.dataLimite ||
                            (selectedFuncionario as any)?.data_limite ||
                            (selectedFuncionario as any)?.data_demissao || // Adicionando data_demissao
                            (selectedFuncionario as any)?.data_afastamento, // Adicionando data_afastamento
                        ).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => editarFuncionario(selectedFuncionario!)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" onClick={voltarParaLista}>
                  Voltar à Lista
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="funcionarios" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="funcionarios">Informações</TabsTrigger>
              <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="funcionarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                      <p className="text-sm">{selectedFuncionario?.nome}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                      <p className="text-sm">{selectedFuncionario?.cpf}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Nascimento</Label>
                      <p className="text-sm">
                        {(selectedFuncionario as any)?.data_nascimento
                          ? new Date((selectedFuncionario as any).data_nascimento).toLocaleDateString("pt-BR")
                          : "Não informado"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">RG</Label>
                      <p className="text-sm">{(selectedFuncionario as any)?.rg || "Não informado"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações Profissionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Função</Label>
                      <p className="text-sm">{selectedFuncionario?.funcao || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nível</Label>
                      <p className="text-sm">{selectedFuncionario?.nivel || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Empresa</Label>
                      <p className="text-sm">{selectedFuncionario?.empresa || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Setor/Lotação/Posto</Label>
                      <p className="text-sm">{selectedFuncionario?.departamento || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Admissão</Label>
                      <p className="text-sm">
                        {(selectedFuncionario as any)?.data_admissao
                          ? new Date((selectedFuncionario as any).data_admissao).toLocaleDateString("pt-BR")
                          : "Não informado"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Salário</Label>
                      <p className="text-sm">
                        {selectedFuncionario?.salario
                          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              Number(selectedFuncionario.salario),
                            )
                          : "Não informado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pensão Alimentícia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Possui Pensão Alimentícia</Label>
                      <p className="text-sm">
                        {selectedFuncionario?.pensaoAlimenticia === true ||
                        selectedFuncionario?.pensaoAlimenticia === "true"
                          ? "Sim"
                          : "Não"}
                      </p>
                    </div>
                    {(selectedFuncionario?.pensaoAlimenticia === true ||
                      selectedFuncionario?.pensaoAlimenticia === "true") && (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Valor</Label>
                          <p className="text-sm">
                            {selectedFuncionario.pensaoAlimenticiaValor
                              ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                  Number(selectedFuncionario.pensaoAlimenticiaValor),
                                )
                              : "Não especificado"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm font-medium text-muted-foreground">Conta do Beneficiário</Label>
                          <p className="text-sm">{selectedFuncionario.pensaoAlimenticiaConta || "Não informado"}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contato e Endereço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                      <p className="text-sm">{(selectedFuncionario as any)?.telefone || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm">{(selectedFuncionario as any)?.email || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">CEP</Label>
                      <p className="text-sm">{(selectedFuncionario as any)?.cep || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Endereço</Label>
                      <p className="text-sm">
                        {selectedFuncionario?.endereco || (selectedFuncionario as any)?.endereco || "Não informado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dependentes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Dependente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dependenteNome">Nome Completo</Label>
                      <Input
                        id="dependenteNome"
                        value={dependente.nome}
                        onChange={(e) => setDependente({ ...dependente, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dependenteCpf">CPF</Label>
                      <Input
                        id="dependenteCpf"
                        value={dependente.cpf}
                        onChange={(e) => setDependente({ ...dependente, cpf: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dependenteParentesco">Parentesco</Label>
                      <Select
                        value={dependente.parentesco}
                        onValueChange={(value) => setDependente({ ...dependente, parentesco: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o parentesco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cônjuge">Cônjuge</SelectItem>
                          <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                          <SelectItem value="Pai">Pai</SelectItem>
                          <SelectItem value="Mãe">Mãe</SelectItem>
                          <SelectItem value="Irmão(ã)">Irmão(ã)</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dependenteDataNascimento">Data de Nascimento</Label>
                      <Input
                        id="dependenteDataNascimento"
                        type="date"
                        value={dependente.dataNascimento}
                        onChange={(e) => setDependente({ ...dependente, dataNascimento: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dependenteTelefone">Telefone</Label>
                      <Input
                        id="dependenteTelefone"
                        value={dependente.telefone}
                        onChange={(e) => setDependente({ ...dependente, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="dependenteObservacoes">Observações</Label>
                      <Textarea
                        id="dependenteObservacoes"
                        value={dependente.observacoes}
                        onChange={(e) => setDependente({ ...dependente, observacoes: e.target.value })}
                      />
                    </div>

                    {isBirthCertificateRequired() && (
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="dependenteCertidao" className="text-red-600">
                          Certidão de Nascimento * (Obrigatório para menores de 14 anos)
                        </Label>
                        <Input
                          id="dependenteCertidao"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setDependenteBirthCertificate(e.target.files?.[0] || null)}
                        />
                        {dependenteBirthCertificate && (
                          <p className="text-sm text-muted-foreground">
                            Arquivo selecionado: {dependenteBirthCertificate.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={salvarDependente} disabled={uploadingFile} className="flex items-center gap-2">
                      {uploadingFile ? (
                        <>
                          <Upload className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Adicionar Dependente
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dependentes Cadastrados</CardTitle>
                  <CardDescription>Lista de dependentes do funcionário</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedFuncionario && getDependentesByFuncionario(selectedFuncionario.id).length > 0 ? (
                    <div className="space-y-4">
                      {getDependentesByFuncionario(selectedFuncionario.id).map((dep: any) => (
                        <div key={dep.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{dep.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {dep.parentesco} | CPF: {dep.cpf} | Nascimento:{" "}
                              {new Date(dep.data_nascimento).toLocaleDateString("pt-BR")}
                            </p>
                            {dep.birth_certificate_url && (
                              <div className="flex gap-2 mt-2">
                                <a
                                  href={dep.birth_certificate_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="w-4 h-4" />
                                  Visualizar Certidão
                                </a>
                                <a
                                  href={dep.birth_certificate_url}
                                  download
                                  className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                                >
                                  <Download className="w-4 h-4" />
                                  Baixar
                                </a>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removerDependente(dep.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum dependente cadastrado.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Documento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documentoTipo">Tipo de Documento</Label>
                      <Select
                        value={documento.tipoDocumento}
                        onValueChange={(value) => setDocumento({ ...documento, tipoDocumento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RG">RG</SelectItem>
                          <SelectItem value="CPF">CPF</SelectItem>
                          <SelectItem value="CNH">CNH</SelectItem>
                          <SelectItem value="CTPS">CTPS</SelectItem>
                          <SelectItem value="Título de Eleitor">Título de Eleitor</SelectItem>
                          <SelectItem value="Certificado Militar">Certificado Militar</SelectItem>
                          <SelectItem value="Certidão de Nascimento">Certidão de Nascimento</SelectItem>
                          <SelectItem value="Certidão de Casamento">Certidão de Casamento</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentoNumero">Número do Documento</Label>
                      <Input
                        id="documentoNumero"
                        value={documento.numeroDocumento}
                        onChange={(e) => setDocumento({ ...documento, numeroDocumento: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documentoDataEmissao">Data de Emissão</Label>
                      <Input
                        id="documentoDataEmissao"
                        type="date"
                        value={documento.dataEmissao}
                        onChange={(e) => setDocumento({ ...documento, dataEmissao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentoDataVencimento">Data de Vencimento</Label>
                      <Input
                        id="documentoDataVencimento"
                        type="date"
                        value={documento.dataVencimento}
                        onChange={(e) => setDocumento({ ...documento, dataVencimento: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="documentoArquivo" className="text-red-600">
                        Arquivo do Documento * (Obrigatório)
                      </Label>
                      <Input
                        id="documentoArquivo"
                        type="file"
                        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Formatos aceitos: PDF, JPG, PNG, DOC, DOCX</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={salvarDocumento} disabled={uploadingFile} className="flex items-center gap-2">
                      {uploadingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Fazendo upload...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Adicionar Documento
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentos Cadastrados</CardTitle>
                  <CardDescription>Lista de documentos do funcionário</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedFuncionario && getDocumentosByFuncionario(selectedFuncionario.id).length > 0 ? (
                    <div className="space-y-4">
                      {getDocumentosByFuncionario(selectedFuncionario.id).map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.tipo}</h4>
                            <p className="text-sm text-muted-foreground">
                              Número: {doc.numero} | Emissor: {doc.orgaoEmissor}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Emissão:{" "}
                              {doc.data_emissao ? new Date(doc.data_emissao).toLocaleDateString("pt-BR") : "N/A"}
                              {doc.data_vencimento &&
                                ` | Vencimento: ${new Date(doc.data_vencimento).toLocaleDateString("pt-BR")}`}
                            </p>
                            {doc.file_url && (
                              <div className="flex gap-2 mt-2">
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="w-4 h-4" />
                                  Visualizar
                                </a>
                                <a
                                  href={doc.file_url}
                                  download
                                  className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                                >
                                  <Download className="w-4 h-4" />
                                  Baixar
                                </a>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removerDocumento(doc.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum documento cadastrado.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="atualizacoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nova Atualização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="atualizacaoData">Data</Label>
                      <Input
                        id="atualizacaoData"
                        type="date"
                        value={novaAtualizacao.data}
                        onChange={(e) => setNovaAtualizacao({ ...novaAtualizacao, data: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="atualizacaoTexto">Atualização</Label>
                      <Input
                        id="atualizacaoTexto"
                        value={novaAtualizacao.texto}
                        onChange={(e) => setNovaAtualizacao({ ...novaAtualizacao, texto: e.target.value })}
                        placeholder="Digite a atualização..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={adicionarAtualizacao} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Nova Atualização
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Atualizações</CardTitle>
                </CardHeader>
                <CardContent>
                  {atualizacoes.length > 0 ? (
                    <div className="space-y-3">
                      {atualizacoes.map((atualizacao) => (
                        <div key={atualizacao.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {new Date(atualizacao.update_date).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{atualizacao.update_text}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removerAtualizacao(atualizacao.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma atualização registrada</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Evento ao Histórico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="historicoTipo">Tipo de Evento</Label>
                      <Select
                        value={historicoEventoState.tipoEvento}
                        onValueChange={(value) =>
                          setHistoricoEventoState({ ...historicoEventoState, tipoEvento: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positivo">✅ Positivo (+5 pontos)</SelectItem>
                          <SelectItem value="neutro">➖ Neutro (sem pontos)</SelectItem>
                          <SelectItem value="negativo">❌ Negativo (-10 pontos)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="historicoData">Data do Evento</Label>
                      <Input
                        id="historicoData"
                        type="date"
                        value={historicoEventoState.dataEvento}
                        onChange={(e) =>
                          setHistoricoEventoState({ ...historicoEventoState, dataEvento: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="historicoDescricao">Descrição</Label>
                      <Textarea
                        id="historicoDescricao"
                        value={historicoEventoState.descricao}
                        onChange={(e) =>
                          setHistoricoEventoState({ ...historicoEventoState, descricao: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={salvarHistorico} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar ao Histórico
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedFuncionario && getHistoricoByFuncionario(selectedFuncionario.id).length > 0 ? (
                    <div className="space-y-4">
                      {getHistoricoByFuncionario(selectedFuncionario.id)
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((registro) => (
                          <div key={registro.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {(registro.tipo === "positivo" || registro.event_type === "positivo") && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-600">+5 pts</span>
                                  </div>
                                )}
                                {(registro.tipo === "negativo" || registro.event_type === "negativo") && (
                                  <div className="flex items-center gap-1">
                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                    <span className="text-sm font-medium text-red-600">-10 pts</span>
                                  </div>
                                )}
                                {(registro.tipo === "neutro" || registro.event_type === "neutro") && (
                                  <div className="flex items-center gap-1">
                                    <Circle className="w-5 h-5 text-gray-400 fill-white" />
                                    <span className="text-sm font-medium text-gray-600">0 pts</span>
                                  </div>
                                )}
                                <span className="font-medium capitalize">{registro.tipo || registro.event_type}</span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(registro.data).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{registro.descricao}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerHistorico(registro.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </>
    )
  }

  // Form View
  return (
    <>
      {modals}
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{editMode ? "Editar Funcionário" : "Cadastrar Novo Funcionário"}</CardTitle>
              <CardDescription>
                {editMode
                  ? "Modifique os dados do funcionário existente."
                  : "Preencha os campos para cadastrar um novo funcionário."}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={voltarParaLista}>
              Voltar à Lista
            </Button>
          </CardHeader>
        </Card>

        <Tabs defaultValue="informacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="informacoes">Informações Gerais</TabsTrigger>
            <TabsTrigger value="dependentes" disabled={!editMode}>
              Dependentes
            </TabsTrigger>
            <TabsTrigger value="documentos" disabled={!editMode}>
              Documentos
            </TabsTrigger>
            <TabsTrigger value="atualizacoes" disabled={!editMode}>
              Atualizações
            </TabsTrigger>
            <TabsTrigger value="historico" disabled={!editMode}>
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informacoes Gerais */}
          <TabsContent value="informacoes">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Informações Pessoais */}
                  <div className="col-span-3">
                    <h2 className="text-2xl font-semibold tracking-tight">Informações Pessoais</h2>
                  </div>

                  {/* Na seção de Status do formulário, usar handleStatusChange */}
                  <div className="col-span-3 mb-4">
                    <h3 className="text-base font-semibold mb-3 text-muted-foreground">Status</h3>
                    <div className="flex gap-2 flex-wrap">
                      {["Ativo", "Em férias", "Aviso prévio", "Em Experiência", "Em Afastamento", "Destaque"].map(
                        (status) => {
                          const isSelected = funcionario.status === status
                          const getStatusColors = () => {
                            if (!isSelected) return "border-gray-300 bg-white text-gray-700 hover:border-gray-400"

                            switch (status) {
                              case "Ativo":
                                return "border-green-500 bg-green-500 text-white font-semibold"
                              case "Em férias":
                                return "border-blue-500 bg-blue-500 text-white font-semibold"
                              case "Aviso prévio":
                                return "border-red-500 bg-red-500 text-white font-semibold"
                              case "Em Experiência":
                                return "border-yellow-500 bg-yellow-500 text-white font-semibold"
                              case "Em Afastamento":
                                return "border-orange-500 bg-orange-500 text-white font-semibold"
                              case "Destaque":
                                return "border-yellow-600 bg-yellow-600 text-white font-semibold"
                              default:
                                return "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                            }
                          }

                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusChange(status)}
                              className={`px-3 py-1.5 border-2 transition-all ${getStatusColors()}`}
                              style={{ borderRadius: 0 }}
                            >
                              {status}
                            </button>
                          )
                        },
                      )}
                      {/* Adicionando botão para INATIVO */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange("INATIVO")}
                        className={`px-3 py-1.5 border-2 transition-all ${
                          funcionario.status === "INATIVO"
                            ? "border-gray-500 bg-gray-500 text-white font-semibold"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        INATIVO
                      </button>
                    </div>

                    {(mostrarModalDataLimite || funcionario.status === "Em Afastamento") && (
                      <div className="mt-4">
                        <Label htmlFor="dataLimite">
                          {funcionario.status === "Em Afastamento" ? "Data de Início do Afastamento" : "Data Limite"}
                        </Label>
                        <Input
                          id="dataLimite"
                          type="date"
                          value={funcionario.dataLimite || funcionario.dataAfastamento || ""}
                          onChange={(e) =>
                            setFuncionario({
                              ...funcionario,
                              dataLimite: e.target.value,
                              dataAfastamento:
                                funcionario.status === "Em Afastamento" ? e.target.value : funcionario.dataAfastamento,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* Adicionando modal de demissão no formulário */}
                    {mostrarModalDemissao && (
                      <div className="mt-4">
                        <Label htmlFor="dataDemissao">Data da Demissão</Label>
                        <Input
                          id="dataDemissao"
                          type="date"
                          value={funcionario.dataDemissao || dataDemissao} // Usa o valor do estado do funcionário ou do modal
                          onChange={(e) => {
                            setFuncionario({ ...funcionario, dataDemissao: e.target.value })
                            setDataDemissao(e.target.value) // Atualiza também o estado do modal
                          }}
                          className="mt-1"
                        />
                        <div className="mt-2">
                          <Label htmlFor="motivoDemissao">Motivo da Demissão</Label>
                          <Textarea
                            id="motivoDemissao"
                            value={funcionario.motivoDemissao || motivoDemissao} // Usa o valor do estado do funcionário ou do modal
                            onChange={(e) => {
                              setFuncionario({ ...funcionario, motivoDemissao: e.target.value })
                              setMotivoDemissao(e.target.value) // Atualiza também o estado do modal
                            }}
                            placeholder="Descreva o motivo da demissão..."
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button onClick={confirmarDemissao} size="sm">
                            Confirmar Demissão
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome" className="flex items-center gap-1">
                      Nome Completo
                      <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={funcionario.nome}
                      onChange={(e) => setFuncionario({ ...funcionario, nome: e.target.value })}
                      required
                      className={!funcionario.nome ? "border-red-300 focus:border-red-500" : ""}
                    />
                    {!funcionario.nome && <p className="text-xs text-red-600">Este campo é obrigatório</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={funcionario.cpf}
                      onChange={(e) => setFuncionario({ ...funcionario, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={funcionario.rg || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, rg: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rgOrgaoEmissor">Órgão Emissor (RG)</Label>
                    <Input
                      id="rgOrgaoEmissor"
                      value={funcionario.rgOrgaoEmissor || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, rgOrgaoEmissor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rgUf">UF (RG)</Label>
                    <Input
                      id="rgUf"
                      value={funcionario.rgUf || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, rgUf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rgDataExpedicao">Data de Expedição (RG)</Label>
                    <Input
                      type="date"
                      id="rgDataExpedicao"
                      value={funcionario.rgDataExpedicao || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, rgDataExpedicao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo</Label>
                    <Select
                      value={funcionario.sexo}
                      onValueChange={(value) => setFuncionario({ ...funcionario, sexo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raca">Raça/Etnia</Label>
                    <Input
                      id="raca"
                      value={funcionario.raca || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, raca: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomePai">Nome do Pai</Label>
                    <Input
                      id="nomePai"
                      value={funcionario.nomePai || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, nomePai: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomeMae">Nome da Mãe</Label>
                    <Input
                      id="nomeMae"
                      value={funcionario.nomeMae || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, nomeMae: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nacionalidade">Nacionalidade</Label>
                    <Input
                      id="nacionalidade"
                      value={funcionario.nacionalidade || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, nacionalidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grauInstrucao">Grau de Instrução</Label>
                    <Select
                      value={funcionario.grauInstrucao || ""}
                      onValueChange={(value) => setFuncionario({ ...funcionario, grauInstrucao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grau de instrução" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ensino fundamental incompleto">Ensino fundamental incompleto</SelectItem>
                        <SelectItem value="Ensino fundamental completo">Ensino fundamental completo</SelectItem>
                        <SelectItem value="Ensino médio incompleto">Ensino médio incompleto</SelectItem>
                        <SelectItem value="Ensino médio completo">Ensino médio completo</SelectItem>
                        <SelectItem value="Ensino superior incompleto">Ensino superior incompleto</SelectItem>
                        <SelectItem value="Ensino superior completo">Ensino superior completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estadoCivil">Estado Civil</Label>
                    <Select
                      value={funcionario.estadoCivil}
                      onValueChange={(value) => setFuncionario({ ...funcionario, estadoCivil: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado civil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {funcionario.estadoCivil === "casado" && (
                    <div className="space-y-2">
                      <Label htmlFor="nomeConjuge">Nome do Cônjuge</Label>
                      <Input
                        id="nomeConjuge"
                        value={funcionario.nomeConjuge || ""}
                        onChange={(e) => setFuncionario({ ...funcionario, nomeConjuge: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Informações Profissionais */}
                  <div className="col-span-3">
                    <h2 className="text-2xl font-semibold tracking-tight">Informações Profissionais</h2>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funcao" className="flex items-center gap-1">
                      Função
                      <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Select
                      value={funcionario.funcao || ""}
                      onValueChange={(value) => setFuncionario({ ...funcionario, funcao: value })}
                      required
                    >
                      <SelectTrigger className={!funcionario.funcao ? "border-red-300 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auxiliar administrativa">Auxiliar administrativa</SelectItem>
                        <SelectItem value="Auxiliar de limpeza">Auxiliar de limpeza</SelectItem>
                        <SelectItem value="Auxiliar de manutenção predial">Auxiliar de manutenção predial</SelectItem>
                        <SelectItem value="Guarda Patrimonial">Guarda Patrimonial</SelectItem>
                        <SelectItem value="Jardineiro">Jardineiro</SelectItem>
                        <SelectItem value="Monitorador/Operador de CFTV">Monitorador/Operador de CFTV</SelectItem>
                        <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                        <SelectItem value="Zelador">Zelador</SelectItem>
                      </SelectContent>
                    </Select>
                    {!funcionario.funcao && <p className="text-xs text-red-600">Este campo é obrigatório</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nivel" className="flex items-center gap-1">
                      Nível
                      <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Select
                      value={funcionario.nivel || ""}
                      onValueChange={(value) => setFuncionario({ ...funcionario, nivel: value })}
                      required
                    >
                      <SelectTrigger className={!funcionario.nivel ? "border-red-300 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nível I">Nível I</SelectItem>
                        <SelectItem value="Nível II">Nível II</SelectItem>
                        <SelectItem value="Nível III">Nível III</SelectItem>
                      </SelectContent>
                    </Select>
                    {!funcionario.nivel && <p className="text-xs text-red-600">Este campo é obrigatório</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empresa" className="flex items-center gap-1">
                      Empresa
                      <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Select
                      value={funcionario.empresa}
                      onValueChange={(value) => setFuncionario({ ...funcionario, empresa: value })}
                      required
                    >
                      <SelectTrigger className={!funcionario.empresa ? "border-red-300 focus:border-red-500" : ""}>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GA SERVIÇOS">GA SERVIÇOS</SelectItem>
                        <SelectItem value="GOMES & GUIDOTTI">GOMES & GUIDOTTI</SelectItem>
                      </SelectContent>
                    </Select>
                    {!funcionario.empresa && <p className="text-xs text-red-600">Este campo é obrigatório</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataAdmissao" className="flex items-center gap-1">
                      Data de Admissão
                      <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Input
                      type="date"
                      id="dataAdmissao"
                      value={funcionario.dataAdmissao}
                      onChange={(e) => setFuncionario({ ...funcionario, dataAdmissao: e.target.value })}
                      required
                      className={!funcionario.dataAdmissao ? "border-red-300 focus:border-red-500" : ""}
                    />
                    {!funcionario.dataAdmissao && <p className="text-xs text-red-600">Este campo é obrigatório</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      type="date"
                      id="dataNascimento"
                      value={funcionario.dataNascimento || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, dataNascimento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salario">Salário</Label>
                    <Input
                      id="salario"
                      type="number"
                      step="0.01"
                      value={funcionario.salario || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, salario: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setorLotacao">Setor/Lotação/Posto</Label>
                    <Select
                      value={funcionario.departamento || ""}
                      onValueChange={(value) => setFuncionario({ ...funcionario, departamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o setor/lotação/posto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectContent>
                          <SelectItem value="GA SERVIÇOS">GA SERVIÇOS</SelectItem>
                          <SelectItem value="GOMES & GUIDOTTI">GOMES & GUIDOTTI</SelectItem>
                          {clientesFornecedores.filter((item: any) => item.type === "cliente").length === 0 ? (
                            <SelectItem value="" disabled>
                              Nenhum cliente cadastrado
                            </SelectItem>
                          ) : (
                            clientesFornecedores
                              .filter((item: any) => item.type === "cliente")
                              .map((cliente: any) => (
                                <SelectItem key={cliente.id} value={cliente.name}>
                                  {cliente.name}
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargaHoraria">Carga Horária</Label>
                    <Input
                      id="cargaHoraria"
                      value={funcionario.cargaHoraria || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, cargaHoraria: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horarioTrabalho">Horário de Trabalho</Label>
                    <Input
                      id="horarioTrabalho"
                      value={funcionario.horarioTrabalho || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, horarioTrabalho: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reemprego">Reemprego</Label>
                    <Select
                      value={
                        typeof funcionario.reemprego === "boolean"
                          ? funcionario.reemprego
                            ? "sim"
                            : "nao"
                          : String(funcionario.reemprego)
                      }
                      onValueChange={(value) => setFuncionario({ ...funcionario, reemprego: value === "sim" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Reemprego?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                    <Input
                      id="tipoContrato"
                      value={funcionario.tipoContrato || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, tipoContrato: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utilizaValeTransporte">Utiliza Vale Transporte?</Label>
                    <Select
                      value={
                        typeof funcionario.utilizaValeTransporte === "boolean"
                          ? funcionario.utilizaValeTransporte
                            ? "sim"
                            : "nao"
                          : String(funcionario.utilizaValeTransporte)
                      }
                      onValueChange={(value) =>
                        setFuncionario({ ...funcionario, utilizaValeTransporte: value === "sim" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Utiliza Vale Transporte?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {funcionario.utilizaValeTransporte === "sim" && (
                    <div className="space-y-2">
                      <Label htmlFor="quantidadeValeTransporte">Quantidade Vale Transporte</Label>
                      <Input
                        id="quantidadeValeTransporte"
                        type="number"
                        value={funcionario.quantidadeValeTransporte || ""}
                        onChange={(e) => setFuncionario({ ...funcionario, quantidadeValeTransporte: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="pis">PIS</Label>
                    <Input
                      id="pis"
                      value={funcionario.pis || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, pis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctpsNumero">CTPS - Número</Label>
                    <Input
                      id="ctpsNumero"
                      value={funcionario.ctpsNumero || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, ctpsNumero: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctpsSerie">CTPS - Série</Label>
                    <Input
                      id="ctpsSerie"
                      value={funcionario.ctpsSerie || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, ctpsSerie: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctpsUf">CTPS - UF</Label>
                    <Input
                      id="ctpsUf"
                      value={funcionario.ctpsUf || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, ctpsUf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnhNumero">CNH - Número</Label>
                    <Input
                      id="cnhNumero"
                      value={funcionario.cnhNumero || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, cnhNumero: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnhCategoria">CNH - Categoria</Label>
                    <Input
                      id="cnhCategoria"
                      value={funcionario.cnhCategoria || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, cnhCategoria: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnhDataVencimento">CNH - Data de Vencimento</Label>
                    <Input
                      type="date"
                      id="cnhDataVencimento"
                      value={funcionario.cnhDataVencimento || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, cnhDataVencimento: e.target.value })}
                    />
                  </div>

                  {/* Pensão Alimentícia Section */}
                  <div className="col-span-3 mt-6 pt-6 border-t">
                    <h2 className="text-2xl font-semibold tracking-tight">Pensão Alimentícia</h2>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pensaoAlimenticia">
                      Possui Pensão Alimentícia? <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={
                        funcionario.pensaoAlimenticia === true || funcionario.pensaoAlimenticia === "true"
                          ? "true"
                          : "false"
                      }
                      onValueChange={(value) =>
                        setFuncionario({
                          ...funcionario,
                          pensaoAlimenticia: value === "true",
                          // Reset related fields if "Não" is selected
                          pensaoAlimenticiaValor: value === "true" ? funcionario.pensaoAlimenticiaValor : null,
                          pensaoAlimenticiaConta: value === "true" ? funcionario.pensaoAlimenticiaConta : "",
                        })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Não</SelectItem>
                        <SelectItem value="true">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(funcionario.pensaoAlimenticia === true || funcionario.pensaoAlimenticia === "true") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="pensaoAlimenticiaValor">Valor da Pensão (R$)</Label>
                        <Input
                          type="text"
                          id="pensaoAlimenticiaValor"
                          placeholder="Ex: 500,00"
                          value={funcionario.pensaoAlimenticiaValor || ""}
                          onChange={(e) => {
                            // Format as currency
                            let value = e.target.value.replace(/\D/g, "")
                            if (value) {
                              value = (Number.parseInt(value) / 100).toFixed(2)
                              value = value.replace(".", ",")
                            }
                            setFuncionario({ ...funcionario, pensaoAlimenticiaValor: value })
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pensaoAlimenticiaConta">Conta do Beneficiário</Label>
                        <Input
                          type="text"
                          id="pensaoAlimenticiaConta"
                          placeholder="Ex: Banco, Agência, Conta"
                          value={funcionario.pensaoAlimenticiaConta || ""}
                          onChange={(e) => setFuncionario({ ...funcionario, pensaoAlimenticiaConta: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {/* Contato e Endereço */}
                  <div className="col-span-3 mt-6 pt-6 border-t">
                    <h2 className="text-2xl font-semibold tracking-tight">Contato e Endereço</h2>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={funcionario.telefone || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, telefone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={funcionario.email || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={funcionario.cep || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, cep: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Input
                      id="endereco"
                      value={funcionario.endereco || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, endereco: e.target.value })}
                      placeholder=""
                    />
                  </div>

                  {/* Observações */}
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={funcionario.observacoes || ""}
                      onChange={(e) => setFuncionario({ ...funcionario, observacoes: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Leave Information Section */}
                  {funcionario.status === "Em Afastamento" && (
                    <>
                      <div className="col-span-3 mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">Afastamento</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataAfastamento">Data de Início do Afastamento</Label>
                        <Input
                          type="date"
                          id="dataAfastamento"
                          value={funcionario.dataAfastamento || ""}
                          onChange={(e) => setFuncionario({ ...funcionario, dataAfastamento: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="motivoAfastamento">Motivo do Afastamento</Label>
                        <Textarea
                          id="motivoAfastamento"
                          value={funcionario.motivoAfastamento || ""}
                          onChange={(e) => setFuncionario({ ...funcionario, motivoAfastamento: e.target.value })}
                          placeholder="Descreva o motivo do afastamento..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <Button
                    onClick={() => {
                      console.log("[v0] Botão Cadastrar/Atualizar clicado")
                      console.log("[v0] Dados do funcionário:", funcionario)
                      salvarFuncionario()
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {editMode ? "Atualizar Funcionário" : "Cadastrar Funcionário"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependentes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Dependente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dependenteNome">Nome Completo</Label>
                    <Input
                      id="dependenteNome"
                      value={dependente.nome}
                      onChange={(e) => setDependente({ ...dependente, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependenteCpf">CPF</Label>
                    <Input
                      id="dependenteCpf"
                      value={dependente.cpf}
                      onChange={(e) => setDependente({ ...dependente, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependenteParentesco">Parentesco</Label>
                    <Select
                      value={dependente.parentesco}
                      onValueChange={(value) => setDependente({ ...dependente, parentesco: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parentesco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cônjuge">Cônjuge</SelectItem>
                        <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                        <SelectItem value="Pai">Pai</SelectItem>
                        <SelectItem value="Mãe">Mãe</SelectItem>
                        <SelectItem value="Irmão(ã)">Irmão(ã)</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependenteDataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dependenteDataNascimento"
                      type="date"
                      value={dependente.dataNascimento}
                      onChange={(e) => setDependente({ ...dependente, dataNascimento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependenteTelefone">Telefone</Label>
                    <Input
                      id="dependenteTelefone"
                      value={dependente.telefone}
                      onChange={(e) => setDependente({ ...dependente, telefone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="dependenteObservacoes">Observações</Label>
                    <Textarea
                      id="dependenteObservacoes"
                      value={dependente.observacoes}
                      onChange={(e) => setDependente({ ...dependente, observacoes: e.target.value })}
                    />
                  </div>

                  {isBirthCertificateRequired() && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="dependenteCertidao" className="text-red-600">
                        Certidão de Nascimento * (Obrigatório para menores de 14 anos)
                      </Label>
                      <Input
                        id="dependenteCertidao"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setDependenteBirthCertificate(e.target.files?.[0] || null)}
                      />
                      {dependenteBirthCertificate && (
                        <p className="text-sm text-muted-foreground">
                          Arquivo selecionado: {dependenteBirthCertificate.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={salvarDependente} disabled={uploadingFile} className="flex items-center gap-2">
                    {uploadingFile ? (
                      <>
                        <Upload className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Adicionar Dependente
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dependentes Cadastrados</CardTitle>
                <CardDescription>Lista de dependentes do funcionário</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFuncionario && getDependentesByFuncionario(selectedFuncionario.id).length > 0 ? (
                  <div className="space-y-4">
                    {getDependentesByFuncionario(selectedFuncionario.id).map((dep: any) => (
                      <div key={dep.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{dep.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dep.parentesco} | CPF: {dep.cpf} | Nascimento:{" "}
                            {new Date(dep.data_nascimento).toLocaleDateString("pt-BR")}
                          </p>
                          {dep.birth_certificate_url && (
                            <div className="flex gap-2 mt-2">
                              <a
                                href={dep.birth_certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="w-4 h-4" />
                                Visualizar Certidão
                              </a>
                              <a
                                href={dep.birth_certificate_url}
                                download
                                className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                              >
                                <Download className="w-4 h-4" />
                                Baixar
                              </a>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removerDependente(dep.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum dependente cadastrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentoTipo">Tipo de Documento</Label>
                    <Select
                      value={documento.tipoDocumento}
                      onValueChange={(value) => setDocumento({ ...documento, tipoDocumento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RG">RG</SelectItem>
                        <SelectItem value="CPF">CPF</SelectItem>
                        <SelectItem value="CNH">CNH</SelectItem>
                        <SelectItem value="CTPS">CTPS</SelectItem>
                        <SelectItem value="Título de Eleitor">Título de Eleitor</SelectItem>
                        <SelectItem value="Certificado Militar">Certificado Militar</SelectItem>
                        <SelectItem value="Certidão de Nascimento">Certidão de Nascimento</SelectItem>
                        <SelectItem value="Certidão de Casamento">Certidão de Casamento</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentoNumero">Número do Documento</Label>
                    <Input
                      id="documentoNumero"
                      value={documento.numeroDocumento}
                      onChange={(e) => setDocumento({ ...documento, numeroDocumento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentoDataEmissao">Data de Emissão</Label>
                    <Input
                      id="documentoDataEmissao"
                      type="date"
                      value={documento.dataEmissao}
                      onChange={(e) => setDocumento({ ...documento, dataEmissao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentoDataVencimento">Data de Vencimento</Label>
                    <Input
                      id="documentoDataVencimento"
                      type="date"
                      value={documento.dataVencimento}
                      onChange={(e) => setDocumento({ ...documento, dataVencimento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="documentoArquivo" className="text-red-600">
                      Arquivo do Documento * (Obrigatório)
                    </Label>
                    <Input
                      id="documentoArquivo"
                      type="file"
                      onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Formatos aceitos: PDF, JPG, PNG, DOC, DOCX</p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={salvarDocumento} disabled={uploadingFile} className="flex items-center gap-2">
                    {uploadingFile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fazendo upload...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Adicionar Documento
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentos Cadastrados</CardTitle>
                <CardDescription>Lista de documentos do funcionário</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFuncionario && getDocumentosByFuncionario(selectedFuncionario.id).length > 0 ? (
                  <div className="space-y-4">
                    {getDocumentosByFuncionario(selectedFuncionario.id).map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{doc.tipo}</h4>
                          <p className="text-sm text-muted-foreground">
                            Número: {doc.numero} | Emissor: {doc.orgaoEmissor}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Emissão: {doc.data_emissao ? new Date(doc.data_emissao).toLocaleDateString("pt-BR") : "N/A"}
                            {doc.data_vencimento &&
                              ` | Vencimento: ${new Date(doc.data_vencimento).toLocaleDateString("pt-BR")}`}
                          </p>
                          {doc.file_url && (
                            <div className="flex gap-2 mt-2">
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="w-4 h-4" />
                                Visualizar
                              </a>
                              <a
                                href={doc.file_url}
                                download
                                className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                              >
                                <Download className="w-4 h-4" />
                                Baixar
                              </a>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removerDocumento(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum documento cadastrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atualizacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nova Atualização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="atualizacaoData">Data</Label>
                    <Input
                      id="atualizacaoData"
                      type="date"
                      value={novaAtualizacao.data}
                      onChange={(e) => setNovaAtualizacao({ ...novaAtualizacao, data: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="atualizacaoTexto">Atualização</Label>
                    <Input
                      id="atualizacaoTexto"
                      value={novaAtualizacao.texto}
                      onChange={(e) => setNovaAtualizacao({ ...novaAtualizacao, texto: e.target.value })}
                      placeholder="Digite a atualização..."
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={adicionarAtualizacao} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Atualização
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atualizações</CardTitle>
              </CardHeader>
              <CardContent>
                {atualizacoes.length > 0 ? (
                  <div className="space-y-3">
                    {atualizacoes.map((atualizacao) => (
                      <div key={atualizacao.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {new Date(atualizacao.update_date).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{atualizacao.update_text}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerAtualizacao(atualizacao.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma atualização registrada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Evento ao Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="historicoTipo">Tipo de Evento</Label>
                    <Select
                      value={historicoEventoState.tipoEvento}
                      onValueChange={(value) => setHistoricoEventoState({ ...historicoEventoState, tipoEvento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positivo">✅ Positivo (+5 pontos)</SelectItem>
                        <SelectItem value="neutro">➖ Neutro (sem pontos)</SelectItem>
                        <SelectItem value="negativo">❌ Negativo (-10 pontos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="historicoData">Data do Evento</Label>
                    <Input
                      id="historicoData"
                      type="date"
                      value={historicoEventoState.dataEvento}
                      onChange={(e) => setHistoricoEventoState({ ...historicoEventoState, dataEvento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="historicoDescricao">Descrição</Label>
                    <Textarea
                      id="historicoDescricao"
                      value={historicoEventoState.descricao}
                      onChange={(e) => setHistoricoEventoState({ ...historicoEventoState, descricao: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={salvarHistorico} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar ao Histórico
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFuncionario && getHistoricoByFuncionario(selectedFuncionario.id).length > 0 ? (
                  <div className="space-y-4">
                    {getHistoricoByFuncionario(selectedFuncionario.id)
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .map((registro) => (
                        <div key={registro.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {(registro.tipo === "positivo" || registro.event_type === "positivo") && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">+5 pts</span>
                                </div>
                              )}
                              {(registro.tipo === "negativo" || registro.event_type === "negativo") && (
                                <div className="flex items-center gap-1">
                                  <TrendingDown className="w-5 h-5 text-red-600" />
                                  <span className="text-sm font-medium text-red-600">-10 pts</span>
                                </div>
                              )}
                              {(registro.tipo === "neutro" || registro.event_type === "neutro") && (
                                <div className="flex items-center gap-1">
                                  <Circle className="w-5 h-5 text-gray-400 fill-white" />
                                  <span className="text-sm font-medium text-gray-600">0 pts</span>
                                </div>
                              )}
                              <span className="font-medium capitalize">{registro.tipo || registro.event_type}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(registro.data).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{registro.descricao}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removerHistorico(registro.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
