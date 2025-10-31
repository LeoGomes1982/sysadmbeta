"use client"

import React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, Calendar, DollarSign, FileText, Printer, Trash2, MapPin, Building2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { createBrowserClient } from "@supabase/ssr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface EmployeeData {
  nome: string
  valorMes: number
  valorAdiantado: number
  empresa: string
  cidade: string
}

interface ReceiptData {
  nome: string
  valor: number
  periodo: string
  dataPagamento: string
  empresa: string
}

interface GeneratedReceipt {
  id: string
  tipo: string
  periodo: string
  data_pagamento: string
  total_funcionarios: number
  valor_total: number
  arquivo_nome: string
  data_geracao: string
  empresa: string
}

export default function ReceiptsPage() {
  const [employeeData, setEmployeeData] = useState<EmployeeData[]>([])
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [generatedReceipts, setGeneratedReceipts] = useState<GeneratedReceipt[]>([])
  const [periodo, setPeriodo] = useState("")
  const [dataPagamento, setDataPagamento] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([])
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("todas")

  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<string[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("todas")

  const [tipoValor, setTipoValor] = useState<"adiantado" | "mes">("adiantado")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const normalizarTexto = (texto: string): string => {
    return texto
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
  }

  const loadReceiptsHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from("receipts_generated")
        .select("*")
        .order("data_geracao", { ascending: false })
        .limit(10)

      if (error) throw error

      setGeneratedReceipts(data || [])
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de recibos",
        variant: "destructive",
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  React.useEffect(() => {
    loadReceiptsHistory()
  }, [])

  const registerGeneratedReceipt = async (receiptData: ReceiptData[]) => {
    try {
      const valorTotal = receiptData.reduce((sum, receipt) => sum + receipt.valor, 0)
      const tipoValorTexto = tipoValor === "adiantado" ? "Adiantado" : "Mês"
      const arquivoNome = `recibos_vale_alimentacao_${tipoValorTexto}_${periodo.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`

      const empresas = receiptData.map((r) => r.empresa).filter(Boolean)
      const empresaPredominante = empresas.length > 0 ? empresas[0] : "GA SERVIÇOS"

      const { data, error } = await supabase
        .from("receipts_generated")
        .insert([
          {
            tipo: `vale_alimentacao_${tipoValor}`,
            periodo: periodo,
            data_pagamento: dataPagamento,
            total_funcionarios: receiptData.length,
            valor_total: valorTotal,
            arquivo_nome: arquivoNome,
            empresa: empresaPredominante,
          },
        ])
        .select()

      if (error) throw error

      await loadReceiptsHistory()

      toast({
        title: "Sucesso",
        description: "Recibo registrado no sistema com sucesso",
      })
    } catch (error) {
      console.error("Erro ao registrar recibo:", error)
      toast({
        title: "Aviso",
        description: "PDF gerado, mas houve erro ao registrar no sistema",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]

      console.log("[v0] ========== ANÁLISE DETALHADA DA PLANILHA ==========")
      console.log("[v0] Total de linhas na planilha:", jsonData.length)
      console.log("[v0] Cabeçalhos (linha 1):", jsonData[0])
      console.log("[v0] Total de colunas no cabeçalho:", jsonData[0]?.length || 0)

      console.log("[v0] ========== PRIMEIRAS 5 LINHAS DE DADOS ==========")
      for (let i = 1; i <= Math.min(5, jsonData.length - 1); i++) {
        const row = jsonData[i]
        console.log(`[v0] ===== LINHA ${i} (${row.length} colunas) =====`)
        console.log(`[v0] Linha completa:`, row)
        console.log(`[v0]   Coluna 0 (Colaborador): "${row[0]}"`)
        console.log(`[v0]   Coluna 1 (Escala): "${row[1]}"`)
        console.log(`[v0]   Coluna 2 (Valor Total): "${row[2]}"`)
        console.log(`[v0]   Coluna 3 (Dias Trabalhados): "${row[3]}"`)
        console.log(`[v0]   Coluna 4 (Valor do Mês): "${row[4]}"`)
        console.log(`[v0]   Coluna 5 (Valor Adiantado): "${row[5]}"`)
        console.log(`[v0]   Coluna 6 (Empresa): "${row[6]}"`)
        console.log(`[v0]   Coluna 7 (Cidade): "${row[7]}"`)
      }
      console.log("[v0] ===============================================")

      const headers = jsonData[0]
      const rows = jsonData.slice(1)

      const cidadesValidas = ["Pelotas", "Macapá", "Uberlândia"]
      const empresasValidas = ["GA SERVIÇOS", "GOMES", "GUIDOTTI"]

      // Criar versões normalizadas para comparação
      const cidadesValidasNormalizadas = cidadesValidas.map(normalizarTexto)
      const empresasValidasNormalizadas = empresasValidas.map(normalizarTexto)

      // Estrutura esperada da planilha (8 colunas):
      // Coluna 1 (índice 0): Colaborador
      // Coluna 2 (índice 1): Escala
      // Coluna 3 (índice 2): Valor Total
      // Coluna 4 (índice 3): Dias Trabalhados
      // Coluna 5 (índice 4): Valor do mês
      // Coluna 6 (índice 5): Valor Adiantado
      // Coluna 7 (índice 6): Empresa
      // Coluna 8 (índice 7): Cidade
      const processedData: EmployeeData[] = rows
        .filter((row) => row.length > 0 && row[0])
        .map((row, index) => {
          const empresaRaw = String(row[6] || "").trim()
          const cidadeRaw = String(row[7] || "").trim()

          let empresaFinal = empresaRaw
          const empresaNormalizada = normalizarTexto(empresaRaw)
          const empresaIndex = empresasValidasNormalizadas.indexOf(empresaNormalizada)

          if (empresaRaw && empresaIndex === -1) {
            console.warn(`[v0] ⚠️ Empresa inválida: "${empresaRaw}" (linha ${index + 2})`)
            empresaFinal = "GA SERVIÇOS" // Default
          } else if (empresaIndex !== -1) {
            empresaFinal = empresasValidas[empresaIndex] // Usa o formato correto
          }

          let cidadeFinal = ""
          const cidadeNormalizada = normalizarTexto(cidadeRaw)
          const cidadeIndex = cidadesValidasNormalizadas.indexOf(cidadeNormalizada)

          if (cidadeRaw && cidadeIndex !== -1) {
            cidadeFinal = cidadesValidas[cidadeIndex] // Usa o formato correto (Title Case)
          } else if (cidadeRaw) {
            console.warn(`[v0] ⚠️ Cidade inválida: "${cidadeRaw}" (linha ${index + 2})`)
          }

          return {
            nome: String(row[0] || "").trim(),
            valorMes: Number(row[4]) || 0,
            valorAdiantado: Number(row[5]) || 0,
            empresa: empresaFinal || "GA SERVIÇOS",
            cidade: cidadeFinal,
          }
        })
        .filter((item) => item.nome && (item.valorAdiantado > 0 || item.valorMes > 0))

      console.log("[v0] ========== RESUMO DO PROCESSAMENTO ==========")
      console.log("[v0] Total de funcionários processados:", processedData.length)
      console.log("[v0] Funcionários com Valor Adiantado:", processedData.filter((f) => f.valorAdiantado > 0).length)
      console.log("[v0] Funcionários com Valor do Mês:", processedData.filter((f) => f.valorMes > 0).length)

      setEmployeeData(processedData)

      const cidadesEncontradas = [...new Set(processedData.map((emp) => emp.cidade).filter(Boolean))]
      setCidadesDisponiveis(cidadesEncontradas.sort())
      setCidadeSelecionada("todas")
      console.log("[v0] Cidades encontradas:", cidadesEncontradas)

      const empresasEncontradas = [...new Set(processedData.map((emp) => emp.empresa).filter(Boolean))]
      setEmpresasDisponiveis(empresasEncontradas.sort())
      setEmpresaSelecionada("todas")
      console.log("[v0] Empresas encontradas:", empresasEncontradas)
      console.log("[v0] ===============================================")

      const empresasInfo = empresasEncontradas.length > 0 ? ` (${empresasEncontradas.join(", ")})` : ""
      const cidadesInfo = cidadesEncontradas.length > 0 ? ` - Cidades: ${cidadesEncontradas.join(", ")}` : ""

      toast({
        title: "Sucesso",
        description: `${processedData.length} funcionários carregados da planilha${empresasInfo}${cidadesInfo}`,
      })
    } catch (error) {
      console.error("[v0] Erro ao processar planilha:", error)
      toast({
        title: "Erro",
        description: "Erro ao processar a planilha. Verifique o formato do arquivo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const generateReceipts = () => {
    if (!periodo || !dataPagamento) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o período e a data de pagamento",
        variant: "destructive",
      })
      return
    }

    if (employeeData.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado de funcionário carregado",
        variant: "destructive",
      })
      return
    }

    let dadosFiltrados = employeeData

    if (cidadeSelecionada !== "todas") {
      dadosFiltrados = dadosFiltrados.filter((emp) => emp.cidade === cidadeSelecionada)
    }

    if (empresaSelecionada !== "todas") {
      dadosFiltrados = dadosFiltrados.filter((emp) => emp.empresa === empresaSelecionada)
    }

    const totalAntesFiltro = dadosFiltrados.length
    if (tipoValor === "adiantado") {
      dadosFiltrados = dadosFiltrados.filter((emp) => emp.valorAdiantado > 0)
      console.log(`[v0] Filtro Valor Adiantado: ${totalAntesFiltro} → ${dadosFiltrados.length} funcionários`)
    } else {
      dadosFiltrados = dadosFiltrados.filter((emp) => emp.valorMes > 0)
      console.log(`[v0] Filtro Valor do Mês: ${totalAntesFiltro} → ${dadosFiltrados.length} funcionários`)
    }

    if (dadosFiltrados.length === 0) {
      const tipoTexto = tipoValor === "adiantado" ? "Valor Adiantado" : "Valor do Mês"
      toast({
        title: "Erro",
        description: `Nenhum funcionário encontrado com ${tipoTexto} nos filtros selecionados`,
        variant: "destructive",
      })
      return
    }

    const receiptData: ReceiptData[] = dadosFiltrados.map((employee) => {
      const valorSelecionado = tipoValor === "adiantado" ? employee.valorAdiantado : employee.valorMes

      console.log(`[v0] ${employee.nome} - Tipo: ${tipoValor}, Valor: R$ ${valorSelecionado.toFixed(2)}`)

      return {
        nome: employee.nome,
        valor: valorSelecionado,
        periodo,
        dataPagamento,
        empresa: employee.empresa || "GA SERVIÇOS",
      }
    })

    setReceipts(receiptData)

    const cidadeInfo = cidadeSelecionada !== "todas" ? ` (${cidadeSelecionada})` : ""
    const empresaInfo = empresaSelecionada !== "todas" ? ` - ${empresaSelecionada}` : ""
    const valorInfo = tipoValor === "adiantado" ? " - Valor Adiantado" : " - Valor do Mês"
    const totalValor = receiptData.reduce((sum, r) => sum + r.valor, 0)

    console.log(`[v0] Recibos gerados: ${receiptData.length}, Total: R$ ${totalValor.toFixed(2)}`)

    toast({
      title: "Sucesso",
      description: `${receiptData.length} recibos gerados${cidadeInfo}${empresaInfo}${valorInfo}`,
    })
  }

  const generatePDFByCidade = async (cidade: string) => {
    if (!periodo || !dataPagamento) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o período e a data de pagamento",
        variant: "destructive",
      })
      return
    }

    if (employeeData.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado de funcionário carregado",
        variant: "destructive",
      })
      return
    }

    let dadosFiltrados = employeeData.filter((emp) => emp.cidade === cidade)

    if (empresaSelecionada !== "todas") {
      dadosFiltrados = dadosFiltrados.filter((emp) => emp.empresa === empresaSelecionada)
    }

    const totalAntesFiltro = dadosFiltrados.length
    if (tipoValor === "adiantado") {
      dadosFiltrados = dadosFiltrados.filter((emp) => emp.valorAdiantado > 0)
      console.log(`[v0] ${cidade} - Filtro Valor Adiantado: ${totalAntesFiltro} → ${dadosFiltrados.length}`)
    } else {
      dadosFiltrados = dadosFiltrados.filter((emp) => emp.valorMes > 0)
      console.log(`[v0] ${cidade} - Filtro Valor do Mês: ${totalAntesFiltro} → ${dadosFiltrados.length}`)
    }

    if (dadosFiltrados.length === 0) {
      const tipoTexto = tipoValor === "adiantado" ? "Valor Adiantado" : "Valor do Mês"
      toast({
        title: "Erro",
        description: `Nenhum funcionário com ${tipoTexto} encontrado para ${cidade}${empresaSelecionada !== "todas" ? ` na empresa ${empresaSelecionada}` : ""}`,
        variant: "destructive",
      })
      return
    }

    const receiptData: ReceiptData[] = dadosFiltrados.map((employee) => ({
      nome: employee.nome,
      valor: tipoValor === "adiantado" ? employee.valorAdiantado : employee.valorMes,
      periodo,
      dataPagamento,
      empresa: employee.empresa || "GA SERVIÇOS",
    }))

    await registerGeneratedReceipt(receiptData)

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const receiptHTML = generateReceiptHTMLFromData(receiptData, periodo, dataPagamento)

    const tipoValorTexto = tipoValor === "adiantado" ? "Valor Adiantado" : "Valor do Mês"

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibos de Vale Alimentação - ${cidade} - ${tipoValorTexto}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body>
          ${receiptHTML}
        </body>
      </html>
    `)

    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 500)

    const valorInfo = tipoValor === "adiantado" ? " (Valor Adiantado)" : " (Valor do Mês)"
    toast({
      title: "Sucesso",
      description: `PDF gerado para ${cidade} com ${receiptData.length} recibos${valorInfo}`,
    })
  }

  const generatePDF = async () => {
    if (receipts.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum recibo gerado para download",
        variant: "destructive",
      })
      return
    }

    await registerGeneratedReceipt(receipts)

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const receiptHTML = generateReceiptHTML()

    const cidadeInfo = cidadeSelecionada !== "todas" ? ` - ${cidadeSelecionada}` : ""
    const tipoValorTexto = tipoValor === "adiantado" ? "Valor Adiantado" : "Valor do Mês"

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibos de Vale Alimentação${cidadeInfo} - ${tipoValorTexto}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body>
          ${receiptHTML}
        </body>
      </html>
    `)

    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const reprintReceipt = async (receipt: GeneratedReceipt) => {
    try {
      const receiptData: ReceiptData[] = employeeData
        .filter((emp) => emp.empresa === receipt.empresa || !receipt.empresa)
        .map((employee) => ({
          nome: employee.nome,
          valor: tipoValor === "adiantado" ? employee.valorAdiantado : employee.valorMes,
          periodo: receipt.periodo,
          dataPagamento: receipt.data_pagamento,
          empresa: receipt.empresa || "GA SERVIÇOS",
        }))

      if (receiptData.length === 0) {
        toast({
          title: "Aviso",
          description: "Não há dados carregados para reimprimir. Carregue a planilha novamente.",
          variant: "destructive",
        })
        return
      }

      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      const receiptHTML = generateReceiptHTMLFromData(receiptData, receipt.periodo, receipt.data_pagamento)

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Recibos de Vale Alimentação - ${receipt.periodo}</title>
            <style>
              ${getPrintStyles()}
            </style>
          </head>
          <body>
            ${receiptHTML}
          </body>
        </html>
      `)

      printWindow.document.close()

      setTimeout(() => {
        printWindow.print()
      }, 500)

      toast({
        title: "Sucesso",
        description: "Recibo aberto para impressão",
      })
    } catch (error) {
      console.error("Erro ao reimprimir recibo:", error)
      toast({
        title: "Erro",
        description: "Erro ao reimprimir recibo",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (receiptId: string) => {
    setReceiptToDelete(receiptId)
    setDeletePassword("")
    setDeleteDialogOpen(true)
  }

  const deleteReceipt = async () => {
    if (deletePassword !== "987654321") {
      toast({
        title: "Erro",
        description: "Senha incorreta",
        variant: "destructive",
      })
      return
    }

    if (!receiptToDelete) return

    try {
      const { error } = await supabase.from("receipts_generated").delete().eq("id", receiptToDelete)

      if (error) throw error

      await loadReceiptsHistory()

      toast({
        title: "Sucesso",
        description: "Recibo excluído com sucesso",
      })

      setDeleteDialogOpen(false)
      setReceiptToDelete(null)
      setDeletePassword("")
    } catch (error) {
      console.error("Erro ao excluir recibo:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir recibo",
        variant: "destructive",
      })
    }
  }

  const generateReceiptHTML = () => {
    let html = ""
    let currentPage = ""
    let receiptsInPage = 0

    receipts.forEach((receipt, index) => {
      if (receiptsInPage === 0) {
        currentPage = '<div class="page">'
      }

      currentPage += `
        <div class="receipt">
          <div class="header">
            <div class="logo"></div>
            <div class="receipt-title">Recibo de Vale Alimentação</div>
          </div>
          
          <div class="content">
            <div class="field">
              <span class="field-label">Funcionário:</span>
              <span class="field-value">${receipt.nome}</span>
            </div>
            
            <div class="field">
              <span class="field-label">Valor:</span>
              <span class="field-value value-amount">R$ ${receipt.valor.toFixed(2).replace(".", ",")}</span>
            </div>
            
            <div class="field">
              <span class="field-label">Período:</span>
              <span class="field-value">${receipt.periodo}</span>
            </div>
            
            <div class="field">
              <span class="field-label">Data Pagamento:</span>
              <span class="field-value">${receipt.dataPagamento}</span>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-field">
              <span class="signature-label">Assinatura do Colaborador:</span>
              <div class="signature-line"></div>
            </div>
          </div>
          
          <div class="footer">
            Recibo válido para comprovação de pagamento de vale alimentação • Gerado em: ${new Date().toLocaleDateString("pt-BR")}
          </div>
        </div>
      `

      receiptsInPage++

      if (receiptsInPage === 3 || index === receipts.length - 1) {
        currentPage += "</div>"
        html += currentPage
        receiptsInPage = 0
      }
    })

    return html
  }

  const generateReceiptHTMLFromData = (receiptData: ReceiptData[], periodo: string, dataPagamento: string): string => {
    let html = ""
    let currentPage = ""
    let receiptsInPage = 0

    receiptData.forEach((receipt, index) => {
      if (receiptsInPage === 0) {
        currentPage = '<div class="page">'
      }

      currentPage += `
        <div class="receipt">
          <div class="header">
            <div class="logo"></div>
            <div class="receipt-title">Recibo de Vale Alimentação</div>
          </div>
          
          <div class="content">
            <div class="field">
              <span class="field-label">Funcionário:</span>
              <span class="field-value">${receipt.nome}</span>
            </div>
            
            <div class="field">
              <span class="field-label">Valor:</span>
              <span class="field-value value-amount">R$ ${receipt.valor.toFixed(2).replace(".", ",")}</span>
            </div>
            
            <div class="field">
              <span class="field-label">Período:</span>
              <span class="field-value">${periodo}</span>
            </div>
            
            <div class="field">
              <span class="field-label">Data Pagamento:</span>
              <span class="field-value">${dataPagamento}</span>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-field">
              <span class="signature-label">Assinatura do Colaborador:</span>
              <div class="signature-line"></div>
            </div>
          </div>
          
          <div class="footer">
            Recibo válido para comprovação de pagamento de vale alimentação • Gerado em: ${new Date().toLocaleDateString("pt-BR")}
          </div>
        </div>
      `

      receiptsInPage++

      if (receiptsInPage === 3 || index === receiptData.length - 1) {
        currentPage += "</div>"
        html += currentPage
        receiptsInPage = 0
      }
    })

    return html
  }

  const getPrintStyles = (): string => {
    return `
      @page {
        size: A4;
        margin: 8mm;
      }
      
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        font-size: 11px;
      }
      
      .page {
        width: 210mm;
        min-height: 297mm;
        display: flex;
        flex-direction: column;
        gap: 8mm;
        page-break-after: always;
      }
      
      .page:last-child {
        page-break-after: avoid;
      }
      
      .receipt {
        border: 2px solid #000;
        padding: 12px;
        height: 90mm;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }
      
      .header {
        text-align: center;
        border-bottom: 1px solid #000;
        padding-bottom: 8px;
        margin-bottom: 10px;
      }
      
      .logo {
        width: 70px;
        height: 50px;
        margin: 0 auto 8px;
        background-image: url('/images/logo-ga-azul.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      }
      
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        text-transform: uppercase;
      }
      
      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .field {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .field-label {
        font-weight: bold;
        min-width: 110px;
        font-size: 11px;
      }
      
      .field-value {
        border-bottom: 1px solid #000;
        flex: 1;
        padding: 2px 5px;
        min-height: 18px;
      }
      
      .value-amount {
        font-size: 16px;
        font-weight: bold;
      }
      
      .signature-section {
        margin-top: 12px;
        padding-top: 10px;
      }
      
      .signature-field {
        display: flex;
        align-items: flex-end;
        gap: 10px;
      }
      
      .signature-label {
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
      }
      
      .signature-line {
        flex: 1;
        min-height: 25px;
      }
      
      .footer {
        text-align: center;
        border-top: 1px solid #000;
        padding-top: 8px;
        margin-top: 8px;
        font-size: 9px;
        line-height: 1.3;
      }
      
      @media print {
        body { 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recibo de vale alimentação</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Incluir Planilha
          </CardTitle>
          <CardDescription>
            Faça upload de uma planilha Excel com 8 colunas nesta ordem: <br />
            <strong>
              1. Colaborador | 2. Escala | 3. Valor Total | 4. Dias Trabalhados | 5. VALOR DO MÊS | 6. VALOR ADIANTADO |
              7. Empresa | 8. Cidade
            </strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            ref={fileInputRef}
            disabled={isProcessing}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full bg-black text-white hover:bg-gray-800 rounded-none"
            size="lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            {isProcessing ? "Processando..." : "Adicionar Planilha"}
          </Button>

          {employeeData.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <p className="text-green-800 font-medium">✅ {employeeData.length} funcionários carregados da planilha</p>
              <div className="text-green-700 text-sm space-y-1">
                <p>• Funcionários com Valor Adiantado: {employeeData.filter((f) => f.valorAdiantado > 0).length}</p>
                <p>• Funcionários com Valor do Mês: {employeeData.filter((f) => f.valorMes > 0).length}</p>
              </div>
              {empresasDisponiveis.length > 0 && (
                <p className="text-green-700 text-sm">Empresas: {empresasDisponiveis.join(", ")}</p>
              )}
              {cidadesDisponiveis.length > 0 && (
                <p className="text-green-700 text-sm">Cidades: {cidadesDisponiveis.join(", ")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurações do Recibo
          </CardTitle>
          <CardDescription>
            Configure o período, data de pagamento e escolha qual valor usar nos recibos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Input
                id="periodo"
                placeholder="Ex: Janeiro/2024"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="data-pagamento">Data de Pagamento</Label>
              <Input
                id="data-pagamento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>
          </div>

          <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
            <Label className="text-base font-semibold mb-3 block">Escolha o Tipo de Valor para os Recibos</Label>
            <RadioGroup value={tipoValor} onValueChange={(value) => setTipoValor(value as "adiantado" | "mes")}>
              <div className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded">
                <RadioGroupItem value="adiantado" id="adiantado" />
                <Label htmlFor="adiantado" className="font-normal cursor-pointer flex-1">
                  <span className="font-semibold">Valor Adiantado</span>
                  <span className="text-sm text-gray-600 block">Usar valores da coluna 6 "VALOR ADIANTADO"</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded">
                <RadioGroupItem value="mes" id="mes" />
                <Label htmlFor="mes" className="font-normal cursor-pointer flex-1">
                  <span className="font-semibold">Valor do Mês</span>
                  <span className="text-sm text-gray-600 block">Usar valores da coluna 5 "VALOR DO MÊS"</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {empresasDisponiveis.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="empresa" className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Filtrar por Empresa (opcional)
              </Label>
              <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                <SelectTrigger id="empresa" className="w-full">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Empresas</SelectItem>
                  {empresasDisponiveis.map((empresa) => (
                    <SelectItem key={empresa} value={empresa}>
                      {empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {cidadesDisponiveis.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="cidade" className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Filtrar por Cidade (opcional)
              </Label>
              <Select value={cidadeSelecionada} onValueChange={setCidadeSelecionada}>
                <SelectTrigger id="cidade" className="w-full">
                  <SelectValue placeholder="Selecione uma cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Cidades</SelectItem>
                  {cidadesDisponiveis.map((cidade) => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">A cidade é usada apenas para filtro, não aparece no recibo</p>
            </div>
          )}

          {console.log("[v0] Cidades disponíveis para filtro:", cidadesDisponiveis)}
          {console.log("[v0] Quantidade de cidades:", cidadesDisponiveis.length)}

          <Button
            onClick={generateReceipts}
            disabled={employeeData.length === 0 || !periodo || !dataPagamento}
            className="w-full bg-black text-white hover:bg-gray-800 rounded-none"
            size="lg"
          >
            Gerar Recibos
          </Button>
        </CardContent>
      </Card>

      {cidadesDisponiveis.length > 0 && periodo && dataPagamento && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Gerar Recibos por Cidade
            </CardTitle>
            <CardDescription>
              Gere PDFs separados para cada cidade automaticamente (usando o tipo de valor e empresa selecionados acima)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cidadesDisponiveis.map((cidade) => {
                let qtdFuncionarios = employeeData.filter((emp) => emp.cidade === cidade)
                if (empresaSelecionada !== "todas") {
                  qtdFuncionarios = qtdFuncionarios.filter((emp) => emp.empresa === empresaSelecionada)
                }
                if (tipoValor === "adiantado") {
                  qtdFuncionarios = qtdFuncionarios.filter((emp) => emp.valorAdiantado > 0)
                } else {
                  qtdFuncionarios = qtdFuncionarios.filter((emp) => emp.valorMes > 0)
                }
                const valorTipo = tipoValor === "adiantado" ? "Adiantado" : "Mês"
                return (
                  <Button
                    key={cidade}
                    onClick={() => generatePDFByCidade(cidade)}
                    variant="outline"
                    className="flex flex-col items-start h-auto py-3"
                  >
                    <span className="font-semibold">{cidade}</span>
                    <span className="text-xs text-muted-foreground">
                      {qtdFuncionarios.length} funcionário{qtdFuncionarios.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">{valorTipo}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recibos Gerados ({receipts.length})
            </CardTitle>
            <CardDescription>
              Preview dos recibos que serão incluídos no PDF (3 recibos por folha A4) - Tipo:{" "}
              <strong>{tipoValor === "adiantado" ? "Valor Adiantado" : "Valor do Mês"}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
              {receipts.map((receipt, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">{receipt.nome}</span>
                    <span className="text-sm text-gray-600 ml-2">({receipt.empresa})</span>
                  </div>
                  <span className="text-green-600 font-bold">R$ {receipt.valor.toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Total:</strong> R${" "}
                {receipts
                  .reduce((sum, r) => sum + r.valor, 0)
                  .toFixed(2)
                  .replace(".", ",")}
              </p>
            </div>

            <Button onClick={generatePDF} className="w-full" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Baixar PDF dos Recibos
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Recibos Gerados
          </CardTitle>
          <CardDescription>Últimos recibos gerados no sistema - Clique para reimprimir</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="text-center py-4">Carregando histórico...</div>
          ) : generatedReceipts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Nenhum recibo gerado ainda</div>
          ) : (
            <div className="space-y-2">
              {generatedReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => reprintReceipt(receipt)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div>
                        <p className="font-medium">{receipt.periodo}</p>
                        {receipt.empresa && <p className="text-sm text-blue-600 font-medium">{receipt.empresa}</p>}
                        <p className="text-sm text-gray-600">
                          {receipt.total_funcionarios} funcionários • R${" "}
                          {receipt.valor_total.toFixed(2).replace(".", ",")}
                        </p>
                        <p className="text-xs text-gray-500">
                          Gerado em: {new Date(receipt.data_geracao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(receipt.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Recibo</DialogTitle>
            <DialogDescription>Para excluir este recibo, digite a senha de autorização abaixo.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-password">Senha</Label>
            <Input
              id="delete-password"
              type="password"
              placeholder="Digite a senha"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  deleteReceipt()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteReceipt}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
