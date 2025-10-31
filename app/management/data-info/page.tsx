"use client"

import { DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Calendar,
  DollarSign,
  Package,
  UserX,
  ShoppingCart,
  Shirt,
  Trash2,
  Edit,
  Filter,
  ChevronDown,
  ChevronUp,
  Scale,
} from "lucide-react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { dataEntryOperations } from "@/lib/database/operations"
import { useDataEntries, useClientsSuppliers } from "@/hooks/use-realtime"
import { useEmployees } from "@/hooks/use-employees"

interface DataEntry {
  id: string
  type: "rescisao" | "gasto-extra" | "compras-extras" | "servicos-extras" | "uniforme-epi" | "processos-juridicos"
  date: string
  value: number
  description?: string
  uniform_item?: string
  client_id?: string
  employee_id?: string
  created_at: string
  quantity?: number
}

interface ClientSupplier {
  id: string
  name: string
  type: "cliente" | "fornecedor"
}

export default function DataInfoPage() {
  const { data: dataEntries, loading } = useDataEntries()
  const { data: clientsSuppliers } = useClientsSuppliers()
  const { data: funcionarios } = useEmployees()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DataEntry | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<DataEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<DataEntry | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [isEditPasswordDialogOpen, setIsEditPasswordDialogOpen] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<DataEntry | null>(null)
  const [editPassword, setEditPassword] = useState("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedUniformItem, setSelectedUniformItem] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [date, setDate] = useState("")
  const [value, setValue] = useState("")
  const [description, setDescription] = useState("")
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [filtros, setFiltros] = useState({
    tipo: "all",
    cliente: "all",
    dataInicio: "",
    dataFim: "",
  })
  const { toast } = useToast()

  const clients = clientsSuppliers.filter((item: ClientSupplier) => item.type === "cliente")

  const limparFiltros = () => {
    setFiltros({
      tipo: "all",
      cliente: "all",
      dataInicio: "",
      dataFim: "",
    })
  }

  const dadosFiltrados = useMemo(() => {
    return dataEntries.filter((entry) => {
      if (filtros.tipo !== "all" && entry.type !== filtros.tipo) {
        return false
      }

      if (filtros.cliente !== "all" && entry.client_id !== filtros.cliente) {
        return false
      }

      if (filtros.dataInicio && entry.date < filtros.dataInicio) {
        return false
      }

      if (filtros.dataFim && entry.date > filtros.dataFim) {
        return false
      }

      return true
    })
  }, [dataEntries, filtros])

  const requestEditPassword = (entry: DataEntry) => {
    setEntryToEdit(entry)
    setIsEditPasswordDialogOpen(true)
  }

  const handleEditPasswordConfirm = () => {
    if (editPassword !== "123456789") {
      toast({
        title: "Erro",
        description: "Senha incorreta. Acesso negado.",
        variant: "destructive",
      })
      return
    }

    if (!entryToEdit) return

    setIsEditMode(true)
    setEditingEntry(entryToEdit)
    setSelectedType(entryToEdit.type)
    setSelectedUniformItem(entryToEdit.uniform_item || "")
    setQuantity(entryToEdit.quantity?.toString() || "1")
    setSelectedClientId(entryToEdit.client_id || "")
    setSelectedEmployeeId(entryToEdit.employee_id || "")
    setDate(entryToEdit.date)
    setValue(entryToEdit.value.toString())
    setDescription(entryToEdit.description || "")
    setIsDialogOpen(true)

    setIsEditPasswordDialogOpen(false)
    setEntryToEdit(null)
    setEditPassword("")
  }

  const resetForm = () => {
    setSelectedType("")
    setSelectedUniformItem("")
    setQuantity("1")
    setSelectedClientId("")
    setSelectedEmployeeId("")
    setDate("")
    setValue("")
    setDescription("")
    setIsEditMode(false)
    setEditingEntry(null)
    setIsDialogOpen(false)
  }

  const handleSubmit = async () => {
    if (!selectedType || !date || !value) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Validação específica para processos jurídicos
    if (selectedType === "processos-juridicos" && !selectedEmployeeId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o nome do reclamante.",
        variant: "destructive",
      })
      return
    }

    // Validação para outros tipos que precisam de cliente
    if (selectedType !== "processos-juridicos" && !selectedClientId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o cliente.",
        variant: "destructive",
      })
      return
    }

    if (selectedType === "uniforme-epi" && !selectedUniformItem) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o item de uniforme/EPI.",
        variant: "destructive",
      })
      return
    }

    if (selectedType === "uniforme-epi" && (!quantity || Number.parseInt(quantity) < 1)) {
      toast({
        title: "Erro",
        description: "Por favor, informe a quantidade de peças (mínimo 1).",
        variant: "destructive",
      })
      return
    }

    try {
      const dataToSave: any = {
        type: selectedType as DataEntry["type"],
        date,
        value: Number.parseFloat(value),
        description: description || undefined,
      }

      if (selectedType === "processos-juridicos") {
        dataToSave.employee_id = selectedEmployeeId
      } else {
        dataToSave.client_id = selectedClientId
      }

      // Only add uniform-specific fields if type is uniforme-epi
      if (selectedType === "uniforme-epi") {
        dataToSave.uniform_item = selectedUniformItem
        dataToSave.quantity = Number.parseInt(quantity)
      }

      if (isEditMode && editingEntry) {
        console.log("[v0] Atualizando entrada de dados no Supabase...")
        console.log("[v0] Dados a serem atualizados:", dataToSave)

        try {
          await dataEntryOperations.update(editingEntry.id, dataToSave)

          toast({
            title: "Sucesso",
            description: "Dado atualizado com sucesso!",
          })
          console.log("[v0] Entrada de dados atualizada com sucesso")
        } catch (updateError: any) {
          if (updateError?.message?.includes("quantity") || updateError?.message?.includes("quantidade")) {
            console.log("[v0] Coluna quantity não existe, tentando sem ela...")
            const dataWithoutQuantity = { ...dataToSave }
            delete dataWithoutQuantity.quantity

            await dataEntryOperations.update(editingEntry.id, dataWithoutQuantity)

            toast({
              title: "Aviso",
              description:
                "Dado atualizado, mas o campo de quantidade não foi salvo. Execute o script SQL 'add-quantity-to-data-entries.sql' para habilitar este recurso.",
              variant: "default",
            })
            console.log("[v0] Entrada de dados atualizada sem o campo quantity")
          } else {
            throw updateError
          }
        }
      } else {
        console.log("[v0] Salvando entrada de dados no Supabase...")
        console.log("[v0] Dados a serem salvos:", dataToSave)

        try {
          await dataEntryOperations.create(dataToSave)

          toast({
            title: "Sucesso",
            description: "Dado incluído com sucesso!",
          })
          console.log("[v0] Entrada de dados salva com sucesso")
        } catch (createError: any) {
          if (createError?.message?.includes("quantity") || createError?.message?.includes("quantidade")) {
            console.log("[v0] Coluna quantity não existe, tentando sem ela...")
            const dataWithoutQuantity = { ...dataToSave }
            delete dataWithoutQuantity.quantity

            await dataEntryOperations.create(dataWithoutQuantity)

            toast({
              title: "Aviso",
              description:
                "Dado incluído, mas o campo de quantidade não foi salvo. Execute o script SQL 'add-quantity-to-data-entries.sql' para habilitar este recurso.",
              variant: "default",
            })
            console.log("[v0] Entrada de dados salva sem o campo quantity")
          } else {
            throw createError
          }
        }
      }

      resetForm()
    } catch (error) {
      console.error("[v0] Erro ao salvar entrada de dados:", error)
      toast({
        title: "Erro",
        description: `Erro ao ${isEditMode ? "atualizar" : "salvar"} dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (deletePassword !== "987654321") {
      toast({
        title: "Erro",
        description: "Senha incorreta. Acesso negado.",
        variant: "destructive",
      })
      return
    }

    if (!entryToDelete) return

    try {
      console.log("[v0] Excluindo entrada de dados do Supabase...")
      await dataEntryOperations.delete(entryToDelete.id)

      setIsDeleteDialogOpen(false)
      setEntryToDelete(null)
      setDeletePassword("")

      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso!",
      })
      console.log("[v0] Entrada de dados excluída com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao excluir entrada de dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir registro. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (entry: DataEntry) => {
    setEntryToDelete(entry)
    setIsDeleteDialogOpen(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rescisao":
        return <UserX className="h-4 w-4 text-red-500" />
      case "gasto-extra":
        return <DollarSign className="h-4 w-4 text-yellow-500" />
      case "compras-extras":
        return <ShoppingCart className="h-4 w-4 text-blue-500" />
      case "servicos-extras":
        return <Package className="h-4 w-4 text-purple-500" />
      case "uniforme-epi":
        return <Shirt className="h-4 w-4 text-green-500" />
      case "processos-juridicos":
        return <Scale className="h-4 w-4 text-pink-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case "rescisao":
        return "Rescisão"
      case "gasto-extra":
        return "Gasto Extra"
      case "compras-extras":
        return "Compras Extras"
      case "servicos-extras":
        return "Serviços Extras"
      case "uniforme-epi":
        return "Uniforme e EPI"
      case "processos-juridicos":
        return "Processos Jurídicos"
      default:
        return type
    }
  }

  const getClientName = (clientId: string) => {
    const client = clients.find((c: ClientSupplier) => c.id === clientId)
    return client ? client.name : "Cliente não encontrado"
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = funcionarios?.find((f: any) => f.id === employeeId)
    return employee ? employee.nome : "Funcionário não encontrado"
  }

  const getUniformItemName = (item: string) => {
    const uniformItems: { [key: string]: string } = {
      camiseta: "Camiseta",
      camisa: "Camisa",
      jaqueta: "Jaqueta",
      calca: "Calça",
      sapato: "Sapato",
      luvas: "Luvas",
      "capas-chuva": "Capas de Chuva",
      "botas-borracha": "Botas de Borracha",
      bone: "Boné",
      "chapeu-jardineiro": "Chapéu Jardineiro",
    }
    return uniformItems[item] || item
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const openDetails = (entry: DataEntry) => {
    setSelectedEntry(entry)
    setIsDetailsOpen(true)
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Carregando dados...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">Dados e Informações</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Registros de gastos e informações importantes da empresa
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (!open) resetForm()
              setIsDialogOpen(open)
            }}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Incluir Dado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Editar Dado" : "Incluir Novo Dado"}</DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Atualize as informações do dado."
                    : "Selecione o tipo de dado e preencha as informações necessárias."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Dado</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de dado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rescisao">
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4 text-red-500" />
                          Rescisão
                        </div>
                      </SelectItem>
                      <SelectItem value="gasto-extra">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-yellow-500" />
                          Gasto Extra
                        </div>
                      </SelectItem>
                      <SelectItem value="compras-extras">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-blue-500" />
                          Compras Extras
                        </div>
                      </SelectItem>
                      <SelectItem value="servicos-extras">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-500" />
                          Serviços Extras
                        </div>
                      </SelectItem>
                      <SelectItem value="uniforme-epi">
                        <div className="flex items-center gap-2">
                          <Shirt className="h-4 w-4 text-green-500" />
                          Uniforme e EPI
                        </div>
                      </SelectItem>
                      <SelectItem value="processos-juridicos">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-pink-500" />
                          Processos Jurídicos
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedType === "uniforme-epi" && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="uniform-item">Item de Uniforme/EPI</Label>
                      <Select value={selectedUniformItem} onValueChange={setSelectedUniformItem}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o item" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="camiseta">Camiseta</SelectItem>
                          <SelectItem value="camisa">Camisa</SelectItem>
                          <SelectItem value="jaqueta">Jaqueta</SelectItem>
                          <SelectItem value="calca">Calça</SelectItem>
                          <SelectItem value="sapato">Sapato</SelectItem>
                          <SelectItem value="luvas">Luvas</SelectItem>
                          <SelectItem value="capas-chuva">Capas de Chuva</SelectItem>
                          <SelectItem value="botas-borracha">Botas de Borracha</SelectItem>
                          <SelectItem value="bone">Boné</SelectItem>
                          <SelectItem value="chapeu-jardineiro">Chapéu Jardineiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Quantidade de Peças</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Informe quantas peças deste item foram compradas</p>
                    </div>
                  </>
                )}

                {selectedType === "processos-juridicos" && (
                  <div className="grid gap-2">
                    <Label htmlFor="employee">Nome do Reclamante</Label>
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o reclamante" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios?.map((func: any) => (
                          <SelectItem key={func.id} value={func.id}>
                            {func.nome} - {func.status || "ATIVO"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedType && selectedType !== "processos-juridicos" && (
                  <div className="grid gap-2">
                    <Label htmlFor="client">Cliente</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client: ClientSupplier) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="value">Valor Gasto (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Adicione detalhes sobre este dado..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>{isEditMode ? "Atualizar Dado" : "Incluir Dado"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dados Registrados</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltrosAbertos(!filtrosAbertos)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {filtrosAbertos ? "Ocultar Filtros" : "Mostrar Filtros"}
              {filtrosAbertos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
            <CollapsibleContent>
              <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filtro-tipo">Tipo de Dado</Label>
                    <Select value={filtros.tipo} onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}>
                      <SelectTrigger id="filtro-tipo">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="rescisao">Rescisão</SelectItem>
                        <SelectItem value="gasto-extra">Gasto Extra</SelectItem>
                        <SelectItem value="compras-extras">Compras Extras</SelectItem>
                        <SelectItem value="servicos-extras">Serviços Extras</SelectItem>
                        <SelectItem value="uniforme-epi">Uniforme e EPI</SelectItem>
                        <SelectItem value="processos-juridicos">Processos Jurídicos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filtro-cliente">Cliente</Label>
                    <Select
                      value={filtros.cliente}
                      onValueChange={(value) => setFiltros({ ...filtros, cliente: value })}
                    >
                      <SelectTrigger id="filtro-cliente">
                        <SelectValue placeholder="Todos os clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os clientes</SelectItem>
                        {clients.map((client: ClientSupplier) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filtro-data-inicio">Data Início</Label>
                    <Input
                      id="filtro-data-inicio"
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filtro-data-fim">Data Fim</Label>
                    <Input
                      id="filtro-data-fim"
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={limparFiltros}>
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
        <CardContent>
          {dadosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {dataEntries.length === 0
                  ? "Nenhum dado registrado ainda."
                  : "Nenhum dado encontrado com os filtros aplicados."}
                <br />
                {dataEntries.length === 0 && 'Clique em "Incluir Dado" para começar.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {dadosFiltrados.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div onClick={() => openDetails(entry)} className="flex items-center gap-6 cursor-pointer flex-1">
                    <div className="flex flex-col gap-1">
                      <div className="text-base font-bold text-green-600">{formatCurrency(entry.value)}</div>
                      <div className="bg-black text-white px-2 py-0.5 text-xs font-medium w-fit">
                        {getTypeName(entry.type).toUpperCase()}
                      </div>
                      {entry.type === "processos-juridicos" && entry.employee_id && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Reclamante: {getEmployeeName(entry.employee_id)}
                        </div>
                      )}
                      {entry.type !== "processos-juridicos" && entry.client_id && (
                        <div className="text-xs text-muted-foreground mt-0.5">{getClientName(entry.client_id)}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">{formatDate(entry.date)}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        requestEditPassword(entry)
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteDialog(entry)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditPasswordDialogOpen} onOpenChange={setIsEditPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 text-base">
              <Edit className="h-4 w-4" />
              Confirmar Edição
            </DialogTitle>
            <DialogDescription className="text-xs">
              Para editar este registro, digite a senha de segurança.
            </DialogDescription>
          </DialogHeader>
          {entryToEdit && (
            <div className="py-3">
              <div className="mb-3 p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  {getTypeIcon(entryToEdit.type)}
                  <span className="font-medium text-sm">{getTypeName(entryToEdit.type)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Valor: {formatCurrency(entryToEdit.value)} | Data: {formatDate(entryToEdit.date)}
                </div>
                {entryToEdit.client_id && (
                  <div className="text-xs text-muted-foreground">Cliente: {getClientName(entryToEdit.client_id)}</div>
                )}
                {entryToEdit.type === "processos-juridicos" && entryToEdit.employee_id && (
                  <div className="text-xs text-muted-foreground">
                    Reclamante: {getEmployeeName(entryToEdit.employee_id)}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password" className="text-xs">
                  Senha de Segurança
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Digite a senha"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editPassword) {
                      handleEditPasswordConfirm()
                    }
                  }}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditPasswordDialogOpen(false)
                setEntryToEdit(null)
                setEditPassword("")
              }}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleEditPasswordConfirm} disabled={!editPassword}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-base">
              <Trash2 className="h-4 w-4" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-xs">
              Para excluir este registro, digite a senha de segurança.
            </DialogDescription>
          </DialogHeader>
          {entryToDelete && (
            <div className="py-3">
              <div className="mb-3 p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  {getTypeIcon(entryToDelete.type)}
                  <span className="font-medium text-sm">{getTypeName(entryToDelete.type)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Valor: {formatCurrency(entryToDelete.value)} | Data: {formatDate(entryToDelete.date)}
                </div>
                {entryToDelete.client_id && (
                  <div className="text-xs text-muted-foreground">Cliente: {getClientName(entryToDelete.client_id)}</div>
                )}
                {entryToDelete.type === "processos-juridicos" && entryToDelete.employee_id && (
                  <div className="text-xs text-muted-foreground">
                    Reclamante: {getEmployeeName(entryToDelete.employee_id)}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="delete-password" className="text-xs">
                  Senha de Segurança
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Digite a senha"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setEntryToDelete(null)
                setDeletePassword("")
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm} disabled={!deletePassword}>
              Excluir Registro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {selectedEntry && getTypeIcon(selectedEntry.type)}
              Detalhes do Registro
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="grid gap-3 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
                  <div className="bg-black text-white px-2 py-0.5 text-xs font-medium w-fit mt-1">
                    {getTypeName(selectedEntry.type).toUpperCase()}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Valor</Label>
                  <div className="text-xl font-bold text-green-600 mt-1">{formatCurrency(selectedEntry.value)}</div>
                </div>
              </div>

              {selectedEntry.uniform_item && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Item de Uniforme/EPI</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">
                    {getUniformItemName(selectedEntry.uniform_item)}
                  </div>
                </div>
              )}

              {selectedEntry.type === "uniforme-epi" && selectedEntry.quantity && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Quantidade de Peças</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md font-semibold text-sm">
                    {selectedEntry.quantity} peças
                  </div>
                </div>
              )}

              {selectedEntry.client_id && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Cliente</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">{getClientName(selectedEntry.client_id)}</div>
                </div>
              )}

              {selectedEntry.type === "processos-juridicos" && selectedEntry.employee_id && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Reclamante</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">
                    {getEmployeeName(selectedEntry.employee_id)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Data do Evento</Label>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedEntry.date)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Data de Registro</Label>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedEntry.created_at)}
                  </div>
                </div>
              </div>

              {selectedEntry.description && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Descrição</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">{selectedEntry.description}</div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
