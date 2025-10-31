"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, User, Shield, Trash2, Eye, FileText, Filter, ChevronDown, ChevronUp, Download } from "lucide-react"
import jsPDF from "jspdf"
import { useExtraServices, type ExtraService } from "@/hooks/use-extra-services"
import { useEmployees } from "@/hooks/use-employees"
import { useClientsSuppliers } from "@/hooks/use-realtime"

export default function ExtraServicesPage() {
  const { services, loading, error, addService, deleteService } = useExtraServices()
  const { data: employees = [], loading: loadingEmployees } = useEmployees()
  const { data: clientsSuppliers = [], loading: loadingClients } = useClientsSuppliers()

  useEffect(() => {
    console.log("[v0] Funcionários carregados:", employees?.length || 0)
    console.log("[v0] Loading employees:", loadingEmployees)
    if (employees && employees.length > 0) {
      console.log("[v0] Primeiro funcionário:", employees[0])
    }
  }, [employees, loadingEmployees])

  const [filteredServices, setFilteredServices] = useState<ExtraService[]>([])
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)
  const [showRegistrosModal, setShowRegistrosModal] = useState(false)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  const [servicoSelecionado, setServicoSelecionado] = useState<ExtraService | null>(null)
  const [currentStep, setCurrentStep] = useState<"type" | "form">("type")

  const [executorName, setExecutorName] = useState("")
  const [serviceReason, setServiceReason] = useState<"falta" | "atestado" | "evento" | "limpeza_extra" | "outro" | "">(
    "",
  )
  const [absentEmployeeName, setAbsentEmployeeName] = useState("")
  const [certificateEmployeeName, setCertificateEmployeeName] = useState("")
  const [certificateDate, setCertificateDate] = useState("")
  const [extraCleaningClient, setExtraCleaningClient] = useState("")
  const [otherReasonText, setOtherReasonText] = useState("")
  const [service, setService] = useState("")
  const [location, setLocation] = useState("")
  const [supervisor, setSupervisor] = useState("")
  const [date, setDate] = useState("")
  const [hours, setHours] = useState<"4" | "6" | "8" | "12">("4")
  const [serviceFunction, setServiceFunction] = useState<"Guarda" | "Limpeza">("Guarda")
  const [pixKey, setPixKey] = useState("")
  const [executorType, setExecutorType] = useState<"funcionario" | "externo">("funcionario")

  const [filterDate, setFilterDate] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [filterSupervisor, setFilterSupervisor] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [dateFilterType, setDateFilterType] = useState<"specific" | "week" | "month">("specific")
  const [filterWeek, setFilterWeek] = useState("")
  const [filterMonth, setFilterMonth] = useState("")

  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [absentEmployeeDropdownOpen, setAbsentEmployeeDropdownOpen] = useState(false)
  const [absentEmployeeSearch, setAbsentEmployeeSearch] = useState("")
  const absentEmployeeDropdownRef = useRef<HTMLDivElement>(null)
  const [certificateEmployeeDropdownOpen, setCertificateEmployeeDropdownOpen] = useState(false)
  const [certificateEmployeeSearch, setCertificateEmployeeSearch] = useState("")
  const certificateEmployeeDropdownRef = useRef<HTMLDivElement>(null)
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const clientDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let filtered = services

    if (dateFilterType === "specific" && filterDate) {
      filtered = filtered.filter((service) => service.date === filterDate)
    } else if (dateFilterType === "week" && filterWeek) {
      const [year, week] = filterWeek.split("-W")
      filtered = filtered.filter((service) => {
        const serviceDate = new Date(service.date)
        const serviceWeek = getWeekNumber(serviceDate)
        const serviceYear = serviceDate.getFullYear()
        return serviceYear.toString() === year && serviceWeek.toString().padStart(2, "0") === week
      })
    } else if (dateFilterType === "month" && filterMonth) {
      const [year, month] = filterMonth.split("-")
      filtered = filtered.filter((service) => {
        const serviceDate = new Date(service.date)
        return (
          serviceDate.getFullYear().toString() === year &&
          (serviceDate.getMonth() + 1).toString().padStart(2, "0") === month
        )
      })
    }

    if (filterLocation) {
      filtered = filtered.filter((service) =>
        (service.location?.toLowerCase() || "").includes(filterLocation.toLowerCase()),
      )
    }

    if (filterSupervisor) {
      filtered = filtered.filter((service) =>
        (service.supervisor?.toLowerCase() || "").includes(filterSupervisor.toLowerCase()),
      )
    }

    setFilteredServices(filtered)
  }, [services, filterDate, filterWeek, filterMonth, dateFilterType, filterLocation, filterSupervisor])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEmployeeDropdownOpen(false)
      }
      if (absentEmployeeDropdownRef.current && !absentEmployeeDropdownRef.current.contains(event.target as Node)) {
        setAbsentEmployeeDropdownOpen(false)
      }
      if (
        certificateEmployeeDropdownRef.current &&
        !certificateEmployeeDropdownRef.current.contains(event.target as Node)
      ) {
        setCertificateEmployeeDropdownOpen(false)
      }
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setClientDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const clearFilters = () => {
    setFilterDate("")
    setFilterWeek("")
    setFilterMonth("")
    setFilterLocation("")
    setFilterSupervisor("")
    setDateFilterType("specific")
  }

  const handleSubmit = async () => {
    if (!executorName || !service || !location || !supervisor || !date || !pixKey || !serviceReason) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    if (serviceReason === "falta" && !absentEmployeeName) {
      alert("Por favor, informe o nome de quem faltou.")
      return
    }
    if (serviceReason === "atestado" && (!certificateEmployeeName || !certificateDate)) {
      alert("Por favor, informe o nome de quem tem o atestado e a data do atestado.")
      return
    }
    if (serviceReason === "limpeza_extra" && !extraCleaningClient) {
      alert("Por favor, selecione o cliente para a limpeza extra.")
      return
    }
    if ((serviceReason === "evento" || serviceReason === "outro") && !otherReasonText) {
      alert("Por favor, descreva o motivo do serviço extra.")
      return
    }

    const success = await addService({
      executorType,
      executorName,
      service,
      location,
      supervisor,
      date,
      hours,
      function: serviceFunction,
      pixKey,
      reason: serviceReason,
      absentEmployeeName: serviceReason === "falta" ? absentEmployeeName : undefined,
      certificateEmployeeName: serviceReason === "atestado" ? certificateEmployeeName : undefined,
      certificateDate: serviceReason === "atestado" ? certificateDate : undefined,
      extraCleaningClient: serviceReason === "limpeza_extra" ? extraCleaningClient : undefined,
      otherReasonText: serviceReason === "evento" || serviceReason === "outro" ? otherReasonText : undefined,
    } as any)

    if (success) {
      setExecutorType("funcionario")
      setExecutorName("")
      setServiceReason("")
      setAbsentEmployeeName("")
      setCertificateEmployeeName("")
      setCertificateDate("")
      setExtraCleaningClient("")
      setOtherReasonText("")
      setService("")
      setLocation("")
      setSupervisor("")
      setDate("")
      setHours("4")
      setServiceFunction("Guarda")
      setPixKey("")
      setShowNewServiceModal(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço extra?")) {
      await deleteService(id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const openModal = () => {
    setShowNewServiceModal(true)
    setCurrentStep("type")
    setExecutorType("funcionario")
    setExecutorName("")
    setServiceReason("")
    setAbsentEmployeeName("")
    setCertificateEmployeeName("")
    setCertificateDate("")
    setExtraCleaningClient("")
    setOtherReasonText("")
    setService("")
    setLocation("")
    setSupervisor("")
    setDate("")
    setHours("4")
    setServiceFunction("Guarda")
    setPixKey("")
  }

  const visualizarDetalhes = (service: ExtraService) => {
    setServicoSelecionado(service)
    setShowDetalhesModal(true)
    setShowRegistrosModal(false)
  }

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  const calculateServiceValue = (hours: string, serviceFunction: string) => {
    // Guarda and Limpeza: 4h and 6h = R$ 100,00 | 8h and 12h = R$ 120,00
    const hourlyRates = {
      Guarda: { "4": 100, "6": 100, "8": 120, "12": 120 },
      Limpeza: { "4": 100, "6": 100, "8": 120, "12": 120 },
    }
    return hourlyRates[serviceFunction as keyof typeof hourlyRates][hours as keyof (typeof hourlyRates)["Guarda"]] || 0
  }

  const generatePDFReport = () => {
    if (filteredServices.length === 0) {
      alert("Nenhum serviço encontrado para gerar o relatório.")
      return
    }

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("RELATÓRIO DE SERVIÇOS EXTRAS", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 35)

    let yPosition = 50
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Nome", 20, yPosition)
    doc.text("Data", 70, yPosition)
    doc.text("Local", 100, yPosition)
    doc.text("Valor (R$)", 140, yPosition)
    doc.text("Chave PIX", 170, yPosition)

    doc.line(20, yPosition + 2, 190, yPosition + 2)
    yPosition += 10

    doc.setFont("helvetica", "normal")
    let totalGeral = 0

    filteredServices.forEach((service) => {
      const valor = calculateServiceValue(service.hours, service.function)
      totalGeral += valor

      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      doc.text(service.executorName.substring(0, 20), 20, yPosition)
      doc.text(formatDate(service.date), 70, yPosition)
      doc.text(service.location.substring(0, 15), 100, yPosition)
      doc.text(`R$ ${valor.toFixed(2)}`, 140, yPosition)
      doc.text(service.pixKey.substring(0, 20), 170, yPosition)

      yPosition += 8
    })

    yPosition += 5
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 8
    doc.setFont("helvetica", "bold")
    doc.text("TOTAL GERAL:", 100, yPosition)
    doc.text(`R$ ${totalGeral.toFixed(2)}`, 140, yPosition)

    doc.save(`relatorio-servicos-extras-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p>Carregando serviços extras...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-red-600">
              <p>Erro ao carregar serviços extras: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredEmployees = employees.filter((emp) => emp.nome.toLowerCase().includes(employeeSearch.toLowerCase()))
  const filteredAbsentEmployees = employees.filter((emp) =>
    emp.nome.toLowerCase().includes(absentEmployeeSearch.toLowerCase()),
  )
  const filteredCertificateEmployees = employees.filter((emp) =>
    emp.nome.toLowerCase().includes(certificateEmployeeSearch.toLowerCase()),
  )
  const filteredClients = clientsSuppliers
    .filter((item: any) => item.type === "cliente")
    .filter((client: any) => client.name.toLowerCase().includes(clientSearch.toLowerCase()))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Serviços Extras</CardTitle>
            </div>
            <div className="flex gap-2">
              <Dialog open={showNewServiceModal} onOpenChange={setShowNewServiceModal}>
                <DialogTrigger asChild>
                  <Button className="bg-black hover:bg-gray-800 text-white" onClick={openModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Serviço Extra
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar Novo Serviço Extra</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 p-1">
                    {currentStep === "type" ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Quem executou o serviço?</p>
                        <div className="flex gap-4">
                          <Button
                            variant="outline"
                            className="flex-1 h-20 flex-col gap-2 bg-transparent"
                            onClick={() => {
                              setExecutorType("funcionario")
                              setCurrentStep("form")
                            }}
                          >
                            <User className="w-8 h-8" />
                            Funcionário
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 h-20 flex-col gap-2 bg-transparent"
                            onClick={() => {
                              setExecutorType("externo")
                              setCurrentStep("form")
                            }}
                          >
                            <Shield className="w-8 h-8" />
                            Externo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="executorName">
                            {executorType === "funcionario" ? "Funcionário" : "Nome da pessoa externa"}
                          </Label>
                          {executorType === "funcionario" ? (
                            loadingEmployees ? (
                              <div className="text-sm text-muted-foreground p-2 border rounded">
                                Carregando funcionários...
                              </div>
                            ) : employees.length === 0 ? (
                              <div className="text-sm text-muted-foreground p-2 border rounded">
                                Nenhum funcionário cadastrado. Por favor, cadastre funcionários primeiro.
                              </div>
                            ) : (
                              <div className="relative" ref={dropdownRef}>
                                <button
                                  type="button"
                                  onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)}
                                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                  <span className={executorName ? "text-black" : "text-gray-500"}>
                                    {executorName || "Selecione um funcionário"}
                                  </span>
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>

                                {employeeDropdownOpen && (
                                  <div className="absolute z-[10000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                                    <div className="p-2 border-b">
                                      <Input
                                        type="text"
                                        placeholder="Buscar funcionário..."
                                        value={employeeSearch}
                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                        className="h-8"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {filteredEmployees.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                          Nenhum funcionário encontrado
                                        </div>
                                      ) : (
                                        filteredEmployees.map((employee) => (
                                          <button
                                            key={employee.id}
                                            type="button"
                                            onClick={() => {
                                              setExecutorName(employee.nome)
                                              setEmployeeDropdownOpen(false)
                                              setEmployeeSearch("")
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                          >
                                            {employee.nome}
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          ) : (
                            <Input
                              value={executorName}
                              onChange={(e) => setExecutorName(e.target.value)}
                              placeholder="Digite o nome da pessoa externa"
                            />
                          )}
                        </div>

                        <div>
                          <Label htmlFor="serviceReason">Qual o motivo do serviço extra?</Label>
                          <Select
                            value={serviceReason}
                            onValueChange={(value: any) => {
                              setServiceReason(value)
                              // Reset conditional fields when reason changes
                              setAbsentEmployeeName("")
                              setCertificateEmployeeName("")
                              setCertificateDate("")
                              setExtraCleaningClient("")
                              setOtherReasonText("")
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={5} className="z-[9999]">
                              <SelectItem value="falta">Falta de colaborador</SelectItem>
                              <SelectItem value="atestado">Atestado de colaborador</SelectItem>
                              <SelectItem value="evento">Evento</SelectItem>
                              <SelectItem value="limpeza_extra">Limpeza extra</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {serviceReason === "falta" && (
                          <div>
                            <Label htmlFor="absentEmployeeName">Nome de quem faltou</Label>
                            {loadingEmployees ? (
                              <div className="text-sm text-muted-foreground p-2 border rounded">
                                Carregando funcionários...
                              </div>
                            ) : employees.length === 0 ? (
                              <div className="text-sm text-muted-foreground p-2 border rounded">
                                Nenhum funcionário cadastrado.
                              </div>
                            ) : (
                              <div className="relative" ref={absentEmployeeDropdownRef}>
                                <button
                                  type="button"
                                  onClick={() => setAbsentEmployeeDropdownOpen(!absentEmployeeDropdownOpen)}
                                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                  <span className={absentEmployeeName ? "text-black" : "text-gray-500"}>
                                    {absentEmployeeName || "Selecione o funcionário que faltou"}
                                  </span>
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>

                                {absentEmployeeDropdownOpen && (
                                  <div className="absolute z-[10000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                                    <div className="p-2 border-b">
                                      <Input
                                        type="text"
                                        placeholder="Buscar funcionário..."
                                        value={absentEmployeeSearch}
                                        onChange={(e) => setAbsentEmployeeSearch(e.target.value)}
                                        className="h-8"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {filteredAbsentEmployees.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                          Nenhum funcionário encontrado
                                        </div>
                                      ) : (
                                        filteredAbsentEmployees.map((employee) => (
                                          <button
                                            key={employee.id}
                                            type="button"
                                            onClick={() => {
                                              setAbsentEmployeeName(employee.nome)
                                              setAbsentEmployeeDropdownOpen(false)
                                              setAbsentEmployeeSearch("")
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                          >
                                            {employee.nome}
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {serviceReason === "atestado" && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="certificateEmployeeName">Nome de quem tem o atestado</Label>
                              {loadingEmployees ? (
                                <div className="text-sm text-muted-foreground p-2 border rounded">
                                  Carregando funcionários...
                                </div>
                              ) : employees.length === 0 ? (
                                <div className="text-sm text-muted-foreground p-2 border rounded">
                                  Nenhum funcionário cadastrado.
                                </div>
                              ) : (
                                <div className="relative" ref={certificateEmployeeDropdownRef}>
                                  <button
                                    type="button"
                                    onClick={() => setCertificateEmployeeDropdownOpen(!certificateEmployeeDropdownOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                                  >
                                    <span className={certificateEmployeeName ? "text-black" : "text-gray-500"}>
                                      {certificateEmployeeName || "Selecione o funcionário"}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  </button>

                                  {certificateEmployeeDropdownOpen && (
                                    <div className="absolute z-[10000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                                      <div className="p-2 border-b">
                                        <Input
                                          type="text"
                                          placeholder="Buscar funcionário..."
                                          value={certificateEmployeeSearch}
                                          onChange={(e) => setCertificateEmployeeSearch(e.target.value)}
                                          className="h-8"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="max-h-48 overflow-y-auto">
                                        {filteredCertificateEmployees.length === 0 ? (
                                          <div className="px-3 py-2 text-sm text-gray-500">
                                            Nenhum funcionário encontrado
                                          </div>
                                        ) : (
                                          filteredCertificateEmployees.map((employee) => (
                                            <button
                                              key={employee.id}
                                              type="button"
                                              onClick={() => {
                                                setCertificateEmployeeName(employee.nome)
                                                setCertificateEmployeeDropdownOpen(false)
                                                setCertificateEmployeeSearch("")
                                              }}
                                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                            >
                                              {employee.nome}
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="certificateDate">Data do atestado</Label>
                              <Input
                                type="date"
                                value={certificateDate}
                                onChange={(e) => setCertificateDate(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Inserir a data de atestado igual a data de serviço extra, caso necessite faça outro
                                registro
                              </p>
                            </div>
                          </div>
                        )}

                        {serviceReason === "limpeza_extra" && (
                          <div>
                            <Label htmlFor="extraCleaningClient">Cliente</Label>
                            {loadingClients ? (
                              <div className="text-sm text-muted-foreground p-2 border rounded">
                                Carregando clientes...
                              </div>
                            ) : filteredClients.length === 0 && !clientSearch ? (
                              <div className="text-sm text-muted-foreground p-2 border rounded">
                                Nenhum cliente cadastrado. Por favor, cadastre clientes primeiro.
                              </div>
                            ) : (
                              <div className="relative" ref={clientDropdownRef}>
                                <button
                                  type="button"
                                  onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                  <span className={extraCleaningClient ? "text-black" : "text-gray-500"}>
                                    {extraCleaningClient || "Selecione um cliente"}
                                  </span>
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>

                                {clientDropdownOpen && (
                                  <div className="absolute z-[10000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                                    <div className="p-2 border-b">
                                      <Input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="h-8"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {filteredClients.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">Nenhum cliente encontrado</div>
                                      ) : (
                                        filteredClients.map((client: any) => (
                                          <button
                                            key={client.id}
                                            type="button"
                                            onClick={() => {
                                              setExtraCleaningClient(client.name)
                                              setClientDropdownOpen(false)
                                              setClientSearch("")
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                          >
                                            {client.name}
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {(serviceReason === "evento" || serviceReason === "outro") && (
                          <div>
                            <Label htmlFor="otherReasonText">
                              {serviceReason === "evento" ? "Descreva o evento" : "Descreva o motivo"}
                            </Label>
                            <Textarea
                              value={otherReasonText}
                              onChange={(e) => setOtherReasonText(e.target.value)}
                              placeholder="Digite a descrição"
                              rows={2}
                            />
                          </div>
                        )}

                        <div>
                          <Label htmlFor="service">Qual foi o serviço extra?</Label>
                          <Textarea
                            value={service}
                            onChange={(e) => setService(e.target.value)}
                            placeholder="Descreva o serviço realizado"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location">Onde foi realizado?</Label>
                            <Input
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Local onde o serviço foi executado"
                            />
                          </div>

                          <div>
                            <Label htmlFor="supervisor">Supervisor responsável</Label>
                            <Input
                              value={supervisor}
                              onChange={(e) => setSupervisor(e.target.value)}
                              placeholder="Nome do supervisor responsável"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="date">Data</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                          </div>

                          <div>
                            <Label htmlFor="hours">Horas de atividade</Label>
                            <Select value={hours} onValueChange={(value: "4" | "6" | "8" | "12") => setHours(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                sideOffset={5}
                                className="z-[9999]"
                                style={{ zIndex: 9999 }}
                              >
                                <SelectItem value="4">4 horas</SelectItem>
                                <SelectItem value="6">6 horas</SelectItem>
                                <SelectItem value="8">8 horas</SelectItem>
                                <SelectItem value="12">12 horas</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="function">Função executada</Label>
                            <Select
                              value={serviceFunction}
                              onValueChange={(value: "Guarda" | "Limpeza") => setServiceFunction(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                sideOffset={5}
                                className="z-[9999]"
                                style={{ zIndex: 9999 }}
                              >
                                <SelectItem value="Guarda">Guarda</SelectItem>
                                <SelectItem value="Limpeza">Limpeza</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="pixKey">Chave PIX</Label>
                          <Input
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            placeholder="Chave PIX para pagamento"
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSubmit} disabled={!executorName.trim() || !serviceReason}>
                            Registrar Serviço
                          </Button>
                          <Button variant="outline" onClick={() => setCurrentStep("type")}>
                            Voltar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {filtersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <div className="flex items-center gap-2">
              {filteredServices.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePDFReport}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Download className="w-4 h-4" />
                  Relatório PDF
                </Button>
              )}
            </div>
          </div>
          {filtersExpanded && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Filtrar por Data</Label>
                  <Select
                    value={dateFilterType}
                    onValueChange={(value: "specific" | "week" | "month") => setDateFilterType(value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="specific">Data Específica</SelectItem>
                      <SelectItem value="week">Por Semana</SelectItem>
                      <SelectItem value="month">Por Mês</SelectItem>
                    </SelectContent>
                  </Select>
                  {dateFilterType === "specific" && (
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="h-8"
                    />
                  )}
                  {dateFilterType === "week" && (
                    <Input
                      type="week"
                      value={filterWeek}
                      onChange={(e) => setFilterWeek(e.target.value)}
                      className="h-8"
                    />
                  )}
                  {dateFilterType === "month" && (
                    <Input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="h-8"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="filterLocation" className="text-xs font-medium">
                    Localidade
                  </Label>
                  <Input
                    id="filterLocation"
                    placeholder="Filtrar por local"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="filterSupervisor" className="text-xs font-medium">
                    Supervisor
                  </Label>
                  <Input
                    id="filterSupervisor"
                    placeholder="Filtrar por supervisor"
                    value={filterSupervisor}
                    onChange={(e) => setFilterSupervisor(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 bg-transparent">
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredServices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>
                  {services.length === 0
                    ? "Nenhum serviço extra registrado ainda"
                    : "Nenhum serviço encontrado com os filtros aplicados"}
                </p>
                <p className="text-sm mt-1">
                  {services.length === 0
                    ? 'Use o botão "Novo Serviço Extra" para começar'
                    : "Tente ajustar os filtros ou limpar para ver todos os registros"}
                </p>
              </div>
            ) : (
              filteredServices
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => visualizarDetalhes(service)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{service.executorName}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded-none">
                          {service.function}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(service.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          visualizarDetalhes(service)
                        }}
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteService(service.id)
                        }}
                        className="text-red-600 hover:text-red-700"
                        title="Excluir serviço"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetalhesModal} onOpenChange={setShowDetalhesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Serviço Extra</DialogTitle>
          </DialogHeader>
          {servicoSelecionado && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{servicoSelecionado.executorName}</h3>
                <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded-none">
                  {servicoSelecionado.function}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-none">
                  {servicoSelecionado.hours} horas
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-none ${
                    servicoSelecionado.executorType === "funcionario"
                      ? "bg-green-600 text-white"
                      : "bg-orange-600 text-white"
                  }`}
                >
                  {servicoSelecionado.executorType === "funcionario" ? "Funcionário" : "Externo"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Serviço Realizado:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{servicoSelecionado.service}</p>
                </div>

                {servicoSelecionado.reason && (
                  <div className="space-y-2">
                    <Label className="font-medium">Motivo do Serviço:</Label>
                    <p className="text-sm text-muted-foreground">
                      {servicoSelecionado.reason === "falta" &&
                        `Falta de colaborador (${servicoSelecionado.absentEmployeeName})`}
                      {servicoSelecionado.reason === "atestado" &&
                        `Atestado de colaborador (${servicoSelecionado.certificateEmployeeName} - ${formatDate(
                          servicoSelecionado.certificateDate!,
                        )})`}
                      {servicoSelecionado.reason === "evento" && `Evento: ${servicoSelecionado.otherReasonText}`}
                      {servicoSelecionado.reason === "limpeza_extra" &&
                        `Limpeza extra para o cliente: ${servicoSelecionado.extraCleaningClient}`}
                      {servicoSelecionado.reason === "outro" && `Outro: ${servicoSelecionado.otherReasonText}`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Local:</Label>
                    <p className="text-sm text-muted-foreground">{servicoSelecionado.location}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Supervisor:</Label>
                    <p className="text-sm text-muted-foreground">{servicoSelecionado.supervisor}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="font-medium">Data:</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(servicoSelecionado.date)}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Horas:</Label>
                    <p className="text-sm text-muted-foreground">{servicoSelecionado.hours} horas</p>
                  </div>
                  <div>
                    <Label className="font-medium">Função:</Label>
                    <p className="text-sm text-muted-foreground">{servicoSelecionado.function}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Chave PIX:</Label>
                  <p className="text-sm text-muted-foreground font-mono bg-gray-100 p-2 rounded">
                    {servicoSelecionado.pixKey}
                  </p>
                </div>

                <div>
                  <Label className="font-medium">Registrado em:</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(servicoSelecionado.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetalhesModal(false)
                    setShowRegistrosModal(true)
                  }}
                >
                  Voltar aos Registros
                </Button>
                <Button variant="outline" onClick={() => setShowDetalhesModal(false)}>
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
