"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Eye, Send, ClipboardList, Star, MessageSquare, Link2, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useEmployeesWithRefresh } from "@/hooks/use-realtime"
import { employeeRelatedOperations } from "@/lib/database/operations"

interface Avaliacao {
  id: number
  avaliado: string
  tipoAvaliado: "colaborador" | "lideranca"
  avaliador: string
  tipoAvaliacao: "interna" | "externa"
  tipoFormulario: "colega" | "lider"
  status: "pendente" | "concluida"
  pontuacao?: number
  dataAvaliacao: string
  linkExterno?: string
}

interface AvaliacaoAgrupada {
  funcionario: string
  tipoAvaliado: "colaborador" | "lideranca"
  avaliacoes: Avaliacao[]
  totalAvaliacoes: number
}

const perguntasColega = [
  "Demonstra pontualidade e assiduidade",
  "Cumpre prazos estabelecidos",
  "Apresenta qualidade no trabalho executado",
  "Trabalha bem em equipe",
  "Comunica-se de forma clara e eficaz",
  "Mantém bom relacionamento interpessoal",
  "Demonstra responsabilidade com recursos da empresa",
  "Apresenta postura profissional adequada",
  "Mantém organização no ambiente de trabalho",
  "Demonstra iniciativa e proatividade",
  "Resolve problemas de forma eficiente",
  "Adapta-se bem a mudanças",
  "Busca desenvolvimento e aprendizado contínuo",
  "Demonstra criatividade na resolução de problemas",
  "Cumpre normas e procedimentos da empresa",
  "Demonstra comprometimento com resultados",
  "Apresenta capacidade de trabalhar sob pressão",
  "Contribui para um ambiente de trabalho positivo",
  "Demonstra conhecimento técnico adequado",
  "Mantém discrição e confidencialidade quando necessário",
]

const perguntasLider = [
  "Demonstra visão estratégica e capacidade de planejamento",
  "Toma decisões assertivas e fundamentadas",
  "Comunica-se de forma clara e inspiradora com a equipe",
  "Desenvolve e motiva os membros da equipe",
  "Delega responsabilidades de forma eficaz",
  "Resolve conflitos de maneira construtiva",
  "Demonstra inteligência emocional no relacionamento com a equipe",
  "Estabelece metas claras e acompanha resultados",
  "Promove um ambiente de trabalho colaborativo e inclusivo",
  "Demonstra capacidade de adaptação a mudanças organizacionais",
  "Gerencia recursos de forma eficiente e responsável",
  "Promove o desenvolvimento profissional da equipe",
  "Demonstra ética e integridade em suas ações",
  "Apresenta capacidade de negociação e persuasão",
  "Mantém-se atualizado com tendências do setor",
  "Demonstra capacidade de inovação e melhoria contínua",
  "Gerencia crises e situações de pressão com eficácia",
  "Promove a cultura organizacional e valores da empresa",
  "Demonstra capacidade de coaching e mentoria",
  "Apresenta resultados consistentes e sustentáveis",
]

