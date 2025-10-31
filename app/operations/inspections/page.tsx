"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Eye, User, MapPin, Loader2, Trash2 } from "lucide-react"
import { useEmployees } from "@/hooks/use-employees"
import { employeeRelatedOperations, clientSupplierOperations } from "@/lib/database/operations"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Inspection {
  id: string
  type: "employee" | "location"
  employeeName?: string
  location?: string
  date: string
  inspector: string
  score?: number
  status: "completed" | "pending"
  answers?: Record<number, string>
}

interface InspectionQuestion {
  id: number
  question: string
  category: string
}

const employeeInspectionQuestions: InspectionQuestion[] = [
  { id: 1, question: "O funcionário demonstra organização em suas tarefas diárias?", category: "organização" },
  { id: 2, question: "Cumpre os horários estabelecidos de forma consistente?", category: "pontualidade" },
  { id: 3, question: "Assume responsabilidade por suas ações e decisões?", category: "responsabilidade" },
  { id: 4, question: "Mantém postura profissional no ambiente de trabalho?", category: "profissionalismo" },
  { id: 5, question: "Demonstra iniciativa para resolver problemas?", category: "proatividade" },
  { id: 6, question: "Colabora efetivamente com colegas de trabalho?", category: "colaboração" },
  { id: 7, question: "Comunica-se de forma clara e objetiva?", category: "comunicação" },
  { id: 8, question: "Adapta-se bem a mudanças e novas situações?", category: "adaptabilidade" },
  { id: 9, question: "Demonstra conhecimento técnico adequado para sua função?", category: "competência" },
  { id: 10, question: "Mantém foco e concentração durante as atividades?", category: "concentração" },
  { id: 11, question: "Busca aprender e se desenvolver profissionalmente?", category: "desenvolvimento" },
  { id: 12, question: "Respeita normas e procedimentos da empresa?", category: "disciplina" },
  { id: 13, question: "Demonstra calma em situações de pressão?", category: "controle_emocional" },
  { id: 14, question: "Mantém relacionamento cordial com superiores?", category: "relacionamento" },
  { id: 15, question: "Cuida adequadamente dos equipamentos e materiais?", category: "cuidado" },
  { id: 16, question: "Demonstra criatividade na resolução de problemas?", category: "criatividade" },
  { id: 17, question: "Mantém ambiente de trabalho limpo e organizado?", category: "organização" },
  { id: 18, question: "Demonstra liderança quando necessário?", category: "liderança" },
  { id: 19, question: "É confiável para executar tarefas importantes?", category: "confiabilidade" },
  { id: 20, question: "Demonstra comprometimento com os objetivos da empresa?", category: "comprometimento" },
]

