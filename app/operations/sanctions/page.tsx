"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, AlertTriangle, FileText, Clock, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useEmployees } from "@/hooks/use-employees"
import { employeeRelatedOperations, recalculateEmployeePoints } from "@/lib/database/operations"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"

interface Sanction {
  id: string
  employee: string
  appliedBy: string
  rule: string
  description: string
  occurrences: number
  sanctionType: string
  returnDate?: Date
  createdAt: Date
}

const applicators = ["Supervisor João", "Gerente Maria", "Coordenador Pedro", "Diretor Carlos"]

const rules = [
  // Deveres e Obrigações (Art. 2º)
  "Art. 2º - Cumprir o contrato de trabalho com zelo, atenção e competência profissional",
  "Art. 2º - Obedecer às ordens e instruções dos superiores hierárquicos",
  "Art. 2º - Sugerir medidas para maior eficiência do serviço",
  "Art. 2º - Observar a máxima disciplina no local de trabalho",
  "Art. 2º - Zelar pela ordem e asseio no local de trabalho",
  "Art. 2º - Zelar pela boa conservação das instalações, equipamentos e máquinas",
  "Art. 2º - Respeitar a honra, boa fama e integridade física de todas as pessoas",
  "Art. 2º - Responder por prejuízos causados à empresa por dolo ou culpa",

  // Uso do Uniforme (Art. 3º)
  "Art. 3º - Uso obrigatório do uniforme dentro das dependências da empresa",
  "Art. 3º - Uniforme deve estar sempre limpo e passado",
  "Art. 3º - Não danificar uniforme antes do prazo de 12 meses",

  // Horário de Trabalho (Art. 4º)
  "Art. 4º - Cumprimento rigoroso do horário de trabalho",
  "Art. 4º - Estar no local de trabalho na hora inicial",
  "Art. 4º - Bater ponto de entrada e saída uniformizado",

  // Ausências e Atrasos (Art. 6º)
  "Art. 6º - Justificar atrasos, saídas antecipadas ou faltas ao superior imediato",

  // Proibições (Art. 12º)
  "Art. 12º - Proibido ingressar ou permanecer em setores estranhos aos serviços",
  "Art. 12º - Proibido ocupar-se de atividades que prejudiquem os interesses do serviço",
  "Art. 12º - Proibido promover algazarra, brincadeiras e discussões durante a jornada",
  "Art. 12º - Proibido usar palavras ou gestos impróprios à moralidade e respeito",
  "Art. 12º - Proibido fumar em qualquer dependência da empresa",
  "Art. 12º - Proibido retirar equipamentos, objetos ou documentos sem autorização",
  "Art. 12º - Proibido propagar ou incitar insubordinação ao trabalho",
  "Art. 12º - Proibido introduzir pessoas estranhas sem autorização",
  "Art. 12º - Proibido divulgar assuntos de natureza privada da empresa",
  "Art. 12º - Proibido ingerir bebidas alcoólicas ou substâncias entorpecentes",
  "Art. 12º - Proibido envolvimento emocional afetivo entre colegas de trabalho",
  "Art. 12º - Proibido comer ou manusear alimentos fora da cozinha",
  "Art. 12º - Proibido usar rádio ou fone de ouvido para fins pessoais",
  "Art. 12º - Proibido usar telefone celular particular durante a jornada",
  "Art. 12º - Proibido amizade excessiva com contratantes",
  "Art. 12º - Proibido utilizar equipamentos do posto sem autorização",
  "Art. 12º - Proibido repassar informações da operação ao tomador do serviço",
  "Art. 12º - Proibido realizar reuniões privadas com representantes do tomador",

  // Políticas Específicas
  "Política WhatsApp - Proibido ingresso em grupos não oficiais",
  "Política WhatsApp - Proibido tratar ex-colaboradores pelo WhatsApp",
  "Política Bebidas - Proibido uso de bebidas alcoólicas e cigarros em posto de serviço",
  "Política Comunicação - Comunicação deve ser calma, objetiva e transparente",
  "Política Comunicação - Proibida retirada de materiais do posto sem comunicação",

  // Código de Conduta
  "Código de Conduta - Manter postura executiva",
  "Código de Conduta - Cuidados pessoais inadequados (homens)",
  "Código de Conduta - Uso inadequado de maquiagem",
  "Código de Conduta - Uso inadequado de adereços",
  "Código de Conduta - Tatuagens inadequadas em área aparente",
]