export default function AvaliacaoDesempenho() {
  const [view, setView] = useState<"list" | "new">("list")
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [avaliacaoParaExcluir, setAvaliacaoParaExcluir] = useState<Avaliacao | null>(null)
  const [senhaExclusao, setSenhaExclusao] = useState("")

  const { data: funcionarios = [], loading: loadingEmployees, refresh: refreshEmployees } = useEmployeesWithRefresh()

  const [novaAvaliacao, setNovaAvaliacao] = useState({
    avaliado: "",
    tipoAvaliado: "",
    avaliador: "",
    tipoFormulario: "",
    metodoAvaliacao: "",
  })

  const [respostasAvaliacao, setRespostasAvaliacao] = useState<Record<number, number>>({})
  const [observacoes, setObservacoes] = useState("")
  const [showAvaliacaoInterna, setShowAvaliacaoInterna] = useState(false)

  const [showLinkExterno, setShowLinkExterno] = useState(false)
  const [linkGerado, setLinkGerado] = useState("")

  const [showModal, setShowModal] = useState(false)
  const [showVisualizacao, setShowVisualizacao] = useState(false)
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<Avaliacao | null>(null)
  const [showListaAvaliacoes, setShowListaAvaliacoes] = useState(false)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<AvaliacaoAgrupada | null>(null)

  const getPerguntasAvaliacao = () => {
    return novaAvaliacao.tipoFormulario === "lider" ? perguntasLider : perguntasColega
  }

  const calcularPontuacao = () => {
    const perguntas = getPerguntasAvaliacao()
    const respostas = Object.values(respostasAvaliacao)
    if (respostas.length !== perguntas.length) return 0

    const soma = respostas.reduce((acc, valor) => acc + valor, 0)
    const maxPontos = perguntas.length * 5 // 5 é a pontuação máxima (excelente)
    return Math.round((soma / maxPontos) * 100)
  }

  const podeAvaliar = (funcionario: string, tipoFormulario: "colega" | "lider"): boolean => {
    const hoje = new Date()
    const avaliacoesFuncionario = avaliacoes.filter(
      (av) => av.avaliado === funcionario && av.tipoFormulario === tipoFormulario,
    )

    if (avaliacoesFuncionario.length === 0) return true

    const ultimaAvaliacao = avaliacoesFuncionario.sort(
      (a, b) => new Date(b.dataAvaliacao).getTime() - new Date(a.dataAvaliacao).getTime(),
    )[0]

    const dataUltimaAvaliacao = new Date(ultimaAvaliacao.dataAvaliacao)
    const diferencaDias = Math.floor((hoje.getTime() - dataUltimaAvaliacao.getTime()) / (1000 * 60 * 60 * 24))

    return diferencaDias >= 30
  }

  const agruparAvaliacoes = (): AvaliacaoAgrupada[] => {
    const grupos: { [key: string]: AvaliacaoAgrupada } = {}

    avaliacoes.forEach((avaliacao) => {
      if (!grupos[avaliacao.avaliado]) {
        grupos[avaliacao.avaliado] = {
          funcionario: avaliacao.avaliado,
          tipoAvaliado: avaliacao.tipoAvaliado,
          avaliacoes: [],
          totalAvaliacoes: 0,
        }
      }
      grupos[avaliacao.avaliado].avaliacoes.push(avaliacao)
      grupos[avaliacao.avaliado].totalAvaliacoes++
    })

    return Object.values(grupos)
  }

  const calcularPontuacaoMedia = (avaliacoes: Avaliacao[]): number => {
    const avaliacoesConcluidas = avaliacoes.filter((av) => av.status === "concluida" && av.pontuacao)
    if (avaliacoesConcluidas.length === 0) return 0

    const soma = avaliacoesConcluidas.reduce((acc, av) => acc + (av.pontuacao || 0), 0)
    return Math.round(soma / avaliacoesConcluidas.length)
  }

  const handleNovaAvaliacao = () => {
    const funcionario = funcionarios.find((f) => f.id.toString() === novaAvaliacao.avaliado)
    if (!funcionario) return

    if (!podeAvaliar(funcionario.nome, novaAvaliacao.tipoFormulario as "colega" | "lider")) {
      toast({
        title: "Avaliação não permitida",
        description: "Este funcionário já foi avaliado com este tipo de formulário nos últimos 30 dias.",
        variant: "destructive",
      })
      return
    }

    if (novaAvaliacao.metodoAvaliacao === "interna") {
      setShowAvaliacaoInterna(true)
    } else if (novaAvaliacao.metodoAvaliacao === "externa") {
      // Gerar link externo
      const tipoFormulario = novaAvaliacao.tipoFormulario
      const link = `https://forms.gle/${tipoFormulario}-${funcionario?.nome.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`
      setLinkGerado(link)
      setShowLinkExterno(true)
    }
  }

  const salvarAvaliacaoInterna = async () => {
    console.log("[v0] Iniciando salvamento de avaliação interna...")
    const pontuacao = calcularPontuacao()
    const funcionario = funcionarios.find((f) => f.id.toString() === novaAvaliacao.avaliado)

    if (!funcionario) {
      console.log("[v0] Funcionário não encontrado!")
      return
    }

    console.log("[v0] Funcionário encontrado:", funcionario.nome)
    console.log("[v0] Pontuação calculada:", pontuacao)

    try {
      console.log("[v0] Chamando employeeRelatedOperations.evaluations.create...")

      const dadosAdicionais = {
        avaliador: novaAvaliacao.avaliador,
        tipoFormulario: novaAvaliacao.tipoFormulario,
        tipoAvaliacao: "interna",
        respostas: respostasAvaliacao,
        observacoesTexto: observacoes,
      }

      const result = await employeeRelatedOperations.evaluations.create({
        employee_id: funcionario.id,
        pontuacao: pontuacao,
        data: new Date().toISOString().split("T")[0],
        observacoes: JSON.stringify(dadosAdicionais),
      })

      console.log("[v0] Avaliação salva com sucesso:", result)

      console.log("[v0] Recalculando pontos do funcionário...")
      const { recalculateEmployeePoints } = await import("@/lib/database/operations")
      const newPoints = await recalculateEmployeePoints(funcionario.id)
      console.log("[v0] Novos pontos calculados e salvos no banco:", newPoints)

      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("[v0] Recarregando dados dos funcionários...")
      await refreshEmployees()

      await loadAvaliacoes()

      setShowAvaliacaoInterna(false)
      setView("list")
      setNovaAvaliacao({ avaliado: "", tipoAvaliado: "", avaliador: "", tipoFormulario: "", metodoAvaliacao: "" })
      setRespostasAvaliacao({})
      setObservacoes("")

      toast({
        title: "Avaliação salva com sucesso!",
        description: `Pontuação do funcionário atualizada para ${newPoints} pontos.`,
      })
    } catch (error) {
      console.error("[v0] Erro ao salvar avaliação:", error)
      toast({
        title: "Erro ao salvar avaliação",
        description: error instanceof Error ? error.message : "Não foi possível salvar a avaliação no banco de dados.",
        variant: "destructive",
      })
    }
  }

  const salvarAvaliacaoExterna = async () => {
    console.log("[v0] Iniciando salvamento de avaliação externa...")
    const funcionario = funcionarios.find((f) => f.id.toString() === novaAvaliacao.avaliado)

    if (!funcionario) {
      console.log("[v0] Funcionário não encontrado!")
      return
    }

    console.log("[v0] Funcionário encontrado:", funcionario.nome)
    console.log("[v0] Link gerado:", linkGerado)

    try {
      console.log("[v0] Chamando employeeRelatedOperations.evaluations.create...")

      const dadosAdicionais = {
        avaliador: novaAvaliacao.avaliador,
        tipoFormulario: novaAvaliacao.tipoFormulario,
        tipoAvaliacao: "externa",
        status: "pendente",
        linkExterno: linkGerado,
      }

      const result = await employeeRelatedOperations.evaluations.create({
        employee_id: funcionario.id,
        pontuacao: 0, // Será atualizado quando a avaliação externa for concluída
        data: new Date().toISOString().split("T")[0],
        observacoes: JSON.stringify(dadosAdicionais),
      })

      console.log("[v0] Avaliação salva com sucesso:", result)

      // Recarregar avaliações
      await loadAvaliacoes()

      setShowLinkExterno(false)
      setView("list")
      setNovaAvaliacao({ avaliado: "", tipoAvaliado: "", avaliador: "", tipoFormulario: "", metodoAvaliacao: "" })
      toast({ title: "Link de avaliação gerado com sucesso!" })
    } catch (error) {
      console.error("[v0] Erro ao salvar avaliação:", error)
      toast({
        title: "Erro ao salvar avaliação",
        description: error instanceof Error ? error.message : "Não foi possível salvar a avaliação no banco de dados.",
        variant: "destructive",
      })
    }
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGerado)
    toast({ title: "Link copiado para a área de transferência!" })
  }

  const abrirWhatsApp = () => {
    const funcionario = funcionarios.find((f) => f.id.toString() === novaAvaliacao.avaliado)
    const mensagem = `Olá! Você foi selecionado para avaliar o desempenho de ${funcionario?.nome}. Por favor, acesse o link: ${linkGerado}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`
    window.open(whatsappUrl, "_blank")
  }

  const visualizarAvaliacao = (avaliacao: Avaliacao) => {
    setAvaliacaoSelecionada(avaliacao)
    setShowVisualizacao(true)
  }

  const abrirLink = (avaliacao: Avaliacao) => {
    if (avaliacao.linkExterno) {
      const funcionario = funcionarios.find((f) => f.nome === avaliacao.avaliado)
      const mensagem = `Olá! Você foi selecionado para avaliar o desempenho de ${avaliacao.avaliado}. Por favor, acesse o link: ${avaliacao.linkExterno}`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`
      window.open(whatsappUrl, "_blank")
    } else {
      toast({ title: "Link não disponível para esta avaliação" })
    }
  }

  const visualizarListaAvaliacoes = (grupo: AvaliacaoAgrupada) => {
    setFuncionarioSelecionado(grupo)
    setShowListaAvaliacoes(true)
  }

  useEffect(() => {
    loadAvaliacoes()
  }, [])

  const loadAvaliacoes = async () => {
    try {
      console.log("[v0] Carregando avaliações do Supabase...")
      setLoading(true)

      const todosOsFuncionarios = await employeeRelatedOperations.evaluations.getAll()

      console.log("[v0] Avaliações carregadas:", todosOsFuncionarios.length)

      // Converter dados do Supabase para o formato da interface
      const avaliacoesFormatadas: Avaliacao[] = todosOsFuncionarios.map((item: any) => {
        // Parse dos dados adicionais armazenados em JSON no campo observacoes
        let dadosAdicionais: any = {}
        try {
          dadosAdicionais = item.observacoes ? JSON.parse(item.observacoes) : {}
        } catch (e) {
          console.error("[v0] Erro ao fazer parse de observacoes:", e)
        }

        return {
          id: item.id,
          avaliado: item.employee?.nome || "Funcionário não encontrado",
          tipoAvaliado: "colaborador",
          avaliador: dadosAdicionais.avaliador || "Não informado",
          tipoAvaliacao: dadosAdicionais.tipoAvaliacao || "interna",
          tipoFormulario: dadosAdicionais.tipoFormulario || "colega",
          status: dadosAdicionais.status || (item.pontuacao > 0 ? "concluida" : "pendente"),
          pontuacao: item.pontuacao,
          dataAvaliacao: item.data,
          linkExterno: dadosAdicionais.linkExterno,
        }
      })

      setAvaliacoes(avaliacoesFormatadas)
      console.log("[v0] Avaliações formatadas e definidas no estado")
    } catch (error) {
      console.error("[v0] Erro ao carregar avaliações:", error)
      toast({
        title: "Erro ao carregar avaliações",
        description:
          error instanceof Error ? error.message : "Não foi possível carregar as avaliações do banco de dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExcluirAvaliacao = async () => {
    if (senhaExclusao !== "123456789") {
      toast({
        title: "Senha incorreta",
        description: "A senha digitada está incorreta. Tente novamente.",
        variant: "destructive",
      })
      return
    }

    if (!avaliacaoParaExcluir) return

    try {
      console.log("[v0] Excluindo avaliação:", avaliacaoParaExcluir.id)

      await employeeRelatedOperations.evaluations.delete(avaliacaoParaExcluir.id)

      // Recalcular pontos do funcionário
      const funcionario = funcionarios.find((f) => f.nome === avaliacaoParaExcluir.avaliado)
      if (funcionario) {
        const { recalculateEmployeePoints } = await import("@/lib/database/operations")
        await recalculateEmployeePoints(funcionario.id)
        await refreshEmployees()
      }

      await loadAvaliacoes()

      setShowDeleteDialog(false)
      setAvaliacaoParaExcluir(null)
      setSenhaExclusao("")

      toast({
        title: "Avaliação excluída",
        description: "A avaliação foi excluída com sucesso e os pontos foram recalculados.",
      })
    } catch (error) {
      console.error("[v0] Erro ao excluir avaliação:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a avaliação. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (loadingEmployees || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p>Carregando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === "new") {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nova Avaliação de Desempenho</h1>
          </div>
          <Button variant="outline" onClick={() => setView("list")}>
            Voltar à Lista
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração da Avaliação</CardTitle>
            <CardDescription>Defina os parâmetros para a avaliação de desempenho</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funcionário a ser avaliado</Label>
                <Select
                  value={novaAvaliacao.avaliado}
                  onValueChange={(value) => {
                    const funcionario = funcionarios.find((f) => f.id.toString() === value)
                    setNovaAvaliacao((prev) => ({
                      ...prev,
                      avaliado: value,
                      tipoAvaliado: "colaborador", // Simplificado
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(funcionarios) &&
                      funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quem vai avaliar</Label>
                <Input
                  value={novaAvaliacao.avaliador}
                  onChange={(e) => setNovaAvaliacao((prev) => ({ ...prev, avaliador: e.target.value }))}
                  placeholder="Digite o nome do avaliador"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Avaliação</Label>
              <RadioGroup
                value={novaAvaliacao.tipoFormulario}
                onValueChange={(value) => setNovaAvaliacao((prev) => ({ ...prev, tipoFormulario: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="colega" id="colega" />
                  <Label htmlFor="colega">Avaliação de Colega</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lider" id="lider" />
                  <Label htmlFor="lider">Avaliação de Líder</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Método de Avaliação</Label>
              <RadioGroup
                value={novaAvaliacao.metodoAvaliacao}
                onValueChange={(value) => setNovaAvaliacao((prev) => ({ ...prev, metodoAvaliacao: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interna" id="interna" />
                  <Label htmlFor="interna" className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Avaliar por aqui
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="externa" id="externa" />
                  <Label htmlFor="externa" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar para avaliar
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={handleNovaAvaliacao}
              disabled={
                !novaAvaliacao.avaliado ||
                !novaAvaliacao.avaliador ||
                !novaAvaliacao.tipoFormulario ||
                !novaAvaliacao.metodoAvaliacao
              }
              className="w-full"
            >
              {novaAvaliacao.metodoAvaliacao === "interna" ? "Iniciar Avaliação" : "Gerar Link"}
            </Button>
          </CardContent>
        </Card>

        {/* Modal de Avaliação Interna */}
        <Dialog open={showAvaliacaoInterna} onOpenChange={setShowAvaliacaoInterna}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Avaliação de Desempenho - {novaAvaliacao.tipoFormulario === "lider" ? "Líder" : "Colega"}
              </DialogTitle>
              <DialogDescription>
                Avaliando: {funcionarios.find((f) => f.id.toString() === novaAvaliacao.avaliado)?.nome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {getPerguntasAvaliacao().map((pergunta, index) => (
                <div key={index} className="space-y-3">
                  <Label className="text-sm font-medium">
                    {index + 1}. {pergunta}
                  </Label>
                  <RadioGroup
                    value={respostasAvaliacao[index]?.toString() || ""}
                    onValueChange={(value) =>
                      setRespostasAvaliacao((prev) => ({ ...prev, [index]: Number.parseInt(value) }))
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id={`${index}-1`} />
                      <Label htmlFor={`${index}-1`} className="text-red-600">
                        Ruim
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id={`${index}-2`} />
                      <Label htmlFor={`${index}-2`} className="text-orange-600">
                        Regular
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3" id={`${index}-3`} />
                      <Label htmlFor={`${index}-3`} className="text-yellow-600">
                        Bom
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4" id={`${index}-4`} />
                      <Label htmlFor={`${index}-4`} className="text-blue-600">
                        Ótimo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id={`${index}-5`} />
                      <Label htmlFor={`${index}-5`} className="text-green-600">
                        Excelente
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}

              <div className="space-y-2">
                <Label>Observações Adicionais</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Comentários adicionais sobre o desempenho..."
                  rows={4}
                />
              </div>

              {Object.keys(respostasAvaliacao).length === getPerguntasAvaliacao().length && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Pontuação: {calcularPontuacao()}%</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAvaliacaoInterna(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={salvarAvaliacaoInterna}
                  disabled={Object.keys(respostasAvaliacao).length !== getPerguntasAvaliacao().length}
                >
                  Salvar Avaliação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Link Externo */}
        <Dialog open={showLinkExterno} onOpenChange={setShowLinkExterno}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link de Avaliação Gerado</DialogTitle>
              <DialogDescription>
                Formulário para avaliar: {funcionarios.find((f) => f.id.toString() === novaAvaliacao.avaliado)?.nome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Link do Formulário</Label>
                <div className="flex gap-2">
                  <Input value={linkGerado} readOnly className="flex-1" />
                  <Button variant="outline" size="sm" onClick={copiarLink}>
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowLinkExterno(false)}>
                  Cancelar
                </Button>
                <Button onClick={abrirWhatsApp} className="bg-green-600 hover:bg-green-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar via WhatsApp
                </Button>
                <Button onClick={salvarAvaliacaoExterna}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const avaliacoesAgrupadas = agruparAvaliacoes()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">Avaliação de Desempenho</CardTitle>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Avaliação de Desempenho</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    setShowModal(false)
                    setView("new")
                  }}
                  className="w-full"
                >
                  Criar Nova Avaliação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Avaliações Cadastradas</CardTitle>
              <CardDescription>Lista de todas as avaliações de desempenho agrupadas por funcionário</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar avaliações..." className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {avaliacoesAgrupadas.map((grupo) => (
              <div
                key={grupo.funcionario}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => visualizarListaAvaliacoes(grupo)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{grupo.funcionario}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded-none">
                      {calcularPontuacaoMedia(grupo.avaliacoes)}% média
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {grupo.totalAvaliacoes} avaliação{grupo.totalAvaliacoes > 1 ? "ões" : ""} registrada
                    {grupo.totalAvaliacoes > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      visualizarListaAvaliacoes(grupo)
                    }}
                    title="Ver todas as avaliações"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showListaAvaliacoes} onOpenChange={setShowListaAvaliacoes}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliações - {funcionarioSelecionado?.funcionario}</DialogTitle>
            <DialogDescription>Histórico de avaliações do funcionário</DialogDescription>
          </DialogHeader>

          {funcionarioSelecionado && (
            <div className="space-y-4">
              {funcionarioSelecionado.avaliacoes
                .sort((a, b) => new Date(b.dataAvaliacao).getTime() - new Date(a.dataAvaliacao).getTime())
                .map((avaliacao) => (
                  <div
                    key={avaliacao.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setAvaliacaoSelecionada(avaliacao)
                        setShowVisualizacao(true)
                        setShowListaAvaliacoes(false)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {avaliacao.tipoFormulario === "lider" ? "Avaliação de Líder" : "Avaliação de Colega"}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-none ${
                            avaliacao.status === "concluida" ? "bg-black text-white" : "bg-yellow-500 text-black"
                          }`}
                        >
                          {avaliacao.status === "concluida" ? "Concluída" : "Pendente"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Avaliador: {avaliacao.avaliador} | Data:{" "}
                        {new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR")}
                        {avaliacao.pontuacao && ` | Pontuação: ${avaliacao.pontuacao}%`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setAvaliacaoParaExcluir(avaliacao)
                          setShowDeleteDialog(true)
                        }}
                        title="Excluir avaliação"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {avaliacao.linkExterno && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirLink(avaliacao)
                          }}
                          title="Abrir link da avaliação"
                        >
                          <Link2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setAvaliacaoSelecionada(avaliacao)
                          setShowVisualizacao(true)
                          setShowListaAvaliacoes(false)
                        }}
                        title="Visualizar avaliação"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowListaAvaliacoes(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Digite a senha para confirmar a exclusão desta avaliação de desempenho.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {avaliacaoParaExcluir && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium">Avaliação a ser excluída:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {avaliacaoParaExcluir.avaliado} -{" "}
                  {avaliacaoParaExcluir.tipoFormulario === "lider" ? "Avaliação de Líder" : "Avaliação de Colega"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Data: {new Date(avaliacaoParaExcluir.dataAvaliacao).toLocaleDateString("pt-BR")}
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
                  setAvaliacaoParaExcluir(null)
                  setSenhaExclusao("")
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleExcluirAvaliacao} disabled={!senhaExclusao}>
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização da Avaliação */}
      <Dialog open={showVisualizacao} onOpenChange={setShowVisualizacao}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Avaliação</DialogTitle>
            <DialogDescription>
              {avaliacaoSelecionada && (
                <>
                  Avaliado: {avaliacaoSelecionada.avaliado} | Avaliador: {avaliacaoSelecionada.avaliador} | Data:{" "}
                  {new Date(avaliacaoSelecionada.dataAvaliacao).toLocaleDateString("pt-BR")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {avaliacaoSelecionada && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Tipo de Avaliado:</Label>
                  <p className="text-sm text-muted-foreground">
                    {avaliacaoSelecionada.tipoAvaliado === "lideranca" ? "Liderança" : "Colaborador"}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Tipo de Formulário:</Label>
                  <p className="text-sm text-muted-foreground">
                    {avaliacaoSelecionada.tipoFormulario === "lider" ? "Avaliação de Líder" : "Avaliação de Colega"}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Status:</Label>
                  <p className="text-sm text-muted-foreground">
                    {avaliacaoSelecionada.status === "concluida" ? "Concluída" : "Pendente"}
                  </p>
                </div>
                {avaliacaoSelecionada.pontuacao && (
                  <div>
                    <Label className="font-medium">Pontuação:</Label>
                    <p className="text-sm text-muted-foreground">{avaliacaoSelecionada.pontuacao}%</p>
                  </div>
                )}
              </div>

              {avaliacaoSelecionada.status === "concluida" && (
                <div className="space-y-4">
                  <Label className="font-medium">Perguntas e Respostas:</Label>
                  <div className="space-y-3">
                    {(avaliacaoSelecionada.tipoFormulario === "lider" ? perguntasLider : perguntasColega).map(
                      (pergunta, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="text-sm font-medium mb-2">
                            {index + 1}. {pergunta}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Resposta:</span>
                            <span className="text-sm font-medium text-green-600">
                              {/* Simulando resposta - em um sistema real, isso viria do banco de dados */}
                              {["Ruim", "Regular", "Bom", "Ótimo", "Excelente"][Math.floor(Math.random() * 5)]}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {avaliacaoSelecionada.linkExterno && (
                <div className="space-y-2">
                  <Label className="font-medium">Link da Avaliação:</Label>
                  <div className="flex gap-2">
                    <Input value={avaliacaoSelecionada.linkExterno} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(avaliacaoSelecionada.linkExterno!)
                        toast({ title: "Link copiado!" })
                      }}
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowVisualizacao(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
