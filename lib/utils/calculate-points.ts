import { format } from "date-fns"

export interface EmployeeWithRelations {
  id: string
  nome: string
  status?: string
  employee_history?: Array<{
    tipo: string
    data: string
  }>
  employee_sanctions?: Array<{
    tipo_sancao: string
    data_aplicacao: string
  }>
  employee_evaluations?: Array<{
    pontuacao: number
    data: string
  }>
  employee_inspections?: Array<{
    pontuacao: number
    data: string
  }>
}

export function calculateEmployeePoints(employee: EmployeeWithRelations): number {
  try {
    console.log(`[v0] ===== Calculando pontos para: ${employee.nome} =====`)

    // Pontuação base
    let pontuacao = 10
    console.log(`[v0] Pontuação base: ${pontuacao}`)

    // Históricos
    const historicos = employee.employee_history || []
    console.log(`[v0] Históricos encontrados: ${historicos.length}`)

    historicos.forEach((hist) => {
      try {
        if (hist.tipo === "positivo") {
          pontuacao += 5
          console.log(
            `[v0] + Histórico positivo (${hist.data ? format(new Date(hist.data), "dd/MM/yyyy") : "sem data"}): +5 pontos → Total: ${pontuacao}`,
          )
        } else if (hist.tipo === "negativo") {
          pontuacao -= 10
          console.log(
            `[v0] - Histórico negativo (${hist.data ? format(new Date(hist.data), "dd/MM/yyyy") : "sem data"}): -10 pontos → Total: ${pontuacao}`,
          )
        } else if (hist.tipo === "falta") {
          pontuacao -= 5
          console.log(
            `[v0] - Falta (${hist.data ? format(new Date(hist.data), "dd/MM/yyyy") : "sem data"}): -5 pontos → Total: ${pontuacao}`,
          )
        }
      } catch (err) {
        console.error(`[v0] Erro ao processar histórico:`, err)
      }
    })

    // Sanções
    const sancoes = employee.employee_sanctions || []
    console.log(`[v0] Sanções encontradas: ${sancoes.length}`)

    sancoes.forEach((sancao) => {
      try {
        let pontos = 0
        const tipo = sancao.tipo_sancao?.toLowerCase() || ""

        if (tipo.includes("advertência") || tipo.includes("advertencia")) {
          pontos = 10
        } else if (tipo.includes("suspensão") || tipo.includes("suspensao")) {
          if (tipo.includes("1 dia")) {
            pontos = 10
          } else if (tipo.includes("3 dias")) {
            pontos = 20
          } else if (tipo.includes("5") || tipo.includes("mais")) {
            pontos = 50
          } else {
            pontos = 10
          }
        }

        if (pontos > 0) {
          pontuacao -= pontos
          console.log(
            `[v0] - Sanção ${sancao.tipo_sancao} (${sancao.data_aplicacao ? format(new Date(sancao.data_aplicacao), "dd/MM/yyyy") : "sem data"}): -${pontos} pontos → Total: ${pontuacao}`,
          )
        }
      } catch (err) {
        console.error(`[v0] Erro ao processar sanção:`, err)
      }
    })

    // Avaliações de desempenho
    const avaliacoes = employee.employee_evaluations || []
    console.log(`[v0] Avaliações encontradas: ${avaliacoes.length}`)

    avaliacoes.forEach((aval) => {
      try {
        const pontos = Math.floor(aval.pontuacao / 10)
        pontuacao += pontos
        console.log(
          `[v0] + Avaliação ${aval.pontuacao}% (${aval.data ? format(new Date(aval.data), "dd/MM/yyyy") : "sem data"}): +${pontos} pontos → Total: ${pontuacao}`,
        )
      } catch (err) {
        console.error(`[v0] Erro ao processar avaliação:`, err)
      }
    })

    // Fiscalizações
    const fiscalizacoes = employee.employee_inspections || []
    console.log(`[v0] Fiscalizações encontradas: ${fiscalizacoes.length}`)

    fiscalizacoes.forEach((fisc) => {
      try {
        const pontos = Math.floor(fisc.pontuacao / 10)
        pontuacao += pontos
        console.log(
          `[v0] + Fiscalização ${fisc.pontuacao}% (${fisc.data ? format(new Date(fisc.data), "dd/MM/yyyy") : "sem data"}): +${pontos} pontos → Total: ${pontuacao}`,
        )
      } catch (err) {
        console.error(`[v0] Erro ao processar fiscalização:`, err)
      }
    })

    // Bônus de destaque
    if (employee.status === "Destaque") {
      pontuacao += 10
      console.log(`[v0] + Bônus Destaque: +10 pontos → Total: ${pontuacao}`)
    }

    console.log(`[v0] ===== Pontuação final para ${employee.nome}: ${pontuacao} =====`)

    return pontuacao
  } catch (err) {
    console.error(`[v0] Erro crítico ao calcular pontos para ${employee.nome}:`, err)
    return 10 // Retorna pontuação base em caso de erro
  }
}
