"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts"
import { useEffect, useState } from "react"
import { useDataEntries, useClientsSuppliers } from "@/hooks/use-realtime"
import { useExtraServices } from "@/hooks/use-extra-services"
import { useEmployees } from "@/hooks/use-employees"

interface DataEntry {
  id: string
  type:
    | "rescisao"
    | "gasto-extra"
    | "compras-extras"
    | "servicos-extras"
    | "uniforme-epi"
    | "compra-equipamento"
    | "servico-extra"
    | "processos-juridicos"
  date: string
  value: number
  description?: string
  created_at: string
  client_id?: string
  employee_id?: string
  quantity?: number
  uniform_item?: string
}

export default function GraphicsPage() {
  const { data: dadosInfo, loading: loadingDataEntries } = useDataEntries()
  const { data: clientesData, loading: loadingClients } = useClientsSuppliers()
  const { services: extraServices, loading: loadingExtraServices } = useExtraServices()
  const { data: funcionarios } = useEmployees()
  const [showSecondSemester, setShowSecondSemester] = useState({
    rescisoes: false,
    valoresRescisoes: false,
    gastosExtras: false,
    servicosExtras: false,
    comprasExtras: false,
    maisGastosPorCliente: false,
    rescisoesPorClientes: false,
    servicoExtraPorCliente: false,
    uniformesPorItem: false,
    processosJuridicos: false,
  })
  const { toast } = useToast()

  const processarDadosPorMes = (dados: DataEntry[], tipo: string, incluirValor = false) => {
    const mesesPrimeiroSemestre = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"]
    const mesesSegundoSemestre = ["Ago", "Set", "Out", "Nov", "Dez"]

    const dadosFiltrados = dados.filter((d) => d.type === tipo)

    const processarMeses = (meses: string[], startMonth: number) => {
      return meses.map((mes, index) => {
        const mesIndex = startMonth + index
        const dadosDoMes = dadosFiltrados.filter((d) => {
          const dataItem = new Date(d.date)
          return dataItem.getMonth() === mesIndex
        })

        const resultado: any = { mes }

        if (incluirValor) {
          resultado.quantidade = dadosDoMes.length
          resultado.valor = dadosDoMes.reduce((acc, curr) => acc + curr.value, 0)
        } else {
          resultado.quantidade = dadosDoMes.length
        }

        return resultado
      })
    }

    return {
      primeiroSemestre: processarMeses(mesesPrimeiroSemestre, 0),
      segundoSemestre: processarMeses(mesesSegundoSemestre, 7),
    }
  }

  const processarValoresPorMes = (dados: DataEntry[], tipo: string) => {
    const mesesPrimeiroSemestre = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"]
    const mesesSegundoSemestre = ["Ago", "Set", "Out", "Nov", "Dez"]

    const dadosFiltrados = dados.filter((d) => d.type === tipo)

    const processarMeses = (meses: string[], startMonth: number) => {
      return meses.map((mes, index) => {
        const mesIndex = startMonth + index
        const dadosDoMes = dadosFiltrados.filter((d) => {
          const dataItem = new Date(d.date)
          return dataItem.getMonth() === mesIndex
        })

        return {
          mes,
          valor: dadosDoMes.reduce((acc, curr) => acc + curr.value, 0),
        }
      })
    }

    return {
      primeiroSemestre: processarMeses(mesesPrimeiroSemestre, 0),
      segundoSemestre: processarMeses(mesesSegundoSemestre, 7),
    }
  }

  const getCurrentSemesterData = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() // 0-11
    const currentYear = currentDate.getFullYear()

    // Primeiro semestre: Janeiro (0) a Junho (5)
    // Segundo semestre: Julho (6) a Dezembro (11)
    const isFirstSemester = currentMonth <= 5

    return {
      isFirstSemester,
      startMonth: isFirstSemester ? 0 : 6,
      endMonth: isFirstSemester ? 5 : 11,
      semesterName: isFirstSemester ? "1º Semestre" : "2º Semestre",
      currentYear,
    }
  }

  const processarDadosPorClienteSemestre = (dados: DataEntry[], tipo: string) => {
    const { startMonth, endMonth, currentYear } = getCurrentSemesterData()

    const dadosFiltrados = dados.filter((d) => {
      const dataItem = new Date(d.date)
      const month = dataItem.getMonth()
      const year = dataItem.getFullYear()
      return d.type === tipo && month >= startMonth && month <= endMonth && year === currentYear
    })

    // Agrupar por cliente
    const dadosPorCliente = dadosFiltrados.reduce((acc: any, curr) => {
      const clienteId = curr.client_id
      if (!clienteId) return acc

      const cliente = clientesData.find((c: any) => c.id === clienteId && c.type === "cliente")
      const nomeCliente = cliente?.name || `Cliente ${clienteId}`

      if (!acc[nomeCliente]) {
        acc[nomeCliente] = { nome: nomeCliente, quantidade: 0, valor: 0 }
      }

      if (tipo === "uniforme-epi") {
        acc[nomeCliente].quantidade += curr.quantity || 1
      } else {
        acc[nomeCliente].quantidade += 1
      }
      acc[nomeCliente].valor += curr.value || 0

      return acc
    }, {})

    return Object.values(dadosPorCliente)
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 10)
  }

  const processarDadosMensaisPorCliente = (dados: DataEntry[], tipo: string) => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    const currentYear = getCurrentSemesterData().currentYear

    const dadosFiltrados = dados.filter((d) => {
      const dataItem = new Date(d.date)
      const year = dataItem.getFullYear()
      return d.type === tipo && year === currentYear
    })

    // Primeiro, identificar os top 10 clientes do ano
    const dadosPorCliente = dadosFiltrados.reduce((acc: any, curr) => {
      const clienteId = curr.client_id
      if (!clienteId) return acc

      const cliente = clientesData.find((c: any) => c.id === clienteId && c.type === "cliente")
      const nomeCliente = cliente?.name || `Cliente ${clienteId}`

      if (!acc[nomeCliente]) {
        acc[nomeCliente] = { nome: nomeCliente, total: 0 }
      }

      acc[nomeCliente].total += 1
      return acc
    }, {})

    const top10Clientes = Object.values(dadosPorCliente)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)
      .map((c: any) => c.nome)

    // Agora processar dados mensais apenas para os top 10 clientes
    const dadosMensais = meses.map((mes, index) => {
      const dadosDoMes = dadosFiltrados.filter((d) => {
        const dataItem = new Date(d.date)
        return dataItem.getMonth() === index
      })

      const resultado: any = { mes }

      top10Clientes.forEach((nomeCliente) => {
        const dadosClienteMes = dadosDoMes.filter((d) => {
          const clienteId = d.client_id
          if (!clienteId) return false
          const cliente = clientesData.find((c: any) => c.id === clienteId && c.type === "cliente")
          return (cliente?.name || `Cliente ${clienteId}`) === nomeCliente
        })
        resultado[nomeCliente] = dadosClienteMes.length
      })

      return resultado
    })

    return { dadosMensais, top10Clientes }
  }

  const processarDadosMensaisPorClientePeriodo = (dados: DataEntry[], tipo: string) => {
    const mesesPrimeiroPeriodo = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"]
    const mesesSegundoPeriodo = ["Ago", "Set", "Out", "Nov", "Dez"]
    const currentYear = getCurrentSemesterData().currentYear

    const dadosFiltrados = dados.filter((d) => {
      const dataItem = new Date(d.date)
      const year = dataItem.getFullYear()
      return d.type === tipo && year === currentYear
    })

    // Primeiro, identificar os top 10 clientes do ano
    const dadosPorCliente = dadosFiltrados.reduce((acc: any, curr) => {
      const clienteId = curr.client_id
      if (!clienteId) return acc

      const cliente = clientesData.find((c: any) => c.id === clienteId && c.type === "cliente")
      const nomeCliente = cliente?.name || `Cliente ${clienteId}`

      if (!acc[nomeCliente]) {
        acc[nomeCliente] = { nome: nomeCliente, total: 0 }
      }

      acc[nomeCliente].total += 1
      return acc
    }, {})

    const top10Clientes = Object.values(dadosPorCliente)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)
      .map((c: any) => c.nome)

    // Processar dados para primeiro período (Jan-Jul)
    const dadosPrimeiroPeriodo = mesesPrimeiroPeriodo.map((mes, index) => {
      const dadosDoMes = dadosFiltrados.filter((d) => {
        const dataItem = new Date(d.date)
        return dataItem.getMonth() === index
      })

      const resultado: any = { mes }

      top10Clientes.forEach((nomeCliente) => {
        const dadosClienteMes = dadosDoMes.filter((d) => {
          const clienteId = d.client_id
          if (!clienteId) return false
          const cliente = clientesData.find((c: any) => c.id === clienteId && c.type === "cliente")
          return (cliente?.name || `Cliente ${clienteId}`) === nomeCliente
        })
        resultado[nomeCliente] = dadosClienteMes.length
      })

      return resultado
    })

    // Processar dados para segundo período (Ago-Dez)
    const dadosSegundoPeriodo = mesesSegundoPeriodo.map((mes, index) => {
      const dadosDoMes = dadosFiltrados.filter((d) => {
        const dataItem = new Date(d.date)
        return dataItem.getMonth() === index + 7 // Agosto = 7, Setembro = 8, etc.
      })

      const resultado: any = { mes }

      top10Clientes.forEach((nomeCliente) => {
        const dadosClienteMes = dadosDoMes.filter((d) => {
          const clienteId = d.client_id
          if (!clienteId) return false
          const cliente = clientesData.find((c: any) => c.id === clienteId && c.type === "cliente")
          return (cliente?.name || `Cliente ${clienteId}`) === nomeCliente
        })
        resultado[nomeCliente] = dadosClienteMes.length
      })

      return resultado
    })

    return {
      primeiroPeriodo: dadosPrimeiroPeriodo,
      segundoPeriodo: dadosSegundoPeriodo,
      top10Clientes,
    }
  }

  const processarUniformesPorItemMensal = (dados: DataEntry[]) => {
    const mesesPrimeiroPeriodo = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"]
    const mesesSegundoPeriodo = ["Ago", "Set", "Out", "Nov", "Dez"]
    const currentYear = getCurrentSemesterData().currentYear

    const dadosFiltrados = dados.filter((d) => {
      const dataItem = new Date(d.date)
      const year = dataItem.getFullYear()
      return d.type === "uniforme-epi" && year === currentYear
    })

    const itensUniforme = [
      "camiseta",
      "camisa",
      "jaqueta",
      "calca",
      "sapato",
      "luvas",
      "capas-chuva",
      "botas-borracha",
      "bone",
      "chapeu-jardineiro",
    ]

    // Processar dados para primeiro período (Jan-Jul)
    const dadosPrimeiroPeriodo = mesesPrimeiroPeriodo.map((mes, index) => {
      const dadosDoMes = dadosFiltrados.filter((d) => {
        const dataItem = new Date(d.date)
        return dataItem.getMonth() === index
      })

      const resultado: any = { mes }

      itensUniforme.forEach((item) => {
        const dadosItem = dadosDoMes.filter((d) => d.uniform_item === item)
        resultado[item] = dadosItem.reduce((acc, curr) => acc + (curr.quantity || 1), 0)
      })

      return resultado
    })

    // Processar dados para segundo período (Ago-Dez)
    const dadosSegundoPeriodo = mesesSegundoPeriodo.map((mes, index) => {
      const dadosDoMes = dadosFiltrados.filter((d) => {
        const dataItem = new Date(d.date)
        return dataItem.getMonth() === index + 7
      })

      const resultado: any = { mes }

      itensUniforme.forEach((item) => {
        const dadosItem = dadosDoMes.filter((d) => d.uniform_item === item)
        resultado[item] = dadosItem.reduce((acc, curr) => acc + (curr.quantity || 1), 0)
      })

      return resultado
    })

    // Calcular totais e valores por item para o ranking
    const totaisPorItem = itensUniforme.map((item) => {
      const dadosItem = dadosFiltrados.filter((d) => d.uniform_item === item)
      const quantidade = dadosItem.reduce((acc, curr) => acc + (curr.quantity || 1), 0)
      const valor = dadosItem.reduce((acc, curr) => acc + (curr.value || 0), 0)

      // Agrupar por cliente
      const porCliente = dadosItem.reduce((acc: any, curr) => {
        const clienteId = curr.client_id
        if (!clienteId) return acc

        const cliente = clientesData.find((c: any) => c.id === clienteId && c.type === "cliente")
        const nomeCliente = cliente?.name || `Cliente ${clienteId}`

        if (!acc[nomeCliente]) {
          acc[nomeCliente] = { quantidade: 0, valor: 0 }
        }

        acc[nomeCliente].quantidade += curr.quantity || 1
        acc[nomeCliente].valor += curr.value || 0

        return acc
      }, {})

      return {
        item,
        quantidade,
        valor,
        clientes: porCliente,
      }
    })

    return {
      primeiroPeriodo: dadosPrimeiroPeriodo,
      segundoPeriodo: dadosSegundoPeriodo,
      totaisPorItem: totaisPorItem.filter((t) => t.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade),
    }
  }

  const processarProcessosJuridicosPorMes = (dados: DataEntry[]) => {
    const mesesPrimeiroPeriodo = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"]
    const mesesSegundoPeriodo = ["Ago", "Set", "Out", "Nov", "Dez"]
    const currentYear = getCurrentSemesterData().currentYear

    console.log("[v0] Total de dados recebidos:", dados.length)
    console.log("[v0] Ano atual:", currentYear)

    const dadosFiltrados = dados.filter((d) => {
      const dataItem = new Date(d.date)
      const year = dataItem.getFullYear()
      const isProcessoJuridico = d.type === "processos-juridicos"
      const isCurrentYear = year === currentYear

      if (isProcessoJuridico) {
        console.log("[v0] Processo jurídico encontrado:", {
          id: d.id,
          date: d.date,
          year: year,
          isCurrentYear: isCurrentYear,
          description: d.description,
          employee_id: d.employee_id,
        })
      }

      return isProcessoJuridico && isCurrentYear
    })

    console.log("[v0] Total de processos jurídicos filtrados:", dadosFiltrados.length)
    console.log(
      "[v0] Processos filtrados:",
      dadosFiltrados.map((d) => ({
        date: d.date,
        description: d.description,
      })),
    )

    const processarMeses = (meses: string[], startMonth: number) => {
      return meses.map((mes, index) => {
        const mesIndex = startMonth + index
        const dadosDoMes = dadosFiltrados.filter((d) => {
          const dataItem = new Date(d.date)
          return dataItem.getMonth() === mesIndex
        })

        console.log(`[v0] Mês ${mes} (índice ${mesIndex}):`, dadosDoMes.length, "processos")

        return {
          mes,
          quantidade: dadosDoMes.length,
        }
      })
    }

    const resultado = {
      primeiroPeriodo: processarMeses(mesesPrimeiroPeriodo, 0),
      segundoPeriodo: processarMeses(mesesSegundoPeriodo, 7),
    }

    console.log("[v0] Resultado do processamento:", resultado)

    return resultado
  }

  const gastosExtrasPorCliente =
    dadosInfo && clientesData ? processarDadosPorClienteSemestre(dadosInfo, "gasto-extra") : []

  const rescisoesPorCliente = dadosInfo && clientesData ? processarDadosPorClienteSemestre(dadosInfo, "rescisao") : []

  const servicosExtrasPorCliente =
    dadosInfo && clientesData ? processarDadosPorClienteSemestre(dadosInfo, "servico-extra") : []

  const rescisoesPorMes = dadosInfo
    ? processarDadosPorMes(dadosInfo, "rescisao")
    : { primeiroSemestre: [], segundoSemestre: [] }
  const valoresRescisoesPorMes = dadosInfo
    ? processarValoresPorMes(dadosInfo, "rescisao")
    : { primeiroSemestre: [], segundoSemestre: [] }
  const gastosExtrasPorMes = dadosInfo
    ? processarDadosPorMes(dadosInfo, "gasto-extra", true)
    : { primeiroSemestre: [], segundoSemestre: [] }
  const servicosExtrasPorMes = dadosInfo
    ? processarValoresPorMes(dadosInfo, "servico-extra")
    : { primeiroSemestre: [], segundoSemestre: [] }
  const comprasExtrasPorMes = dadosInfo
    ? processarDadosPorMes(dadosInfo, "compras-extras", true)
    : { primeiroSemestre: [], segundoSemestre: [] }

  const gastosExtrasMensaisPeriodo =
    dadosInfo && clientesData
      ? processarDadosMensaisPorClientePeriodo(dadosInfo, "gasto-extra")
      : { primeiroPeriodo: [], segundoPeriodo: [], top10Clientes: [] }

  const rescisoesMensaisPeriodo =
    dadosInfo && clientesData
      ? processarDadosMensaisPorClientePeriodo(dadosInfo, "rescisao")
      : { primeiroPeriodo: [], segundoPeriodo: [], top10Clientes: [] }

  const servicosExtrasMensaisPeriodo =
    dadosInfo && clientesData
      ? processarDadosMensaisPorClientePeriodo(dadosInfo, "servico-extra")
      : { primeiroPeriodo: [], segundoPeriodo: [], top10Clientes: [] }

  const processosJuridicosPorMes = dadosInfo
    ? processarProcessosJuridicosPorMes(dadosInfo)
    : { primeiroPeriodo: [], segundoPeriodo: [] }

  const coresClientes = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00ff00",
    "#ff00ff",
    "#00ffff",
    "#ff0000",
    "#0000ff",
    "#ffff00",
  ]

  const absencesByEmployee = extraServices
    .filter((service: any) => service.reason === "falta" && service.absentEmployeeName)
    .reduce(
      (acc: any, service: any) => {
        const name = service.absentEmployeeName
        acc[name] = (acc[name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

  const certificatesByEmployee = extraServices
    .filter((service: any) => service.reason === "atestado" && service.certificateEmployeeName)
    .reduce(
      (acc: any, service: any) => {
        const name = service.certificateEmployeeName
        acc[name] = (acc[name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

  const absencesData = Object.entries(absencesByEmployee)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count as number) - (a.count as number))

  const certificatesData = Object.entries(certificatesByEmployee)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count as number) - (a.count as number))

  const uniformesPorItemMensal =
    dadosInfo && clientesData
      ? processarUniformesPorItemMensal(dadosInfo)
      : { primeiroPeriodo: [], segundoPeriodo: [], totaisPorItem: [] }

  const coresItensUniforme: Record<string, string> = {
    camiseta: "#3b82f6",
    camisa: "#8b5cf6",
    jaqueta: "#ec4899",
    calca: "#f59e0b",
    sapato: "#10b981",
    luvas: "#06b6d4",
    "capas-chuva": "#6366f1",
    "botas-borracha": "#84cc16",
    bone: "#f97316",
    "chapeu-jardineiro": "#14b8a6",
  }

  const nomesItensUniforme: Record<string, string> = {
    camiseta: "Camiseta",
    camisa: "Camisa",
    jaqueta: "Jaqueta",
    calca: "Calça",
    sapato: "Sapato",
    luvas: "Luvas",
    "capas-chuva": "Capas de Chuva",
    "botas-borracha": "Botas de Borracha",
    bone: "Boné",
    "chapeu-jardineiro": "Chapéu de Jardineiro",
  }

  useEffect(() => {
    if (!loadingDataEntries && dadosInfo) {
      console.log("[v0] Gráficos atualizados com dados do Supabase:", dadosInfo.length, "entradas")
    }
  }, [dadosInfo, loadingDataEntries])

  const toggleSemester = (grafico: keyof typeof showSecondSemester) => {
    setShowSecondSemester((prev) => ({
      ...prev,
      [grafico]: !prev[grafico],
    }))
  }

  const { semesterName } = getCurrentSemesterData()

  if (loadingDataEntries || loadingClients || loadingExtraServices) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gráficos</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Gráficos</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faltas por Funcionário</CardTitle>
          <CardDescription>Funcionários que mais faltam - Dados da página "Serviços Extras"</CardDescription>
        </CardHeader>
        <CardContent>
          {absencesData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma falta registrada ainda</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={absencesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ef4444" name="Faltas" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-2">
                <h4 className="font-semibold text-sm">Ranking de Faltas:</h4>
                <div className="space-y-1">
                  {absencesData.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-gray-500">#{index + 1}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="font-semibold text-red-600">{item.count} faltas</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atestados por Funcionário</CardTitle>
          <CardDescription>
            Funcionários que mais apresentam atestados - Dados da página "Serviços Extras"
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificatesData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum atestado registrado ainda</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={certificatesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#f97316" name="Atestados" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-2">
                <h4 className="font-semibold text-sm">Ranking de Atestados:</h4>
                <div className="space-y-1">
                  {certificatesData.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-gray-500">#{index + 1}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="font-semibold text-orange-600">{item.count} atestados</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mais gastos por cliente</CardTitle>
            <CardDescription>
              Evolução mensal dos gastos extras dos 10 principais clientes - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("maisGastosPorCliente")}>
            {showSecondSemester.maisGastosPorCliente ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={
                showSecondSemester.maisGastosPorCliente
                  ? gastosExtrasMensaisPeriodo.segundoPeriodo
                  : gastosExtrasMensaisPeriodo.primeiroPeriodo
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value}`, `${name} - Gastos Extras`]} />
              <Legend />
              {gastosExtrasMensaisPeriodo.top10Clientes.map((cliente, index) => (
                <Line
                  key={cliente}
                  type="monotone"
                  dataKey={cliente}
                  stroke={coresClientes[index]}
                  strokeWidth={2}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Rescisões por clientes</CardTitle>
            <CardDescription>
              Evolução mensal das rescisões dos 10 principais clientes - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("rescisoesPorClientes")}>
            {showSecondSemester.rescisoesPorClientes ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={
                showSecondSemester.rescisoesPorClientes
                  ? rescisoesMensaisPeriodo.segundoPeriodo
                  : rescisoesMensaisPeriodo.primeiroPeriodo
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value}`, `${name} - Rescisões`]} />
              <Legend />
              {rescisoesMensaisPeriodo.top10Clientes.map((cliente, index) => (
                <Bar key={cliente} dataKey={cliente} fill={coresClientes[index]} stackId="rescisoes" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Serviço extra por cliente</CardTitle>
            <CardDescription>
              Evolução mensal dos serviços extras dos 10 principais clientes - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("servicoExtraPorCliente")}>
            {showSecondSemester.servicoExtraPorCliente ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={
                showSecondSemester.servicoExtraPorCliente
                  ? servicosExtrasMensaisPeriodo.segundoPeriodo
                  : servicosExtrasMensaisPeriodo.primeiroPeriodo
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value}`, `${name} - Serviços Extras`]} />
              <Legend />
              {servicosExtrasMensaisPeriodo.top10Clientes.map((cliente, index) => (
                <Line
                  key={cliente}
                  type="monotone"
                  dataKey={cliente}
                  stroke={coresClientes[index]}
                  strokeWidth={2}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Número Total de Rescisões por Mês</CardTitle>
            <CardDescription>
              Quantidade de rescisões contratuais mensais - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("rescisoes")}>
            {showSecondSemester.rescisoes ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={showSecondSemester.rescisoes ? rescisoesPorMes.segundoSemestre : rescisoesPorMes.primeiroSemestre}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}`, "Número de Rescisões"]} />
              <Legend />
              <Bar dataKey="quantidade" fill="#8884d8" name="Número de Rescisões" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Valores Totais das Rescisões por Mês</CardTitle>
            <CardDescription>
              Valores financeiros das rescisões contratuais mensais em R$ - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("valoresRescisoes")}>
            {showSecondSemester.valoresRescisoes ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={
                showSecondSemester.valoresRescisoes
                  ? valoresRescisoesPorMes.segundoSemestre
                  : valoresRescisoesPorMes.primeiroSemestre
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, "Valor das Rescisões"]} />
              <Legend />
              <Bar dataKey="valor" fill="#82ca9d" name="Valor das Rescisões (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Número e Valores dos Gastos Extras por Mês</CardTitle>
            <CardDescription>
              Quantidade e valores financeiros dos gastos extras mensais - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("gastosExtras")}>
            {showSecondSemester.gastosExtras ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={
                showSecondSemester.gastosExtras
                  ? gastosExtrasPorMes.segundoSemestre
                  : gastosExtrasPorMes.primeiroSemestre
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Quantidade de Gastos Extras") return [`${value}`, name]
                  return [`R$ ${value.toLocaleString()}`, name]
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="quantidade" fill="#ff7300" name="Quantidade de Gastos Extras" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="valor"
                stroke="#dc2626"
                strokeWidth={3}
                name="Valor Total (R$)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Valor Total em Serviços Extras por Mês</CardTitle>
            <CardDescription>
              Valores financeiros dos serviços extras mensais em R$ - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("servicosExtras")}>
            {showSecondSemester.servicosExtras ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={
                showSecondSemester.servicosExtras
                  ? servicosExtrasPorMes.segundoSemestre
                  : servicosExtrasPorMes.primeiroSemestre
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`R$ ${value.toLocaleString()}`, "Serviços Extras"]} />
              <Legend />
              <Bar dataKey="valor" fill="#9333ea" name="Serviços Extras (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Número e Valor Total das Compras Extras por Mês</CardTitle>
            <CardDescription>
              Quantidade e valores das compras de equipamentos mensais - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("comprasExtras")}>
            {showSecondSemester.comprasExtras ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={
                showSecondSemester.comprasExtras
                  ? comprasExtrasPorMes.segundoSemestre
                  : comprasExtrasPorMes.primeiroSemestre
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Quantidade de Compras") return [`${value}`, name]
                  return [`R$ ${value.toLocaleString()}`, name]
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="quantidade" fill="#06b6d4" name="Quantidade de Compras" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="valor"
                stroke="#dc2626"
                strokeWidth={3}
                name="Valor Total (R$)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quantidade de Peças de Uniformes e EPIs por Item</CardTitle>
            <CardDescription>
              Evolução mensal das compras de uniformes e EPIs por tipo de item - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("uniformesPorItem")}>
            {showSecondSemester.uniformesPorItem ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={
                showSecondSemester.uniformesPorItem
                  ? uniformesPorItemMensal.segundoPeriodo
                  : uniformesPorItemMensal.primeiroPeriodo
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  `${value} peças`,
                  uniformesPorItemMensal.totaisPorItem.find((item) => item.item === name)?.item || name,
                ]}
              />
              <Legend
                formatter={(value) =>
                  uniformesPorItemMensal.totaisPorItem.find((item) => item.item === value)?.item || value
                }
              />
              {uniformesPorItemMensal.totaisPorItem.map((item) => (
                <Bar key={item.item} dataKey={item.item} fill={coresItensUniforme[item.item]} stackId="uniformes" />
              ))}
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-2">
            <h4 className="font-semibold text-sm">Ranking de Itens Mais Comprados (Ano Completo):</h4>
            <div className="space-y-2">
              {uniformesPorItemMensal.totaisPorItem.slice(0, 5).map((item, index) => (
                <div key={item.item} className="p-3 bg-gray-50 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-gray-500">#{index + 1}</span>
                      <span className="font-semibold">
                        {uniformesPorItemMensal.totaisPorItem.find((i) => i.item === item.item)?.item || item.item}
                      </span>
                    </span>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">{item.quantidade} peças</div>
                      <div className="text-sm text-green-600">
                        R$ {item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  {Object.keys(item.clientes).length > 0 && (
                    <div className="pl-8 space-y-1">
                      <div className="text-xs font-semibold text-gray-600">Por cliente:</div>
                      {Object.entries(item.clientes)
                        .sort(([, a]: any, [, b]: any) => b.quantidade - a.quantidade)
                        .slice(0, 3)
                        .map(([nomeCliente, dados]: any) => (
                          <div key={nomeCliente} className="text-xs text-gray-600 flex justify-between">
                            <span>{nomeCliente}</span>
                            <span>
                              {dados.quantidade} peças - R${" "}
                              {dados.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Processos Jurídicos por Mês</CardTitle>
            <CardDescription>
              Quantidade de processos jurídicos iniciados mensalmente - Dados da página "Dados e Informações"
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => toggleSemester("processosJuridicos")}>
            {showSecondSemester.processosJuridicos ? "1º Semestre" : "2º Semestre"}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={
                showSecondSemester.processosJuridicos
                  ? processosJuridicosPorMes.segundoPeriodo
                  : processosJuridicosPorMes.primeiroPeriodo
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}`, "Processos Jurídicos"]} />
              <Legend />
              <Bar dataKey="quantidade" fill="#ec4899" name="Processos Jurídicos" />
            </BarChart>
          </ResponsiveContainer>

          {dadosInfo && funcionarios && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-sm">Processos por Reclamante (Ano Completo):</h4>
              <div className="space-y-1">
                {(() => {
                  const processosPorReclamante = dadosInfo
                    .filter((d) => d.type === "processos-juridicos" && d.employee_id)
                    .reduce((acc: any, curr) => {
                      const funcionario = funcionarios.find((f: any) => f.id === curr.employee_id)
                      const nome = funcionario?.nome || "Funcionário não encontrado"
                      acc[nome] = (acc[nome] || 0) + 1
                      return acc
                    }, {})

                  return Object.entries(processosPorReclamante)
                    .sort(([, a]: any, [, b]: any) => b - a)
                    .slice(0, 5)
                    .map(([nome, quantidade]: any, index) => (
                      <div key={nome} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="flex items-center gap-2">
                          <span className="font-bold text-gray-500">#{index + 1}</span>
                          <span>{nome}</span>
                        </span>
                        <span className="font-semibold text-pink-600">{quantidade} processos</span>
                      </div>
                    ))
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
