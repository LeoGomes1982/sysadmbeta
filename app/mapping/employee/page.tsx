"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useEmployeesWithRefresh,
  useEmployeeHistory,
  useEmployeeEvaluations,
  useEmployeeInspections,
  useEmployeeSanctions,
} from "@/hooks/use-realtime"
import { useExtraServices } from "@/hooks/use-extra-services"
import Link from "next/link"

interface Funcionario {
  id: number
  nome: string
  cpf: string
  rg?: string
  cargo: string
  departamento: string
  empresa?: string
  dataAdmissao: string
  dataNascimento?: string
  salario?: string
  telefone?: string
  email?: string
  endereco?: string
  observacoes?: string
  status: string
  dataLimite?: string
  points?: number
}

export default function EmployeeMappingPage() {
  const { data: funcionarios, loading: loadingEmployees, refresh: refreshEmployees } = useEmployeesWithRefresh()

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [selectedEmployee, setSelectedEmployee] = useState<Funcionario | null>(null)
  const [showChangeOptions, setShowChangeOptions] = useState(false)
  const [selectedChangeType, setSelectedChangeType] = useState<string>("")
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<string>("")
  const [showMapping, setShowMapping] = useState(false)

  const [showSimulateDialog, setShowSimulateDialog] = useState(false)
  const [availableChanges, setAvailableChanges] = useState<string[]>([])

  const { data: historicosData } = useEmployeeHistory(selectedEmployeeId || "")
  const { data: avaliacoesData } = useEmployeeEvaluations(selectedEmployeeId || "")
  const { data: fiscalizacoesData } = useEmployeeInspections(selectedEmployeeId || "")
  const { data: sancoesData } = useEmployeeSanctions(selectedEmployeeId || "")
  const { services: servicosExtras } = useExtraServices()

  useEffect(() => {
    if (selectedEmployeeId) {
      refreshEmployees()
    }
  }, [selectedEmployeeId])

  const calculateEmployeeScore = (funcionario: Funcionario) => {
    console.log("[v0] Calculando pontuação para:", funcionario.nome)

    let pontos = 10 // Base

    // Históricos
    const historicos = historicosData.filter((h: any) => h.employee_id === funcionario.id)
    console.log("[v0] Históricos encontrados:", historicos.length)

    historicos.forEach((h: any) => {
      const tipo = h.event_type || h.tipo
      if (tipo === "positivo") {
        pontos += 5
        console.log("[v0] +5 pontos (histórico positivo)")
      } else if (tipo === "negativo") {
        pontos -= 10
        console.log("[v0] -10 pontos (histórico negativo)")
      } else if (tipo === "falta") {
        pontos -= 5
        console.log("[v0] -5 pontos (falta)")
      }
    })

    // Sanções
    const sancoes = sancoesData.filter((s: any) => s.employee_id === funcionario.id)
    console.log("[v0] Sanções encontradas:", sancoes.length)

    sancoes.forEach((s: any) => {
      const tipo = s.tipo || s.tipo_sancao || s.sanctionType
      if (tipo === "advertencia" || tipo === "Advertência") {
        pontos -= 10
        console.log("[v0] -10 pontos (advertência)")
      } else if (tipo === "suspensao_1_dia" || tipo === "Suspensão 1 dia") {
        pontos -= 10
        console.log("[v0] -10 pontos (suspensão 1 dia)")
      } else if (tipo === "suspensao_3_dias" || tipo === "Suspensão 3 dias") {
        pontos -= 20
        console.log("[v0] -20 pontos (suspensão 3 dias)")
      } else if (tipo === "suspensao_5_dias" || tipo === "Suspensão 5+ dias") {
        pontos -= 50
        console.log("[v0] -50 pontos (suspensão 5+ dias)")
      }
    })

    // Avaliações de desempenho
    const avaliacoes = avaliacoesData.filter((a: any) => a.employee_id === funcionario.id)
    console.log("[v0] Avaliações encontradas:", avaliacoes.length)

    avaliacoes.forEach((a: any) => {
      const pontuacao = a.pontuacao || 0
      const primeiroDigito = Math.floor(pontuacao / 10)
      pontos += primeiroDigito
      console.log(`[v0] +${primeiroDigito} pontos (avaliação ${pontuacao}%)`)
    })

    // Fiscalizações
    const fiscalizacoes = fiscalizacoesData.filter((f: any) => f.employee_id === funcionario.id)
    console.log("[v0] Fiscalizações encontradas:", fiscalizacoes.length)

    fiscalizacoes.forEach((f: any) => {
      const pontuacao = f.pontuacao || 0
      const primeiroDigito = Math.floor(pontuacao / 10)
      pontos += primeiroDigito
      console.log(`[v0] +${primeiroDigito} pontos (fiscalização ${pontuacao}%)`)
    })

    // Bônus de destaque
    if (funcionario.status === "Destaque") {
      pontos += 10
      console.log("[v0] +10 pontos (status destaque)")
    }

    console.log("[v0] Pontuação final calculada:", pontos)
    return pontos
  }

  const employeeScore = selectedEmployee ? calculateEmployeeScore(selectedEmployee) : 10

  const hasSanctionsThisYear = (employeeId: number) => {
    const currentYear = new Date().getFullYear()
    const employeeSanctions = sancoesData.filter((s: any) => s.employee_id === employeeId)

    return employeeSanctions.some((sancao: any) => {
      const sanctionDate = new Date(sancao.data || sancao.created_at)
      return sanctionDate.getFullYear() === currentYear
    })
  }

  const contarFaltasEAtestados = (funcionarioNome: string) => {
    const faltas = servicosExtras.filter(
      (servico) => servico.reason === "falta" && servico.absentEmployeeName === funcionarioNome,
    ).length

    const atestados = servicosExtras.filter(
      (servico) => servico.reason === "atestado" && servico.certificateEmployeeName === funcionarioNome,
    ).length

    return { faltas, atestados }
  }

  const calculateTimeAtCompany = (admissionDate: string) => {
    const admission = new Date(admissionDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - admission.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    const days = diffDays % 30

    let result = ""
    if (years > 0) result += `${years} ano${years > 1 ? "s" : ""}`
    if (months > 0) result += `${result ? ", " : ""}${months} mês${months > 1 ? "es" : ""}`
    if (days > 0 && years === 0) result += `${result ? " e " : ""}${days} dia${days > 1 ? "s" : ""}`

    return result || "Menos de 1 dia"
  }

  const countExtraServices = (employeeName: string) => {
    return servicosExtras.filter((servico) => servico.executorName === employeeName).length
  }

  const generateEvaluation = (funcionario: Funcionario, changeType: string) => {
    const score = calculateEmployeeScore(funcionario)
    const hasSanctions = hasSanctionsThisYear(funcionario.id)
    const historicosPositivos = historicosData.filter(
      (h: any) => h.employee_id === funcionario.id && (h.event_type || h.tipo) === "positivo",
    ).length
    const historicosNegativos = historicosData.filter(
      (h: any) => h.employee_id === funcionario.id && (h.event_type || h.tipo) === "negativo",
    ).length
    const totalSancoes = sancoesData.filter((s: any) => s.employee_id === funcionario.id).length

    const totalAvaliacoes = avaliacoesData.filter((a: any) => a.employee_id === funcionario.id).length
    const mediaAvaliacoes =
      avaliacoesData.length > 0
        ? Math.round(
            avaliacoesData.reduce((acc: number, a: any) => acc + (a.pontuacao || 0), 0) / avaliacoesData.length,
          )
        : 0
    const totalFiscalizacoes = fiscalizacoesData.filter((f: any) => f.employee_id === funcionario.id).length
    const mediaFiscalizacoes =
      fiscalizacoesData.length > 0
        ? Math.round(
            fiscalizacoesData.reduce((acc: number, f: any) => acc + (f.pontuacao || 0), 0) / fiscalizacoesData.length,
          )
        : 0

    const { faltas, atestados } = contarFaltasEAtestados(funcionario.nome)

    let evaluation = ""

    switch (changeType) {
      case "oportunidade":
        if (!hasSanctions && score > 80) {
          evaluation = `🌟 AVALIAÇÃO SUPER POSITIVA para ${funcionario.nome}!

✅ Critérios atendidos:
• Sem sanções disciplinares no ano atual
• Pontuação acima de 80 (${score} pontos)
• ${historicosPositivos} registros positivos no histórico
• ${totalAvaliacoes} avaliações de desempenho (média: ${mediaAvaliacoes}%)
• ${totalFiscalizacoes} fiscalizações (média: ${mediaFiscalizacoes}%)
• ${faltas} faltas registradas
• ${atestados} atestados apresentados

🎯 RECOMENDAÇÃO DETALHADA: 
Este funcionário demonstra excelência em todos os aspectos avaliados. Com uma pontuação de ${score} pontos e ausência total de sanções disciplinares no período atual, ${funcionario.nome} se destaca como um colaborador exemplar. Recomendamos fortemente sua consideração para novas oportunidades, incluindo promoções, liderança de projetos especiais, treinamentos avançados ou programas de desenvolvimento de carreira. Sua conduta irrepreensível e desempenho consistente fazem dele um candidato ideal para assumir maiores responsabilidades dentro da organização. Sugerimos que seja priorizado em processos seletivos internos e considerado para mentoria de outros funcionários.`
        } else {
          const motivosNegacao = []
          if (hasSanctions) motivosNegacao.push("possui sanções disciplinares no ano atual")
          if (score <= 80) motivosNegacao.push(`pontuação de ${score} está abaixo do mínimo exigido de 80`)

          evaluation = `⚠️ AVALIAÇÃO REGULAR para ${funcionario.nome}

❌ Critérios não atendidos:
${motivosNegacao.map((motivo) => `• ${motivo.charAt(0).toUpperCase() + motivo.slice(1)}`).join("\n")}
• ${historicosNegativos} registros negativos identificados
• ${totalAvaliacoes} avaliações de desempenho (média: ${mediaAvaliacoes}%)
• ${totalFiscalizacoes} fiscalizações (média: ${mediaFiscalizacoes}%)
• ${faltas} faltas registradas
• ${atestados} atestados apresentados

📋 RECOMENDAÇÃO DETALHADA:
Embora ${funcionario.nome} seja um membro valioso da equipe, alguns aspectos precisam ser aprimorados antes de considerarmos novas oportunidades. Vamos aguardar para que o funcionário tenha mais pontos e demonstre consistência em seu desempenho, correndo o risco de colocar em uma nova posição um colaborador que ainda não atingiu o nível de excelência esperado. Recomendamos um plano de desenvolvimento personalizado com metas claras, acompanhamento mensal do progresso e feedback construtivo. Após um período de 6 meses de melhoria contínua, poderemos reavaliar sua elegibilidade para oportunidades internas. É importante que o funcionário compreenda que esta decisão visa seu próprio crescimento profissional e o sucesso da organização.`
        }
        break

      case "julgamento_especial":
        if (score > 70 && historicosNegativos === 0 && totalSancoes === 0) {
          evaluation = `⚖️ JULGAMENTO A FAVOR DO FUNCIONÁRIO para ${funcionario.nome}

✅ Análise detalhada do histórico total:
• Pontuação excepcional: ${score} pontos (bem acima de 70)
• Registros positivos: ${historicosPositivos} ocorrências
• Registros negativos: ${historicosNegativos} (histórico limpo)
• Total de sanções: ${totalSancoes} (conduta exemplar)
• ${totalAvaliacoes} avaliações de desempenho (média: ${mediaAvaliacoes}%)
• ${totalFiscalizacoes} fiscalizações (média: ${mediaFiscalizacoes}%)
• ${faltas} faltas registradas
• ${atestados} atestados apresentados

🏆 DECISÃO FUNDAMENTADA:
Com base na análise minuciosa do histórico completo de ${funcionario.nome}, o julgamento é INEQUIVOCAMENTE FAVORÁVEL ao funcionário. Seu desempenho consistente, ausência total de problemas disciplinares e pontuação elevada demonstram um profissional comprometido e confiável. As normas da empresa devem ser aplicadas com a devida flexibilidade, considerando seu histórico exemplar e contribuições significativas para a organização. Recomendamos que qualquer situação controversa seja resolvida priorizando o bem-estar e reconhecimento deste colaborador, que claramente merece nossa confiança e apoio institucional.`
        } else {
          const problemasIdentificados = []
          if (score <= 70) problemasIdentificados.push(`pontuação de ${score} está abaixo do esperado`)
          if (historicosNegativos > 0)
            problemasIdentificados.push(`${historicosNegativos} registros negativos no histórico`)
          if (totalSancoes > 0) problemasIdentificados.push(`${totalSancoes} sanções disciplinares aplicadas`)
          if (totalAvaliacoes > 0)
            problemasIdentificados.push(`${totalAvaliacoes} avaliações de desempenho (média: ${mediaAvaliacoes}%)`)
          if (totalFiscalizacoes > 0)
            problemasIdentificados.push(`${totalFiscalizacoes} fiscalizações (média: ${mediaFiscalizacoes}%)`)
          if (faltas > 0) problemasIdentificados.push(`${faltas} faltas registradas`)
          if (atestados > 0) problemasIdentificados.push(`${atestados} atestados apresentados`)

          evaluation = `⚖️ JULGAMENTO A FAVOR DA EMPRESA para ${funcionario.nome}

❌ Análise detalhada do histórico total:
• Pontuação: ${score} pontos ${score <= 70 ? "(abaixo do padrão de 70)" : ""}
• Registros positivos: ${historicosPositivos}
• Problemas identificados: ${problemasIdentificados.join(", ")}

🏢 DECISÃO FUNDAMENTADA:
Após análise criteriosa do histórico completo de ${funcionario.nome}, o julgamento é FAVORÁVEL à empresa. Os dados apresentados indicam que o funcionário não demonstrou o nível de desempenho e conduta necessários para justificar flexibilizações nas normas organizacionais. É fundamental que as políticas da empresa sejam aplicadas rigorosamente, mantendo a equidade e os padrões de excelência estabelecidos. Recomendamos que o funcionário seja orientado sobre as expectativas da organização e receba suporte para melhorar seu desempenho, mas sempre dentro do cumprimento estrito das normas vigentes.`
        }
        break

      case "mudanca_cargo":
        evaluation = `📊 AVALIAÇÃO DETALHADA PARA MUDANÇA DE CARGO - ${funcionario.nome}

📈 Análise completa de elegibilidade:
• Pontuação atual: ${score} pontos
• Histórico positivo: ${historicosPositivos} registros
• Histórico negativo: ${historicosNegativos} registros
• Sanções no ano: ${hasSanctions ? "Sim - requer atenção" : "Não - excelente conduta"}
• Total de sanções históricas: ${totalSancoes}
• Avaliações de desempenho: ${totalAvaliacoes} (média: ${mediaAvaliacoes}%)
• Fiscalizações: ${totalFiscalizacoes} (média: ${mediaFiscalizacoes}%)
• Faltas registradas: ${faltas}
• Atestados apresentados: ${atestados}

💼 RECOMENDAÇÃO ESTRATÉGICA:
${
  score >= 80
    ? `Funcionário ALTAMENTE QUALIFICADO para mudança de cargo. Com ${score} pontos, demonstra competência técnica e comportamental necessária para assumir novas responsabilidades. Recomendamos proceder com a mudança, oferecendo período de adaptação e treinamento específico para o novo cargo.`
    : score >= 60
      ? `Funcionário com POTENCIAL MODERADO para mudança de cargo. Vamos aguardar para que o funcionário tenha mais pontos para de fato mudar ele de cargo, correndo o risco de colocar no cargo novo um colaborador que ainda precisa desenvolver certas competências. Sugerimos plano de capacitação de 3-6 meses antes da transição.`
      : `Funcionário NECESSITA DESENVOLVIMENTO antes da mudança de cargo. Com apenas ${score} pontos, recomendamos investimento em treinamento intensivo e acompanhamento próximo por pelo menos 6 meses antes de considerar a mudança.`
}`
        break

      case "mudanca_posto":
        evaluation = `📊 AVALIAÇÃO DETALHADA PARA MUDANÇA DE POSTO - ${funcionario.nome}

📈 Análise de adequação ao novo posto:
• Pontuação de desempenho: ${score} pontos
• Registros positivos: ${historicosPositivos} (demonstra adaptabilidade)
• Registros negativos: ${historicosNegativos} (pontos de atenção)
• Conduta disciplinar: ${hasSanctions ? "Possui sanções no ano" : "Conduta exemplar"}
• Histórico de sanções: ${totalSancoes} ocorrências
• Avaliações de desempenho: ${totalAvaliacoes} (média: ${mediaAvaliacoes}%)
• Fiscalizações: ${totalFiscalizacoes} (média: ${mediaFiscalizacoes}%)
• Faltas registradas: ${faltas}
• Atestados apresentados: ${atestados}

💼 ANÁLISE ESTRATÉGICA PARA MUDANÇA DE POSTO:
${
  score >= 75
    ? `Funcionário PLENAMENTE APTO para mudança de posto. Sua pontuação de ${score} e histórico positivo indicam capacidade de adaptação e excelência operacional. A mudança pode ser implementada imediatamente com período de ambientação de 30 dias.`
    : score >= 50
      ? `Funcionário com APTIDÃO CONDICIONAL para mudança de posto. Vamos aguardar para que o funcionário tenha mais pontos para de fato mudar ele de posto, correndo o risco de colocar no posto novo um colaborador descontente ou que ainda não desenvolveu todas as competências necessárias. Recomendamos avaliação adicional em 90 dias e treinamento específico para o novo ambiente de trabalho.`
      : `Funcionário REQUER DESENVOLVIMENTO antes da mudança de posto. Com ${score} pontos, sugerimos programa de capacitação intensiva e mentoria por 6 meses antes de considerar a transferência.`
}`
        break

      default:
        evaluation = `📊 AVALIAÇÃO DETALHADA para ${funcionario.nome}

Tipo de mudança solicitada: ${changeType.replace("_", " ").toUpperCase()}

📈 Métricas de desempenho atuais:
• Pontuação geral: ${score} pontos
• Registros positivos: ${historicosPositivos}
• Registros negativos: ${historicosNegativos}
• Sanções no ano atual: ${hasSanctions ? "Sim" : "Não"}
• Total de sanções históricas: ${totalSancoes}
• Avaliações de desempenho: ${totalAvaliacoes} (média: ${mediaAvaliacoes}%)
• Fiscalizações: ${totalFiscalizacoes} (média: ${mediaFiscalizacoes}%)
• Faltas registradas: ${faltas}
• Atestados apresentados: ${atestados}

💼 ANÁLISE PROFISSIONAL DETALHADA:
${funcionario.nome} apresenta um perfil ${score >= 70 ? "EXCEPCIONAL" : score >= 60 ? "BOM" : score >= 30 ? "REGULAR" : "QUE NECESSITA ATENÇÃO ESPECIAL"}. 

${
  score >= 70
    ? `Com uma pontuação sólida de ${score} pontos, este funcionário demonstra competência e confiabilidade. Recomendamos fortemente a aprovação para mudanças positivas em sua carreira, pois possui o perfil adequado para assumir novas responsabilidades e desafios dentro da organização.`
    : `Vamos aguardar para que o funcionário tenha mais pontos e demonstre maior consistência em seu desempenho antes de implementar mudanças significativas, correndo o risco de prejudicar tanto o colaborador quanto a organização. Sugerimos um plano de desenvolvimento personalizado com metas claras e acompanhamento mensal para elevar sua pontuação e preparar adequadamente para futuras oportunidades.`
}`
    }

    return evaluation
  }

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    const employee = funcionarios.find((f: any) => f.id.toString() === employeeId)
    setSelectedEmployee(employee || null)
    setShowChangeOptions(false)
    setShowEvaluation(false)
    setSelectedChangeType("")
    setEvaluationResult("")
    setShowSimulateDialog(false)
    setAvailableChanges([])
    setShowMapping(false)
  }

  const handleShowMapping = () => {
    setShowMapping(true)
    setShowEvaluation(false)
    setShowChangeOptions(false)
  }

  const handleSimulateChange = () => {
    if (!selectedEmployee) return

    // Listar todas as mudanças disponíveis
    const changes = [
      "mudanca_cargo",
      "mudanca_posto",
      "mudanca_nivel",
      "mudanca_horario",
      "oportunidade",
      "julgamento_especial",
    ]

    setAvailableChanges(changes)
    setShowSimulateDialog(true)
  }

  const handleSelectSimulatedChange = (changeType: string) => {
    setSelectedChangeType(changeType)
    setShowSimulateDialog(false)
    setShowChangeOptions(false)
    setShowMapping(false)
  }

  const createClickableEvaluation = (evaluation: string) => {
    const lines = evaluation.split("\n")
    return lines.map((line, index) => {
      if (
        line.includes("Pontuação atual:") ||
        line.includes("Histórico positivo:") ||
        line.includes("Histórico negativo:")
      ) {
        return (
          <div key={index} className="mb-1">
            <Link href="/basics" className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
              {line}
            </Link>
          </div>
        )
      }

      if (line.includes("Sanções no ano:") || line.includes("Total de sanções históricas:")) {
        return (
          <div key={index} className="mb-1">
            <Link
              href="/operations/sanctions"
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {line}
            </Link>
          </div>
        )
      }

      if (line.includes("Avaliações de desempenho:")) {
        return (
          <div key={index} className="mb-1">
            <Link
              href="/management/performance"
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {line}
            </Link>
          </div>
        )
      }

      if (line.includes("Fiscalizações:")) {
        return (
          <div key={index} className="mb-1">
            <Link
              href="/operations/inspections"
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {line}
            </Link>
          </div>
        )
      }

      if (line.includes("Faltas registradas:")) {
        return (
          <div key={index} className="mb-1">
            <Link
              href="/operations/extra-services"
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {line}
            </Link>
          </div>
        )
      }

      if (line.includes("Atestados apresentados:")) {
        return (
          <div key={index} className="mb-1">
            <Link
              href="/operations/extra-services"
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {line}
            </Link>
          </div>
        )
      }

      if (line.includes("RECOMENDAÇÃO ESTRATÉGICA:") || line.includes("💼 RECOMENDAÇÃO ESTRATÉGICA:")) {
        return (
          <div key={index} className="mb-2 mt-3">
            <strong className="text-lg">{line}</strong>
          </div>
        )
      }

      return (
        <div key={index} className="mb-1">
          {line}
        </div>
      )
    })
  }

  const handleGenerateEvaluation = () => {
    if (!selectedEmployee || !selectedChangeType) return

    const evaluation = generateEvaluation(selectedEmployee, selectedChangeType)
    setEvaluationResult(evaluation)
    setShowEvaluation(true)
    setShowMapping(false)
  }

  if (loadingEmployees) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando funcionários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto min-h-screen p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mapeamento e Movimentação Interna</CardTitle>
        </CardHeader>
      </Card>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Funcionário</label>
        <select
          value={selectedEmployeeId}
          onChange={(e) => handleEmployeeSelect(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Escolha um funcionário...</option>
          {funcionarios.map((funcionario: any) => (
            <option key={funcionario.id} value={funcionario.id.toString()}>
              {funcionario.nome} - {funcionario.cargo} ({funcionario.departamento})
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.nome}</h2>
              <p className="text-gray-600">
                {selectedEmployee.cargo} - {selectedEmployee.departamento}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${employeeScore < 0 ? "text-red-600" : "text-blue-600"}`}>
                {employeeScore}
              </div>
              <p className="text-sm text-gray-500">Pontuação</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <p>
              <span className="font-medium">CPF:</span> {selectedEmployee.cpf}
            </p>
            <p>
              <span className="font-medium">Status:</span> {selectedEmployee.status}
            </p>
            <p>
              <span className="font-medium">Admissão:</span> {selectedEmployee.dataAdmissao}
            </p>
            <p>
              <span className="font-medium">Empresa:</span> {selectedEmployee.empresa}
            </p>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={handleShowMapping}
              className="bg-black text-white px-6 py-2 rounded-none hover:bg-gray-800 transition-colors"
            >
              Mapear
            </button>
            <button
              onClick={handleSimulateChange}
              className="bg-blue-600 text-white px-6 py-2 rounded-none hover:bg-blue-700 transition-colors"
            >
              Simular mudança
            </button>
          </div>

          {showSimulateDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Selecione a mudança para simular</h3>
                <div className="space-y-2">
                  {availableChanges.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelectSimulatedChange(option)}
                      className="w-full p-3 text-left rounded border hover:bg-gray-50 transition-colors"
                    >
                      {option.replace("_", " ").charAt(0).toUpperCase() + option.slice(1).replace("_", " ")}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowSimulateDialog(false)}
                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showMapping && (
            <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-900 mb-4 text-lg">Mapeamento do Funcionário</h3>
              <div className="space-y-2 text-blue-800">
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/basics" className="hover:underline cursor-pointer">
                    <strong>Pontuação atual:</strong> {employeeScore} pontos
                  </Link>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/basics" className="hover:underline cursor-pointer">
                    <strong>Histórico positivo:</strong>{" "}
                    {
                      historicosData.filter(
                        (h: any) => h.employee_id === selectedEmployee.id && (h.event_type || h.tipo) === "positivo",
                      ).length
                    }{" "}
                    registros
                  </Link>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/basics" className="hover:underline cursor-pointer">
                    <strong>Histórico negativo:</strong>{" "}
                    {
                      historicosData.filter(
                        (h: any) => h.employee_id === selectedEmployee.id && (h.event_type || h.tipo) === "negativo",
                      ).length
                    }{" "}
                    registros
                  </Link>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/operations/sanctions" className="hover:underline cursor-pointer">
                    <strong>Sanções no ano:</strong>{" "}
                    {hasSanctionsThisYear(selectedEmployee.id) ? "Sim - requer atenção" : "Não - excelente conduta"}
                  </Link>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/operations/sanctions" className="hover:underline cursor-pointer">
                    <strong>Total de sanções históricas:</strong>{" "}
                    {sancoesData.filter((s: any) => s.employee_id === selectedEmployee.id).length}
                  </Link>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/management/performance" className="hover:underline cursor-pointer">
                    <strong>Avaliações de desempenho:</strong>{" "}
                    {avaliacoesData.filter((a: any) => a.employee_id === selectedEmployee.id).length} (média:{" "}
                    {avaliacoesData.length > 0
                      ? Math.round(
                          avaliacoesData.reduce((acc: number, a: any) => acc + (a.pontuacao || 0), 0) /
                            avaliacoesData.length,
                        )
                      : 0}
                    %)
                  </Link>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/operations/inspections" className="hover:underline cursor-pointer">
                    <strong>Fiscalizações:</strong>{" "}
                    {fiscalizacoesData.filter((f: any) => f.employee_id === selectedEmployee.id).length} (média:{" "}
                    {fiscalizacoesData.length > 0
                      ? Math.round(
                          fiscalizacoesData.reduce((acc: number, f: any) => acc + (f.pontuacao || 0), 0) /
                            fiscalizacoesData.length,
                        )
                      : 0}
                    %)
                  </Link>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/operations/extra-services" className="hover:underline cursor-pointer">
                    <strong>Faltas registradas:</strong> {contarFaltasEAtestados(selectedEmployee.nome).faltas}
                  </Link>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/operations/extra-services" className="hover:underline cursor-pointer">
                    <strong>Atestados apresentados:</strong> {contarFaltasEAtestados(selectedEmployee.nome).atestados}
                  </Link>
                </div>

                <div className="flex items-start mt-4 pt-4 border-t border-blue-300">
                  <span className="mr-2">•</span>
                  <div>
                    <strong>Tempo de casa:</strong> {calculateTimeAtCompany(selectedEmployee.dataAdmissao)}
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <Link href="/operations/extra-services" className="hover:underline cursor-pointer">
                    <strong>Serviços extras realizados:</strong> {countExtraServices(selectedEmployee.nome)} vezes
                  </Link>
                </div>
              </div>
            </div>
          )}

          {selectedChangeType && !showEvaluation && (
            <div className="mt-4">
              <button
                onClick={handleGenerateEvaluation}
                className="bg-green-600 text-white px-6 py-2 rounded-none hover:bg-green-700 transition-colors"
              >
                Avaliar
              </button>
            </div>
          )}

          {showEvaluation && evaluationResult && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-900 mb-3">Resultado da Avaliação</h3>
              <div className="text-sm text-blue-800 whitespace-pre-line">
                {createClickableEvaluation(evaluationResult)}
              </div>

              {(avaliacoesData.length > 0 ||
                fiscalizacoesData.length > 0 ||
                contarFaltasEAtestados(selectedEmployee.nome).faltas > 0 ||
                contarFaltasEAtestados(selectedEmployee.nome).atestados > 0) && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Recomendação Estratégica</h4>

                  {avaliacoesData.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">Avaliações de Desempenho:</p>
                      {avaliacoesData.map((avaliacao: any, index: number) => (
                        <div key={index} className="text-xs text-blue-700 ml-2">
                          • {new Date(avaliacao.data).toLocaleDateString("pt-BR")} - Pontuação: {avaliacao.pontuacao}%
                        </div>
                      ))}
                    </div>
                  )}

                  {fiscalizacoesData.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">Fiscalizações:</p>
                      {fiscalizacoesData.map((fiscalizacao: any, index: number) => (
                        <div key={index} className="text-xs text-blue-700 ml-2">
                          • {new Date(fiscalizacao.data).toLocaleDateString("pt-BR")} - Pontuação:{" "}
                          {fiscalizacao.pontuacao}%
                        </div>
                      ))}
                    </div>
                  )}

                  {contarFaltasEAtestados(selectedEmployee.nome).faltas > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Faltas: {contarFaltasEAtestados(selectedEmployee.nome).faltas}
                      </p>
                      {servicosExtras
                        .filter(
                          (servico) =>
                            servico.reason === "falta" && servico.absentEmployeeName === selectedEmployee.nome,
                        )
                        .map((servico, index) => (
                          <div key={index} className="text-xs text-blue-700 ml-2">
                            • {new Date(servico.date).toLocaleDateString("pt-BR")} - Local: {servico.location}
                          </div>
                        ))}
                    </div>
                  )}

                  {contarFaltasEAtestados(selectedEmployee.nome).atestados > 0 && (
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Atestados: {contarFaltasEAtestados(selectedEmployee.nome).atestados}
                      </p>
                      {servicosExtras
                        .filter(
                          (servico) =>
                            servico.reason === "atestado" && servico.certificateEmployeeName === selectedEmployee.nome,
                        )
                        .map((servico, index) => (
                          <div key={index} className="text-xs text-blue-700 ml-2">
                            • {new Date(servico.certificateDate!).toLocaleDateString("pt-BR")} - Local:{" "}
                            {servico.location}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