const getSanctionType = (occurrences: number) => {
  switch (occurrences) {
    case 1:
      return "Advertência"
    case 2:
      return "Suspensão de 1 dia"
    case 3:
      return "Suspensão de 3 dias"
    case 4:
      return "Suspensão de 5 dias"
    default:
      return "Demissão por justa causa"
  }
}

const getSanctionIcon = (sanctionType: string) => {
  if (sanctionType === "Advertência") {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }
  return <Clock className="h-4 w-4 text-red-500" />
}

const getSanctionColor = (sanctionType: string) => {
  if (sanctionType === "Advertência") {
    return "border-yellow-200 bg-yellow-50"
  }
  return "border-red-200 bg-red-50"
}

const getSanctionTagColor = (sanctionType: string) => {
  if (sanctionType === "Advertência") {
    return "bg-yellow-500 text-white"
  } else if (sanctionType === "Suspensão de 1 dia") {
    return "bg-orange-500 text-white"
  } else if (sanctionType === "Suspensão de 3 dias") {
    return "bg-pink-600 text-white"
  } else if (sanctionType === "Suspensão de 5 dias") {
    return "bg-red-600 text-white"
  }
  return "bg-gray-900 text-white"
}

export default function SanctionsPage() {
  const [sanctions, setSanctions] = useState<Sanction[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sancaoParaExcluir, setSancaoParaExcluir] = useState<Sanction | null>(null)
  const [senhaExclusao, setSenhaExclusao] = useState("")

  const [formData, setFormData] = useState({
    employee: "",
    appliedBy: "",
    rule: "",
    description: "",
    occurrences: 1,
  })
  const [returnDate, setReturnDate] = useState<Date>()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)

  const { data: funcionarios = [], loading: loadingEmployees } = useEmployees()

  useEffect(() => {
    const loadSanctions = async () => {
      try {
        console.log("[v0] Carregando sanções do Supabase...")
        const data = await employeeRelatedOperations.sanctions.getAll()

        const convertedSanctions: Sanction[] = data.map((item: any) => ({
          id: item.id.toString(),
          employee: item.employees?.nome || "Funcionário não encontrado",
          appliedBy: "Sistema",
          rule: item.descricao.split("\n\n")[0] || "",
          description: item.descricao,
          occurrences:
            item.tipo === "Advertência"
              ? 1
              : item.tipo === "Suspensão de 1 dia"
                ? 2
                : item.tipo === "Suspensão de 3 dias"
                  ? 3
                  : item.tipo === "Suspensão de 5 dias"
                    ? 4
                    : 5,
          sanctionType: item.tipo,
          createdAt: new Date(item.data),
        }))

        setSanctions(convertedSanctions)
        console.log("[v0] Sanções carregadas:", convertedSanctions.length)
      } catch (error) {
        console.error("[v0] Erro ao carregar sanções:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar sanções do banco de dados",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadSanctions()
  }, [toast])

  const handleSubmit = async () => {
    const sanctionType = getSanctionType(formData.occurrences)

    const funcionario = funcionarios.find((f) => f.nome === formData.employee)
    if (!funcionario) {
      toast({
        title: "Erro",
        description: "Funcionário não encontrado",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("[v0] Salvando sanção no Supabase...")

      let descricaoCompleta = `${formData.rule}\n\n${formData.description}\n\nAplicado por: ${formData.appliedBy}`

      if (returnDate) {
        const dataFormatada = format(returnDate, "dd/MM/yyyy", { locale: ptBR })
        descricaoCompleta += `\nData de retorno: ${dataFormatada}`
      }

      await employeeRelatedOperations.sanctions.create({
        employee_id: funcionario.id.toString(),
        tipo: sanctionType,
        descricao: descricaoCompleta,
        data: new Date().toISOString().split("T")[0],
      })

      console.log("[v0] Recalculando pontos do funcionário após sanção...")
      await recalculateEmployeePoints(funcionario.id.toString())
      console.log("[v0] Pontos recalculados com sucesso")

      const newSanction: Sanction = {
        id: Date.now().toString(),
        employee: formData.employee,
        appliedBy: formData.appliedBy,
        rule: formData.rule,
        description: formData.description,
        occurrences: formData.occurrences,
        sanctionType,
        returnDate: sanctionType.includes("Suspensão") ? returnDate : undefined,
        createdAt: new Date(),
      }

      setSanctions([...sanctions, newSanction])
      setIsDialogOpen(false)
      setFormData({
        employee: "",
        appliedBy: "",
        rule: "",
        description: "",
        occurrences: 1,
      })
      setReturnDate(undefined)

      toast({
        title: "Sucesso",
        description: "Sanção disciplinar salva e pontos recalculados com sucesso!",
      })

      console.log("[v0] Sanção salva com sucesso")

      const data = await employeeRelatedOperations.sanctions.getAll()
      const convertedSanctions: Sanction[] = data.map((item: any) => ({
        id: item.id.toString(),
        employee: item.employees?.nome || "Funcionário não encontrado",
        appliedBy: "Sistema",
        rule: item.descricao.split("\n\n")[0] || "",
        description: item.descricao,
        occurrences:
          item.tipo === "Advertência"
            ? 1
            : item.tipo === "Suspensão de 1 dia"
              ? 2
              : item.tipo === "Suspensão de 3 dias"
                ? 3
                : item.tipo === "Suspensão de 5 dias"
                  ? 4
                  : 5,
        sanctionType: item.tipo,
        createdAt: new Date(item.data),
      }))
      setSanctions(convertedSanctions)
    } catch (error) {
      console.error("[v0] Erro ao salvar sanção:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar sanção. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleExcluirSancao = async () => {
    if (senhaExclusao !== "123456789") {
      toast({
        title: "Senha incorreta",
        description: "A senha digitada está incorreta. Tente novamente.",
        variant: "destructive",
      })
      return
    }

    if (!sancaoParaExcluir) return

    try {
      console.log("[v0] Excluindo sanção:", sancaoParaExcluir.id)

      await employeeRelatedOperations.sanctions.delete(sancaoParaExcluir.id)

      // Recalcular pontos do funcionário
      const funcionario = funcionarios.find((f) => f.nome === sancaoParaExcluir.employee)
      if (funcionario) {
        await recalculateEmployeePoints(funcionario.id.toString())
      }

      // Recarregar sanções
      const data = await employeeRelatedOperations.sanctions.getAll()
      const convertedSanctions: Sanction[] = data.map((item: any) => ({
        id: item.id.toString(),
        employee: item.employees?.nome || "Funcionário não encontrado",
        appliedBy: "Sistema",
        rule: item.descricao.split("\n\n")[0] || "",
        description: item.descricao,
        occurrences:
          item.tipo === "Advertência"
            ? 1
            : item.tipo === "Suspensão de 1 dia"
              ? 2
              : item.tipo === "Suspensão de 3 dias"
                ? 3
                : item.tipo === "Suspensão de 5 dias"
                  ? 4
                  : 5,
        sanctionType: item.tipo,
        createdAt: new Date(item.data),
      }))
      setSanctions(convertedSanctions)

      setShowDeleteDialog(false)
      setSancaoParaExcluir(null)
      setSenhaExclusao("")

      toast({
        title: "Sanção excluída",
        description: "A sanção foi excluída com sucesso e os pontos foram recalculados.",
      })
    } catch (error) {
      console.error("[v0] Erro ao excluir sanção:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a sanção. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const standardText = `A conduta acima mencionada representa uma violação das normas e obrigações estabelecidas em seu contrato de trabalho e/ou no Regulamento Interno da empresa, especificamente no que se refere ao relato acima. Diante do exposto, fica aplicada a medida disciplinar a seguir e esperamos que esta medida sirva como uma oportunidade para reflexão e correção da conduta. A empresa valoriza sua contribuição e deseja que sua trajetória profissional aqui seja pautada pelo respeito às normas que garantem um ambiente de trabalho seguro, ético e produtivo para todos.

Ressaltamos que a reincidência no comportamento aqui apontado, ou o cometimento de qualquer outra falta, poderá resultar na aplicação de sanções mais severas, incluindo a possibilidade de rescisão do contrato de trabalho por justa causa, conforme previsto no Art. 482 da Consolidação das Leis do Trabalho (CLT).

Atenciosamente.`

  const currentSanctionType = getSanctionType(formData.occurrences)
  const needsReturnDate = currentSanctionType.includes("Suspensão")

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sanções Disciplinares</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                Nova Sanção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Aplicar Nova Sanção</DialogTitle>
                <DialogDescription>Preencha os dados para registrar uma nova sanção disciplinar</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee">Funcionário</Label>
                    <Select
                      value={formData.employee}
                      onValueChange={(value) => setFormData({ ...formData, employee: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.nome}>
                            {funcionario.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="appliedBy">Quem Aplica</Label>
                    <input
                      id="appliedBy"
                      type="text"
                      placeholder="Digite o nome de quem aplica a sanção"
                      value={formData.appliedBy}
                      onChange={(e) => setFormData({ ...formData, appliedBy: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rule">Regra Descumprida</Label>
                  <Select value={formData.rule} onValueChange={(value) => setFormData({ ...formData, rule: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a norma descumprida" />
                    </SelectTrigger>
                    <SelectContent>
                      {rules.map((rule) => (
                        <SelectItem key={rule} value={rule}>
                          {rule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descrição da Conduta</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o que o funcionário fez que descumpriu a norma..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed text-justify">{standardText}</p>
                </div>

                <div>
                  <Label htmlFor="occurrences">Número de Ocorrências</Label>
                  <Select
                    value={formData.occurrences.toString()}
                    onValueChange={(value) => setFormData({ ...formData, occurrences: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1ª vez - Advertência</SelectItem>
                      <SelectItem value="2">2ª vez - Suspensão de 1 dia</SelectItem>
                      <SelectItem value="3">3ª vez - Suspensão de 3 dias</SelectItem>
                      <SelectItem value="4">4ª vez - Suspensão de 5 dias</SelectItem>
                      <SelectItem value="5">5ª vez - Demissão por justa causa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    {getSanctionIcon(currentSanctionType)}
                    <span className="font-medium text-blue-900">Sanção Aplicada: {currentSanctionType}</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Desconto de pontos:</strong>{" "}
                    {currentSanctionType === "Advertência"
                      ? "-10 pontos"
                      : currentSanctionType === "Suspensão de 1 dia"
                        ? "-20 pontos"
                        : currentSanctionType === "Suspensão de 3 dias"
                          ? "-30 pontos"
                          : currentSanctionType === "Suspensão de 5 dias"
                            ? "-50 pontos"
                            : "Demissão (sem pontos)"}
                  </p>
                </div>

                {needsReturnDate && (
                  <div>
                    <Label>Data de Retorno</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !returnDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {returnDate ? format(returnDate, "PPP", { locale: ptBR }) : "Selecione a data de retorno"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={returnDate}
                          onSelect={(date) => {
                            setReturnDate(date)
                            setIsCalendarOpen(false)
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !formData.employee ||
                      !formData.appliedBy ||
                      !formData.rule ||
                      !formData.description ||
                      (needsReturnDate && !returnDate)
                    }
                  >
                    Aplicar Sanção
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sanctions List */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sanções Registradas</h2>
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500">Carregando sanções...</p>
              </CardContent>
            </Card>
          ) : sanctions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sanção registrada</h3>
                <p className="text-gray-500 text-center">
                  Clique em "Nova Sanção" para registrar a primeira sanção disciplinar.
                </p>
              </CardContent>
            </Card>
          ) : (
            sanctions.map((sanction) => (
              <Card key={sanction.id} className={cn("border hover:shadow-md transition-shadow bg-white")}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedSanction(sanction)}>
                      <CardTitle className="text-lg">{sanction.employee}</CardTitle>
                      <CardDescription>
                        Aplicado por {sanction.appliedBy} • {format(sanction.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSancaoParaExcluir(sanction)
                          setShowDeleteDialog(true)
                        }}
                        title="Excluir sanção"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div
                        className={cn(
                          "px-3 py-1 text-sm font-medium rounded-sm flex-shrink-0",
                          getSanctionTagColor(sanction.sanctionType),
                        )}
                      >
                        {sanction.sanctionType}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Digite a senha para confirmar a exclusão desta sanção disciplinar.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {sancaoParaExcluir && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium">Sanção a ser excluída:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {sancaoParaExcluir.employee} - {sancaoParaExcluir.sanctionType}
                </p>
                <p className="text-sm text-muted-foreground">
                  Data: {format(sancaoParaExcluir.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Digite a senha"
                value={senhaExclusao}
                onChange={(e) => setSenhaExclusao(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setSancaoParaExcluir(null)
                  setSenhaExclusao("")
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleExcluirSancao} disabled={!senhaExclusao}>
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal menor e branco para visualização de sanção */}
      <Dialog open={!!selectedSanction} onOpenChange={() => setSelectedSanction(null)}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sanção Disciplinar Completa</DialogTitle>
          </DialogHeader>
          {selectedSanction && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedSanction.employee}</h3>
                  <p className="text-sm text-gray-600">Aplicado por {selectedSanction.appliedBy}</p>
                  <p className="text-sm text-gray-600">
                    {format(selectedSanction.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-sm",
                    getSanctionTagColor(selectedSanction.sanctionType),
                  )}
                >
                  {selectedSanction.sanctionType}
                </div>
              </div>

              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">NOTIFICAÇÃO DISCIPLINAR</h2>
                    <p className="text-sm text-gray-600 mt-2">Grupo Athos Brasil</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm">
                        <strong>Funcionário:</strong> {selectedSanction.employee}
                      </p>
                      <p className="text-sm">
                        <strong>Aplicado por:</strong> {selectedSanction.appliedBy}
                      </p>
                      <p className="text-sm">
                        <strong>Data:</strong> {format(selectedSanction.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Norma Descumprida:</h4>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border">{selectedSanction.rule}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Descrição da Conduta:</h4>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                        {selectedSanction.description}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded border">
                      <p className="text-sm text-gray-700 leading-relaxed text-justify">
                        A conduta acima mencionada representa uma violação das normas e obrigações estabelecidas em seu
                        contrato de trabalho e/ou no Regulamento Interno da empresa, especificamente no que se refere ao
                        relato acima. Diante do exposto, fica aplicada a medida disciplinar a seguir e esperamos que
                        esta medida sirva como uma oportunidade para reflexão e correção da conduta. A empresa valoriza
                        sua contribuição e deseja que sua trajetória profissional aqui seja pautada pelo respeito às
                        normas que garantem um ambiente de trabalho seguro, ético e produtivo para todos.
                      </p>
                      <br />
                      <p className="text-sm text-gray-700 leading-relaxed text-justify">
                        Ressaltamos que a reincidência no comportamento aqui apontado, ou o cometimento de qualquer
                        outra falta, poderá resultar na aplicação de sanções mais severas, incluindo a possibilidade de
                        rescisão do contrato de trabalho por justa causa, conforme previsto no Art. 482 da Consolidação
                        das Leis do Trabalho (CLT).
                      </p>
                      <br />
                      <p className="text-sm text-gray-700">Atenciosamente.</p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Sanção Aplicada:</span>
                      </div>
                      <p className="text-sm text-yellow-700 font-medium">{selectedSanction.sanctionType}</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        <strong>Desconto de pontos:</strong>{" "}
                        {selectedSanction.sanctionType === "Advertência"
                          ? "-10 pontos"
                          : selectedSanction.sanctionType === "Suspensão de 1 dia"
                            ? "-20 pontos"
                            : selectedSanction.sanctionType === "Suspensão de 3 dias"
                              ? "-30 pontos"
                              : selectedSanction.sanctionType === "Suspensão de 5 dias"
                                ? "-50 pontos"
                                : "Demissão (sem pontos)"}
                      </p>
                      {selectedSanction.returnDate && (
                        <p className="text-sm text-yellow-700 mt-1">
                          Data de retorno: {format(selectedSanction.returnDate, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-8 pt-8">
                      <div className="text-center">
                        <div className="border-t border-gray-400 pt-2">
                          <p className="text-sm text-gray-600">Assinatura do Aplicador</p>
                          <p className="text-xs text-gray-500 mt-1">{selectedSanction.appliedBy}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="border-t border-gray-400 pt-2">
                          <p className="text-sm text-gray-600">Assinatura do Funcionário</p>
                          <p className="text-xs text-gray-500 mt-1">{selectedSanction.employee}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      const printContent = document.querySelector(".border.rounded-lg.p-6.bg-gray-50")
                      if (printContent) {
                        const printWindow = window.open("", "_blank")
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Sanção Disciplinar - ${selectedSanction.employee}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 15px; font-size: 12px; line-height: 1.4; }
                                  .header { text-align: center; margin-bottom: 20px; }
                                  .header h2 { font-size: 16px; margin: 0; }
                                  .header p { font-size: 11px; margin: 5px 0; }
                                  .content { line-height: 1.4; }
                                  .content p { margin: 8px 0; font-size: 11px; }
                                  .content strong { font-size: 11px; }
                                  .signature-area { display: flex; justify-content: space-between; margin-top: 40px; }
                                  .signature-box { text-align: center; width: 180px; }
                                  .signature-line { border-top: 1px solid #000; padding-top: 5px; margin-top: 30px; }
                                  .signature-line p { font-size: 10px; margin: 2px 0; }
                                  .signature-line small { font-size: 9px; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <h2>NOTIFICAÇÃO DISCIPLINAR</h2>
                                  <p>Grupo Athos Brasil</p>
                                </div>
                                <div class="content">
                                  <p><strong>Funcionário:</strong> ${selectedSanction.employee}</p>
                                  <p><strong>Aplicado por:</strong> ${selectedSanction.appliedBy}</p>
                                  <p><strong>Data:</strong> ${format(selectedSanction.createdAt, "dd/MM/yyyy", { locale: ptBR })}</p>
                                  <br />
                                  <p><strong>Norma Descumprida:</strong></p>
                                  <p>${selectedSanction.rule}</p>
                                  <br />
                                  <p><strong>Descrição da Conduta:</strong></p>
                                  <p>${selectedSanction.description}</p>
                                  <br />
                                  <p style="text-align: justify;">
                                    A conduta acima mencionada representa uma violação das normas e obrigações estabelecidas em seu contrato de trabalho e/ou no Regulamento Interno da empresa, especificamente no que se refere ao relato acima. Diante do exposto, fica aplicada a medida disciplinar a seguir e esperamos que esta medida sirva como uma oportunidade para reflexão e correção da conduta. A empresa valoriza sua contribuição e deseja que sua trajetória profissional aqui seja pautada pelo respeito às normas que garantem um ambiente de trabalho seguro, ético e produtivo para todos.
                                  </p>
                                  <br />
                                  <p style="text-align: justify;">
                                    Ressaltamos que a reincidência no comportamento aqui apontado, ou o cometimento de qualquer outra falta, poderá resultar na aplicação de sanções mais severas, incluindo a possibilidade de rescisão do contrato de trabalho por justa causa, conforme previsto no Art. 482 da Consolidação das Leis do Trabalho (CLT).
                                  </p>
                                  <br />
                                  <p><strong>Sanção Aplicada:</strong> ${selectedSanction.sanctionType}</p>
                                  ${selectedSanction.returnDate ? `<p><strong>Data de retorno:</strong> ${format(selectedSanction.returnDate, "dd/MM/yyyy", { locale: ptBR })}</p>` : ""}
                                  <br />
                                  <p><strong>Desconto de pontos:</strong> ${selectedSanction.sanctionType === "Advertência" ? "-10 pontos" : selectedSanction.sanctionType === "Suspensão de 1 dia" ? "-20 pontos" : selectedSanction.sanctionType === "Suspensão de 3 dias" ? "-30 pontos" : selectedSanction.sanctionType === "Suspensão de 5 dias" ? "-50 pontos" : "Demissão (sem pontos)"}</p>
                                  <br />
                                  <p>Atenciosamente.</p>
                                </div>
                                <div class="signature-area">
                                  <div class="signature-box">
                                    <div class="signature-line">
                                      <p>Assinatura do Aplicador</p>
                                      <small>${selectedSanction.appliedBy}</small>
                                    </div>
                                  </div>
                                  <div class="signature-box">
                                    <div class="signature-line">
                                      <p>Assinatura do Funcionário</p>
                                      <small>${selectedSanction.employee}</small>
                                    </div>
                                  </div>
                                </div>
                              </body>
                            </html>
                          `)
                          printWindow.document.close()
                          printWindow.print()
                        }
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
