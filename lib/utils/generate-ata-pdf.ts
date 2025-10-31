import jsPDF from "jspdf"

export interface AtaData {
  nome: string
  data: string
  registro: string
  resposta?: string
  dataResposta?: string
  tresposta?: string
  dataTresposta?: string
  status: string
  arquivos?: string[]
}

export function generateAtaPDF(ata: AtaData) {
  const doc = new jsPDF()

  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Função auxiliar para adicionar texto com quebra de linha
  const addText = (text: string, fontSize = 11, isBold = false) => {
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", isBold ? "bold" : "normal")

    const lines = doc.splitTextToSize(text, maxWidth)

    // Verificar se precisa de nova página
    if (yPosition + lines.length * fontSize * 0.5 > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }

    doc.text(lines, margin, yPosition)
    yPosition += lines.length * fontSize * 0.5 + 5
  }

  // Função auxiliar para adicionar seção
  const addSection = (title: string, content: string, badge?: string) => {
    // Adicionar espaço antes da seção
    yPosition += 5

    // Título da seção
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPosition - 5, maxWidth, 10, "F")
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(title, margin + 2, yPosition)

    if (badge) {
      const badgeWidth = doc.getTextWidth(badge) + 4
      doc.setFillColor(59, 130, 246)
      doc.rect(pageWidth - margin - badgeWidth, yPosition - 5, badgeWidth, 6, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text(badge, pageWidth - margin - badgeWidth + 2, yPosition - 1)
      doc.setTextColor(0, 0, 0)
    }

    yPosition += 10

    // Conteúdo da seção
    addText(content, 10, false)
  }

  // Cabeçalho
  doc.setFillColor(0, 0, 0)
  doc.rect(0, 0, pageWidth, 30, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("ATA DE SUPERVISÃO", pageWidth / 2, 15, { align: "center" })
  doc.setTextColor(0, 0, 0)

  yPosition = 40

  // Informações básicas
  addText(`Supervisor: ${ata.nome}`, 12, true)
  addText(`Data: ${ata.data}`, 11, false)
  addText(`Status: ${ata.status.toUpperCase()}`, 11, false)

  // Linha separadora
  yPosition += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Registro Original
  addSection("REGISTRO ORIGINAL", ata.registro, "Etapa 1")

  // Primeira Resposta
  if (ata.resposta) {
    addSection(`PRIMEIRA RESPOSTA (${ata.dataResposta || ""})`, ata.resposta, "Etapa 2")
  }

  // Segunda Resposta
  if (ata.tresposta) {
    addSection(`SEGUNDA RESPOSTA (${ata.dataTresposta || ""})`, ata.tresposta, "Etapa 3")
  }

  // Arquivos anexos
  if (ata.arquivos && ata.arquivos.length > 0) {
    yPosition += 10
    addText(`Arquivos anexos: ${ata.arquivos.length} arquivo(s)`, 10, true)
    ata.arquivos.forEach((url, i) => {
      addText(`${i + 1}. ${url}`, 9, false)
    })
  }

  // Rodapé
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Página ${i} de ${totalPages} | Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    )
  }

  // Salvar PDF
  const fileName = `Ata_${ata.nome.replace(/\s+/g, "_")}_${ata.data.replace(/\//g, "-")}.pdf`
  doc.save(fileName)
}