const locationInspectionQuestions: InspectionQuestion[] = [
  { id: 1, question: "O local apresenta condições adequadas de limpeza e organização?", category: "organização" },
  { id: 2, question: "Os equipamentos estão em bom estado de funcionamento?", category: "equipamentos" },
  { id: 3, question: "As normas de segurança estão sendo seguidas adequadamente?", category: "segurança" },
  { id: 4, question: "O ambiente oferece condições ergonômicas apropriadas?", category: "ergonomia" },
  { id: 5, question: "A iluminação do local é adequada para as atividades?", category: "infraestrutura" },
  { id: 6, question: "A ventilação e temperatura estão em níveis confortáveis?", category: "infraestrutura" },
  { id: 7, question: "Os materiais necessários estão disponíveis e organizados?", category: "recursos" },
  { id: 8, question: "O espaço físico é suficiente para as atividades desenvolvidas?", category: "infraestrutura" },
  { id: 9, question: "As saídas de emergência estão desobstruídas e sinalizadas?", category: "segurança" },
  { id: 10, question: "Os equipamentos de proteção individual estão disponíveis?", category: "segurança" },
  { id: 11, question: "O local favorece a produtividade dos funcionários?", category: "produtividade" },
  { id: 12, question: "A comunicação entre setores flui adequadamente neste local?", category: "comunicação" },
  { id: 13, question: "O ambiente promove o trabalho em equipe?", category: "colaboração" },
  { id: 14, question: "As instalações elétricas estão em condições seguras?", category: "segurança" },
  { id: 15, question: "O local atende às normas de acessibilidade?", category: "acessibilidade" },
  { id: 16, question: "A manutenção preventiva é realizada regularmente?", category: "manutenção" },
  { id: 17, question: "O ambiente favorece a concentração e foco no trabalho?", category: "ambiente_trabalho" },
  { id: 18, question: "Os procedimentos operacionais são facilmente executáveis no local?", category: "operacional" },
  { id: 19, question: "O local oferece condições para inovação e melhoria contínua?", category: "inovação" },
  { id: 20, question: "O ambiente geral transmite profissionalismo e qualidade?", category: "profissionalismo" },
]

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const { data: funcionarios, loading: loadingEmployees, error: employeesError } = useEmployees()
  const [clientes, setClientes] = useState<any[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [inspectionDate, setInspectionDate] = useState("")
  const [inspector, setInspector] = useState("")
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [viewInspection, setViewInspection] = useState<Inspection | null>(null)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)

  const [deleteInspection, setDeleteInspection] = useState<Inspection | null>(null)
  const [deletePassword, setDeletePassword] = useState("")

  useEffect(() => {
    const loadClientes = async () => {
      try {
        console.log("[v0] Carregando clientes do Supabase...")
        const data = await clientSupplierOperations.getAll()

        console.log("[v0] Dados brutos de clientes:", data)
        console.log("[v0] Total de registros:", data.length)
        console.log("[v0] Primeiro registro:", data[0])

        const clientesOnly = data

        console.log("[v0] Clientes após filtro:", clientesOnly)
        console.log(
          "[v0] Nomes dos clientes (campo 'name'):",
          clientesOnly.map((c: any) => c.name || c.fantasy_name),
        )

        setClientes(clientesOnly)
        console.log("[v0] Clientes carregados:", clientesOnly.length)
      } catch (error) {
        console.error("[v0] Erro ao carregar clientes:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar clientes do banco de dados",
          variant: "destructive",
        })
      } finally {
        setLoadingClientes(false)
      }
    }

    loadClientes()
  }, [toast])

  useEffect(() => {
    const loadInspections = async () => {
      try {
        console.log("[v0] Carregando fiscalizações do Supabase...")

        // Carregar fiscalizações de funcionários
        const employeeInspectionsData = await employeeRelatedOperations.inspections.getAll()

        const convertedEmployeeInspections: Inspection[] = employeeInspectionsData.map((item: any) => {
          let parsedAnswers = {}
          try {
            const observacoes = item.observacoes || ""
            const answersMatch = observacoes.match(/Respostas: ({.*})/)
            if (answersMatch) {
              parsedAnswers = JSON.parse(answersMatch[1])
            }
          } catch (e) {
            console.error("[v0] Erro ao parsear respostas:", e)
          }

          return {
            id: item.id.toString(),
            type: "employee" as const,
            employeeName: item.employees?.nome || "Funcionário não encontrado",
            date: item.data,
            inspector: item.observacoes?.match(/Inspetor: ([^\n]+)/)?.[1] || "Não informado",
            score: item.pontuacao,
            status: "completed" as const,
            answers: parsedAnswers,
          }
        })

        // Carregar fiscalizações de locais (arquivos na pasta "Fiscalizações de Locais")
        const supabase = createClient()

        // Buscar a pasta "Fiscalizações de Locais"
        const { data: folder } = await supabase
          .from("folders")
          .select("*")
          .eq("name", "Fiscalizações de Locais")
          .single()

        let locationInspections: Inspection[] = []

        if (folder) {
          // Buscar arquivos na pasta
          const { data: files } = await supabase
            .from("files")
            .select("*")
            .eq("folder_id", folder.id)
            .order("created_at", { ascending: false })

          if (files) {
            locationInspections = files.map((file: any) => {
              // Extrair informações do conteúdo
              const content = file.content || ""
              const localMatch = content.match(/Local: (.+)/)
              const dataMatch = content.match(/Data: (.+)/)
              const inspetorMatch = content.match(/Inspetor: (.+)/)
              const pontuacaoMatch = content.match(/Pontuação: (\d+)%/)
              const observacoesMatch = content.match(/Respostas: ({.*})/)

              let parsedAnswers = {}
              if (observacoesMatch) {
                try {
                  parsedAnswers = JSON.parse(observacoesMatch[1])
                } catch (e) {
                  console.error("[v0] Erro ao parsear respostas:", e)
                }
              }

              return {
                id: file.id.toString(),
                type: "location" as const,
                location: localMatch?.[1] || "Local não informado",
                date: file.created_at.split("T")[0], // Usar data de criação do arquivo
                inspector: inspetorMatch?.[1] || "Não informado",
                score: pontuacaoMatch ? Number.parseInt(pontuacaoMatch[1]) : undefined,
                status: "completed" as const,
                answers: parsedAnswers,
              }
            })
          }
        }

        // Combinar fiscalizações de funcionários e locais
        const allInspections = [...convertedEmployeeInspections, ...locationInspections]

        setInspections(allInspections)
        console.log("[v0] Fiscalizações carregadas:", {
          funcionarios: convertedEmployeeInspections.length,
          locais: locationInspections.length,
          total: allInspections.length,
        })
      } catch (error) {
        console.error("[v0] Erro ao carregar fiscalizações:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar fiscalizações do banco de dados",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInspections()
  }, [toast])

  useEffect(() => {
    console.log("[v0] Estado dos funcionários:", {
      loading: loadingEmployees,
      error: employeesError,
      count: funcionarios?.length || 0,
      funcionarios: funcionarios?.slice(0, 3),
    })
  }, [funcionarios, loadingEmployees, employeesError])

  const handleNewInspection = () => {
    setShowTypeDialog(true)
  }

  const handleTypeSelection = (type: "employee" | "location") => {
    setShowTypeDialog(false)
    if (type === "employee") {
      setShowEmployeeForm(true)
    } else {
      setShowLocationForm(true)
    }
  }

  const canCreateInspection = (employeeName: string) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const hasInspectionThisMonth = inspections.some((inspection) => {
      if (inspection.employeeName !== employeeName) return false
      const inspectionDate = new Date(inspection.date)
      return inspectionDate.getMonth() === currentMonth && inspectionDate.getFullYear() === currentYear
    })

    return !hasInspectionThisMonth
  }

  const handleSubmitEmployeeInspection = async () => {
    if (!selectedEmployee || !inspectionDate || !inspector) return

    if (!canCreateInspection(selectedEmployee)) {
      toast({
        title: "Aviso",
        description: "Este funcionário já recebeu uma fiscalização este mês.",
        variant: "destructive",
      })
      return
    }

    const totalScore = Object.values(answers).reduce((sum, answer) => sum + Number.parseInt(answer), 0)
    const averageScore = Math.round((totalScore / 20) * 20) // Convert to percentage

    const funcionario = funcionarios.find((f) => f.nome === selectedEmployee)
    if (!funcionario) {
      toast({
        title: "Erro",
        description: "Funcionário não encontrado",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("[v0] Salvando fiscalização no Supabase...")

      await employeeRelatedOperations.inspections.create({
        employee_id: funcionario.id.toString(),
        pontuacao: averageScore,
        data: inspectionDate,
        observacoes: `Inspetor: ${inspector}\nRespostas: ${JSON.stringify(answers)}`,
      })

      const newInspection: Inspection = {
        id: Date.now().toString(),
        type: "employee",
        employeeName: selectedEmployee,
        date: inspectionDate,
        inspector,
        score: averageScore,
        status: "completed",
        answers: { ...answers },
      }

      setInspections([...inspections, newInspection])
      setShowEmployeeForm(false)
      setSelectedEmployee("")
      setInspectionDate("")
      setInspector("")
      setAnswers({})

      toast({
        title: "Sucesso",
        description: "Fiscalização salva com sucesso!",
      })

      console.log("[v0] Fiscalização salva com sucesso")

      const data = await employeeRelatedOperations.inspections.getAll()
      const convertedInspections: Inspection[] = data.map((item: any) => {
        let parsedAnswers = {}
        try {
          const observacoes = item.observacoes || ""
          const answersMatch = observacoes.match(/Respostas: ({.*})/)
          if (answersMatch) {
            parsedAnswers = JSON.parse(answersMatch[1])
          }
        } catch (e) {
          console.error("[v0] Erro ao parsear respostas:", e)
        }

        return {
          id: item.id.toString(),
          type: "employee" as const,
          employeeName: item.employees?.nome || "Funcionário não encontrado",
          date: item.data,
          inspector: item.observacoes?.match(/Inspetor: ([^\n]+)/)?.[1] || "Não informado",
          score: item.pontuacao,
          status: "completed" as const,
          answers: parsedAnswers,
        }
      })
      setInspections(convertedInspections)
    } catch (error) {
      console.error("[v0] Erro ao salvar fiscalização:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar fiscalização. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitLocationInspection = async () => {
    if (!selectedLocation || !inspectionDate || !inspector) return

    const totalScore = Object.values(answers).reduce((sum, answer) => sum + Number.parseInt(answer), 0)
    const averageScore = Math.round((totalScore / 20) * 20) // Convert to percentage

    try {
      console.log("[v0] Salvando fiscalização de local no Supabase...")

      await employeeRelatedOperations.inspections.createLocationInspection({
        location: selectedLocation,
        pontuacao: averageScore,
        data: inspectionDate,
        inspector: inspector,
        observacoes: `Respostas: ${JSON.stringify(answers)}`,
      })

      const newInspection: Inspection = {
        id: Date.now().toString(),
        type: "location",
        location: selectedLocation,
        date: inspectionDate,
        inspector,
        score: averageScore,
        status: "completed",
        answers: { ...answers },
      }

      setInspections([...inspections, newInspection])
      setShowLocationForm(false)
      setSelectedLocation("")
      setInspectionDate("")
      setInspector("")
      setAnswers({})

      toast({
        title: "Sucesso",
        description: "Fiscalização de local salva com sucesso!",
      })

      console.log("[v0] Fiscalização de local salva com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao salvar fiscalização de local:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar fiscalização de local. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleDeleteInspection = async () => {
    if (!deleteInspection) return

    if (deletePassword !== "123456789") {
      toast({
        title: "Erro",
        description: "Senha incorreta",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("[v0] Excluindo fiscalização:", deleteInspection.id)

      if (deleteInspection.type === "employee") {
        // Excluir fiscalização de funcionário da tabela employee_inspections
        await employeeRelatedOperations.inspections.delete(deleteInspection.id)
      } else {
        // Excluir fiscalização de local (arquivo da tabela files)
        const supabase = createClient()
        const { error } = await supabase.from("files").delete().eq("id", deleteInspection.id)

        if (error) throw error
      }

      // Remover da lista local
      setInspections(inspections.filter((i) => i.id !== deleteInspection.id))

      toast({
        title: "Sucesso",
        description: "Fiscalização excluída com sucesso",
      })

      setDeleteInspection(null)
      setDeletePassword("")

      console.log("[v0] Fiscalização excluída com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao excluir fiscalização:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir fiscalização. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fiscalizações</h1>
          <Button onClick={handleNewInspection} className="bg-black hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Nova Fiscalização
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Carregando fiscalizações...</p>
            </div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma fiscalização registrada ainda.</p>
              <p className="text-sm mt-1">Clique em "Nova Fiscalização" para começar.</p>
            </div>
          ) : (
            inspections.map((inspection) => (
              <Card key={inspection.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            {inspection.type === "employee" ? inspection.employeeName : inspection.location}
                          </h3>
                          {inspection.score && (
                            <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded-none">
                              {inspection.score}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Fiscalização de {inspection.type === "employee" ? "funcionário" : "local"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewInspection(inspection)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteInspection(inspection)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tipo de Fiscalização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={() => handleTypeSelection("employee")} className="w-full justify-start" variant="outline">
              <User className="h-4 w-4 mr-2" />
              Fiscalização de Funcionário
            </Button>
            <Button onClick={() => handleTypeSelection("location")} className="w-full justify-start" variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Fiscalização de Local de Serviço
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Fiscalização de Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employee">Funcionário</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingEmployees
                          ? "Carregando funcionários..."
                          : employeesError
                            ? "Erro ao carregar funcionários"
                            : "Selecione o funcionário"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingEmployees ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Carregando funcionários...</span>
                      </div>
                    ) : employeesError ? (
                      <div className="p-4 text-center">
                        <span className="text-sm text-red-600">Erro ao carregar funcionários</span>
                      </div>
                    ) : funcionarios && funcionarios.length > 0 ? (
                      funcionarios.map((funcionario) => (
                        <SelectItem
                          key={funcionario.id}
                          value={funcionario.nome}
                          disabled={!canCreateInspection(funcionario.nome)}
                        >
                          {funcionario.nome} {!canCreateInspection(funcionario.nome) && "(Já fiscalizado este mês)"}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <span className="text-sm text-muted-foreground">Nenhum funcionário encontrado</span>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="inspector">Inspetor</Label>
                <Input
                  id="inspector"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="Nome do inspetor"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Questionário de Avaliação</h3>
              {employeeInspectionQuestions.map((question) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <p className="font-medium">
                      {question.id}. {question.question}
                    </p>
                    <RadioGroup
                      value={answers[question.id] || ""}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      <div className="flex space-x-6">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value.toString()} id={`q${question.id}-${value}`} />
                            <Label htmlFor={`q${question.id}-${value}`}>{value}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEmployeeForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitEmployeeInspection}
                disabled={!selectedEmployee || !inspectionDate || !inspector || Object.keys(answers).length < 20}
              >
                Salvar Fiscalização
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLocationForm} onOpenChange={setShowLocationForm}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Fiscalização de Local de Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location">Local de Serviço</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClientes ? "Carregando clientes..." : "Selecione o cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClientes ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Carregando clientes...</span>
                      </div>
                    ) : clientes && clientes.length > 0 ? (
                      clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.name || cliente.fantasy_name || "Cliente sem nome"}>
                          {cliente.name || cliente.fantasy_name || "Cliente sem nome"}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <span className="text-sm text-muted-foreground">Nenhum cliente cadastrado</span>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="inspector">Inspetor</Label>
                <Input
                  id="inspector"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="Nome do inspetor"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Questionário de Avaliação do Local</h3>
              {locationInspectionQuestions.map((question) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <p className="font-medium">
                      {question.id}. {question.question}
                    </p>
                    <RadioGroup
                      value={answers[question.id] || ""}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      <div className="flex space-x-6">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value.toString()} id={`ql${question.id}-${value}`} />
                            <Label htmlFor={`ql${question.id}-${value}`}>{value}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowLocationForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitLocationInspection}
                disabled={!selectedLocation || !inspectionDate || !inspector || Object.keys(answers).length < 20}
              >
                Salvar Fiscalização
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewInspection} onOpenChange={() => setViewInspection(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Fiscalização</DialogTitle>
          </DialogHeader>
          {viewInspection && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Tipo</Label>
                  <p className="font-medium">
                    {viewInspection.type === "employee" ? "Funcionário" : "Local de Serviço"}
                  </p>
                </div>
                <div>
                  <Label>Nome/Local</Label>
                  <p className="font-medium">{viewInspection.employeeName || viewInspection.location}</p>
                </div>
                <div>
                  <Label>Data</Label>
                  <p className="font-medium">{new Date(viewInspection.date).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <Label>Inspetor</Label>
                  <p className="font-medium">{viewInspection.inspector}</p>
                </div>
                {viewInspection.score && (
                  <div>
                    <Label>Score</Label>
                    <p className="font-medium text-blue-600">{viewInspection.score}%</p>
                  </div>
                )}
              </div>

              {viewInspection.answers && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Respostas do Questionário</h3>
                  {(viewInspection.type === "employee" ? employeeInspectionQuestions : locationInspectionQuestions).map(
                    (question) => (
                      <Card key={question.id} className="p-4">
                        <div className="space-y-2">
                          <p className="font-medium">
                            {question.id}. {question.question}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Resposta:</span>
                            <span className="font-semibold text-blue-600">
                              {viewInspection.answers[question.id] || "Não respondida"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteInspection} onOpenChange={() => setDeleteInspection(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Fiscalização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir a fiscalização de{" "}
              <span className="font-semibold">
                {deleteInspection?.type === "employee" ? deleteInspection?.employeeName : deleteInspection?.location}
              </span>
              ?
            </p>
            <div>
              <Label htmlFor="delete-password">Digite a senha para confirmar</Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Digite a senha"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteInspection(null)
                  setDeletePassword("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleDeleteInspection} variant="destructive">
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
