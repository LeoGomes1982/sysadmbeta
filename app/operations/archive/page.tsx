"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, FolderOpen, FileText } from "lucide-react"

const months = [
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

export default function ArchivePage() {
  const [finalizedAtas, setFinalizedAtas] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>("Janeiro")
  const [searchTerm, setSearchTerm] = useState("")
  const [supervisorFilter, setSupervisorFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [isFolderOpen, setIsFolderOpen] = useState(false)

  useEffect(() => {
    const loadArchivedAtas = () => {
      const stored = localStorage.getItem("archivedAtas")
      if (stored) {
        const atas = JSON.parse(stored)
        setFinalizedAtas(atas)
      } else {
        setFinalizedAtas([])
      }
    }

    loadArchivedAtas()

    const handleStorageChange = () => {
      loadArchivedAtas()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Filtrar atas por mês selecionado
  const filteredByMonth = selectedMonth ? finalizedAtas.filter((ata) => ata.month === selectedMonth) : []

  // Aplicar filtros adicionais
  const filteredAtas = filteredByMonth.filter((ata) => {
    const matchesSearch = (ata.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    const matchesSupervisor = supervisorFilter === "" || ata.supervisor === supervisorFilter
    const matchesDate = dateFilter === "" || ata.date.includes(dateFilter)
    return matchesSearch && matchesSupervisor && matchesDate
  })

  const supervisors = [...new Set(finalizedAtas.map((ata) => ata.supervisor))]

  const handleDownloadAta = (ata: any) => {
    // Simular download de PDF
    console.log(`Baixando ata: ${ata.name}`)
    alert(`Download iniciado para: ${ata.name}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Arquivo de Atas</h1>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Seleção de Pastas por Mês */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Pastas por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {months.map((month) => {
              const monthCount = finalizedAtas.filter((ata) => ata.month === month).length
              return (
                <Button
                  key={month}
                  variant={selectedMonth === month ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setSelectedMonth(month)
                    setIsFolderOpen(true)
                  }}
                >
                  <FolderOpen className="h-6 w-6" />
                  <span className="text-sm font-medium">{month}</span>
                  <Badge variant="secondary" className="text-xs">
                    {monthCount} atas
                  </Badge>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo da Pasta Selecionada */}
      {isFolderOpen && selectedMonth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Pasta: {selectedMonth}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFolderOpen(false)
                  setSelectedMonth("")
                  setSearchTerm("")
                  setSupervisorFilter("")
                  setDateFilter("")
                }}
              >
                Fechar Pasta
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ata..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os supervisores</SelectItem>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor} value={supervisor}>
                      {supervisor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Filtrar por data"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-48"
              />
            </div>

            {/* Lista de Atas */}
            <div className="space-y-3">
              {filteredAtas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma ata encontrada para os filtros selecionados</p>
                </div>
              ) : (
                filteredAtas.map((ata) => (
                  <Card key={ata.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <h3 className="font-medium">{ata.name}</h3>
                          <Badge variant="outline" className="bg-black text-white border-black rounded-sm">
                            {ata.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Supervisor: {ata.supervisor}</span>
                          <span>Data: {new Date(ata.date).toLocaleDateString("pt-BR")}</span>
                          <span>{ata.responses} respostas</span>
                          <span>{ata.attachments} anexos</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Visualizar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{ata.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Supervisor:</span> {ata.supervisor}
                                </div>
                                <div>
                                  <span className="font-medium">Data:</span>{" "}
                                  {new Date(ata.date).toLocaleDateString("pt-BR")}
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span> {ata.status}
                                </div>
                                <div>
                                  <span className="font-medium">Anexos:</span> {ata.attachments}
                                </div>
                              </div>

                              {ata.arquivos && ata.arquivos.length > 0 && (
                                <div className="border-t pt-4">
                                  <h4 className="font-medium mb-2">Arquivos Anexados:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {ata.arquivos.map((arquivo: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {arquivo}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Registro Original:</h4>
                                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                                  {ata.registro || "Registro não disponível"}
                                </p>

                                {ata.resposta && (
                                  <>
                                    <h4 className="font-medium mb-2">Primeira Resposta:</h4>
                                    <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                                      {ata.resposta}
                                    </p>
                                  </>
                                )}

                                {ata.tresposta && (
                                  <>
                                    <h4 className="font-medium mb-2">Resposta Final:</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ata.tresposta}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadAta(ata)}>
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
