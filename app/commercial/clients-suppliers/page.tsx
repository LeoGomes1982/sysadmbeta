"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Eye, FileText, History, Upload, Download, Trash2 } from "lucide-react"
import { useClientsSuppliers } from "@/hooks/use-realtime"
import { clientSupplierOperations } from "@/lib/database/operations"
import {
  clientDocumentOperations,
  clientHistoryOperations,
  type ClientDocument,
  type ClientHistory,
} from "@/lib/database/client-operations"

interface ClientSupplier {
  id: string
  name: string
  fantasy_name: string
  legal_representative: string
  legal_representative_cpf: string
  type: "cliente" | "fornecedor"
  document: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  notes: string
  created_at: string
}

export default function ClientsSuppliersPage() {
  const { data: clientsSuppliers, loading } = useClientsSuppliers()

  const [isSaving, setIsSaving] = useState(false)

  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [historyRecords, setHistoryRecords] = useState<ClientHistory[]>([])
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false)
  const [isAddHistoryModalOpen, setIsAddHistoryModalOpen] = useState(false)
  const [documentForm, setDocumentForm] = useState({ name: "", type: "", file: null as File | null })
  const [historyForm, setHistoryForm] = useState({
    type: "neutro" as "positivo" | "negativo" | "neutro",
    description: "",
  })

  const [isDeletePasswordModalOpen, setIsDeletePasswordModalOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "document" | "history" } | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"todos" | "cliente" | "fornecedor">("todos")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClientSupplier | null>(null)
  const [selectedItem, setSelectedItem] = useState<ClientSupplier | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    fantasy_name: "",
    legal_representative: "",
    legal_representative_cpf: "",
    type: "cliente" as "cliente" | "fornecedor",
    document: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
  })

  const filteredItems = clientsSuppliers.filter((item) => {
    const matchesSearch =
      (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.document || "").includes(searchTerm) ||
      (item.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    const matchesType = filterType === "todos" || item.type === filterType
    return matchesSearch && matchesType
  })

  const loadClientData = async (clientId: string) => {
    try {
      console.log("[v0] Carregando dados do cliente:", clientId)
      const [documentsData, historyData] = await Promise.all([
        clientDocumentOperations.getByClientId(clientId),
        clientHistoryOperations.getByClientId(clientId),
      ])

      setDocuments(documentsData)
      setHistoryRecords(historyData)
      console.log("[v0] Dados do cliente carregados com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao carregar dados do cliente:", error)
      alert("Erro ao carregar dados do cliente")
    }
  }

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItem && documentForm.file) {
      try {
        console.log("[v0] Salvando documento no banco de dados")

        const newDocument = await clientDocumentOperations.create(
          {
            client_supplier_id: selectedItem.id,
            name: documentForm.name,
            type: documentForm.type,
            file_name: documentForm.file.name,
            file_size: (documentForm.file.size / 1024).toFixed(2) + " KB",
          },
          documentForm.file,
        )

        setDocuments((prev) => [newDocument, ...prev])
        setDocumentForm({ name: "", type: "", file: null })
        setIsAddDocumentModalOpen(false)

        console.log("[v0] Documento salvo com sucesso")
      } catch (error) {
        console.error("[v0] Erro ao salvar documento:", error)
        alert("Erro ao salvar documento. Tente novamente.")
      }
    }
  }

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItem) {
      try {
        console.log("[v0] Salvando histórico no banco de dados")

        const newHistory = await clientHistoryOperations.create({
          client_supplier_id: selectedItem.id,
          type: historyForm.type,
          description: historyForm.description,
          date: new Date().toISOString().split("T")[0], // Formato YYYY-MM-DD
        })

        setHistoryRecords((prev) => [newHistory, ...prev])
        setHistoryForm({ type: "neutro", description: "" })
        setIsAddHistoryModalOpen(false)

        console.log("[v0] Histórico salvo com sucesso")
      } catch (error) {
        console.error("[v0] Erro ao salvar histórico:", error)
        alert("Erro ao salvar histórico. Tente novamente.")
      }
    }
  }

  const getHistoryTypeColor = (type: "positivo" | "negativo" | "neutro") => {
    switch (type) {
      case "positivo":
        return "bg-green-100 text-green-800"
      case "negativo":
        return "bg-red-100 text-red-800"
      case "neutro":
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    console.log("[v0] Salvando cliente/fornecedor:", formData)

    // Validar campos obrigatórios
    if (!formData.name.trim()) {
      alert("Nome/Razão Social é obrigatório")
      setIsSaving(false)
      return
    }

    if (!formData.document.trim()) {
      alert("CNPJ/CPF é obrigatório")
      setIsSaving(false)
      return
    }

    if (!formData.email.trim()) {
      alert("E-mail é obrigatório")
      setIsSaving(false)
      return
    }

    if (!formData.phone.trim()) {
      alert("Telefone é obrigatório")
      setIsSaving(false)
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert("Por favor, insira um e-mail válido")
      setIsSaving(false)
      return
    }

    // Verificar se o documento já existe (apenas para novos registros)
    if (!editingItem) {
      const existingClient = clientsSuppliers.find(
        (client) => client.document === formData.document && client.id !== editingItem?.id,
      )
      if (existingClient) {
        alert("Já existe um cliente/fornecedor cadastrado com este CNPJ/CPF")
        setIsSaving(false)
        return
      }
    }

    try {
      if (editingItem) {
        console.log("[v0] Atualizando cliente/fornecedor existente:", editingItem.id)
        await clientSupplierOperations.update(editingItem.id, formData)
        console.log("[v0] Cliente/fornecedor atualizado com sucesso")
      } else {
        console.log("[v0] Criando novo cliente/fornecedor")
        await clientSupplierOperations.create(formData)
        console.log("[v0] Cliente/fornecedor criado com sucesso")
      }

      resetForm()
    } catch (error) {
      console.error("[v0] Erro ao salvar cliente/fornecedor:", error)

      if (error instanceof Error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          alert("Este CNPJ/CPF já está cadastrado no sistema")
        } else if (error.message.includes("violates check constraint")) {
          alert("Dados inválidos. Verifique se todos os campos estão preenchidos corretamente")
        } else if (error.message.includes("violates not-null constraint")) {
          alert("Todos os campos obrigatórios devem ser preenchidos")
        } else {
          alert(`Erro ao salvar: ${error.message}`)
        }
      } else {
        alert("Erro ao salvar. Tente novamente.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      fantasy_name: "",
      legal_representative: "",
      legal_representative_cpf: "",
      type: "cliente",
      document: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      notes: "",
    })
    setEditingItem(null)
    setIsModalOpen(false)
  }

  const handleEdit = (item: ClientSupplier) => {
    setFormData({
      name: item.name,
      fantasy_name: item.fantasy_name,
      legal_representative: item.legal_representative,
      legal_representative_cpf: item.legal_representative_cpf,
      type: item.type,
      document: item.document,
      email: item.email,
      phone: item.phone,
      address: item.address,
      city: item.city,
      state: item.state,
      zip_code: item.zip_code,
      notes: item.notes,
    })
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        console.log("[v0] Deletando cliente/fornecedor:", id)
        await clientSupplierOperations.delete(id)
        console.log("[v0] Cliente/fornecedor deletado com sucesso")
      } catch (error) {
        console.error("[v0] Erro ao deletar cliente/fornecedor:", error)
        alert("Erro ao deletar. Tente novamente.")
      }
    }
  }

  const handleView = (item: ClientSupplier) => {
    setSelectedItem(item)
    setIsViewModalOpen(true)
    // Carregar documentos e histórico do banco de dados
    loadClientData(item.id)
  }

  const handleOpenDocuments = () => {
    setIsDocumentsModalOpen(true)
  }

  const handleOpenHistory = () => {
    setIsHistoryModalOpen(true)
  }

  const handleStartDelete = (id: string, type: "document" | "history") => {
    setItemToDelete({ id, type })
    setDeletePassword("")
    setIsDeletePasswordModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deletePassword !== "123456789") {
      alert("Senha incorreta!")
      return
    }

    if (!itemToDelete) return

    try {
      if (itemToDelete.type === "document") {
        console.log("[v0] Deletando documento:", itemToDelete.id)
        await clientDocumentOperations.delete(itemToDelete.id)
        setDocuments((prev) => prev.filter((doc) => doc.id !== itemToDelete.id))
        console.log("[v0] Documento deletado com sucesso")
      } else {
        console.log("[v0] Deletando histórico:", itemToDelete.id)
        await clientHistoryOperations.delete(itemToDelete.id)
        setHistoryRecords((prev) => prev.filter((record) => record.id !== itemToDelete.id))
        console.log("[v0] Histórico deletado com sucesso")
      }

      setIsDeletePasswordModalOpen(false)
      setItemToDelete(null)
      setDeletePassword("")
    } catch (error) {
      console.error("[v0] Erro ao deletar:", error)
      alert("Erro ao deletar. Tente novamente.")
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Carregando clientes e fornecedores...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes e Fornecedores</h1>
            <p className="text-gray-600 mt-1">Gerencie seus clientes e fornecedores</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cadastro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Editar" : "Novo"} {formData.type === "cliente" ? "Cliente" : "Fornecedor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome/Razão Social *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fantasy_name">Nome Fantasia</Label>
                    <Input
                      id="fantasy_name"
                      value={formData.fantasy_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fantasy_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="legal_representative">Representante Legal</Label>
                    <Input
                      id="legal_representative"
                      value={formData.legal_representative}
                      onChange={(e) => setFormData((prev) => ({ ...prev, legal_representative: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="legal_representative_cpf">CPF do Representante</Label>
                    <Input
                      id="legal_representative_cpf"
                      value={formData.legal_representative_cpf}
                      onChange={(e) => setFormData((prev) => ({ ...prev, legal_representative_cpf: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "cliente" | "fornecedor") =>
                        setFormData((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="document">CNPJ/CPF *</Label>
                    <Input
                      id="document"
                      value={formData.document}
                      onChange={(e) => setFormData((prev) => ({ ...prev, document: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip_code">CEP</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, zip_code: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-black hover:bg-gray-800" disabled={isSaving}>
                    {isSaving ? "Salvando..." : editingItem ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Filters dentro do container */}
        <div className="p-4 border-b">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, documento ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filterType}
              onValueChange={(value: "todos" | "cliente" | "fornecedor") => setFilterType(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="cliente">Clientes</SelectItem>
                <SelectItem value="fornecedor">Fornecedores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista */}
        <div className="p-4 space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="mt-1">
                      <span className="bg-black text-white px-3 py-1 rounded-sm text-xs font-medium">
                        {item.type === "cliente" ? "Cliente" : "Fornecedor"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(item)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {clientsSuppliers.length === 0 ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum cliente ou fornecedor cadastrado</h3>
                  <p className="text-gray-500">Clique em "Novo Cadastro" para adicionar o primeiro registro.</p>
                </div>
              ) : (
                "Nenhum registro encontrado"
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl border-2 border-gray-300">
          <DialogHeader>
            <DialogTitle>Detalhes do {selectedItem?.type === "cliente" ? "Cliente" : "Fornecedor"}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome/Razão Social</Label>
                  <p className="text-sm">{selectedItem.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome Fantasia</Label>
                  <p className="text-sm">{selectedItem.fantasy_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Representante Legal</Label>
                  <p className="text-sm">{selectedItem.legal_representative}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CPF do Representante</Label>
                  <p className="text-sm">{selectedItem.legal_representative_cpf}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <span className="bg-black text-white px-2 py-1 text-xs font-medium rounded-sm">
                    {selectedItem.type === "cliente" ? "Cliente" : "Fornecedor"}
                  </span>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CNPJ/CPF</Label>
                  <p className="text-sm">{selectedItem.document}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-sm">{selectedItem.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">E-mail</Label>
                  <p className="text-sm">{selectedItem.email}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                <p className="text-sm">{selectedItem.address}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cidade</Label>
                  <p className="text-sm">{selectedItem.city}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Estado</Label>
                  <p className="text-sm">{selectedItem.state}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CEP</Label>
                  <p className="text-sm">{selectedItem.zip_code}</p>
                </div>
              </div>

              {selectedItem.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm">{selectedItem.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleOpenDocuments}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <FileText className="w-4 h-4" />
                  Documentos
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenHistory}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <History className="w-4 h-4" />
                  Histórico
                </Button>
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false)
                    handleEdit(selectedItem)
                  }}
                  className="bg-black hover:bg-gray-800"
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDocumentsModalOpen} onOpenChange={setIsDocumentsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documentos - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddDocumentModalOpen(true)} className="bg-black hover:bg-gray-800">
                <Upload className="w-4 h-4 mr-2" />
                Adicionar Documento
              </Button>
            </div>
            <div className="space-y-2">
              {documents
                .filter((doc) => doc.client_supplier_id === selectedItem?.id)
                .map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {doc.type} - {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                        {doc.file_name && (
                          <span className="ml-2">
                            • {doc.file_name} ({doc.file_size})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartDelete(doc.id, "document")}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              {documents.filter((doc) => doc.client_supplier_id === selectedItem?.id).length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum documento cadastrado</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddHistoryModalOpen(true)} className="bg-black hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Registro
              </Button>
            </div>
            <div className="space-y-2">
              {historyRecords
                .filter((record) => record.client_supplier_id === selectedItem?.id)
                .map((record) => (
                  <div key={record.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getHistoryTypeColor(record.type)}`}>
                          {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(record.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartDelete(record.id, "history")}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm">{record.description}</p>
                  </div>
                ))}
              {historyRecords.filter((record) => record.client_supplier_id === selectedItem?.id).length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhum registro de histórico</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeletePasswordModalOpen} onOpenChange={setIsDeletePasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Para excluir este {itemToDelete?.type === "document" ? "documento" : "registro de histórico"}, digite a
              senha de confirmação:
            </p>
            <div>
              <Label htmlFor="deletePassword">Senha</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Digite a senha"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmDelete()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeletePasswordModalOpen(false)
                  setItemToDelete(null)
                  setDeletePassword("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDocumentModalOpen} onOpenChange={setIsAddDocumentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDocument} className="space-y-4">
            <div>
              <Label htmlFor="docName">Nome do Documento</Label>
              <Input
                id="docName"
                value={documentForm.name}
                onChange={(e) => setDocumentForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="docType">Tipo do Documento</Label>
              <Input
                id="docType"
                value={documentForm.type}
                onChange={(e) => setDocumentForm((prev) => ({ ...prev, type: e.target.value }))}
                placeholder="Ex: Contrato, RG, CNPJ..."
                required
              />
            </div>
            <div>
              <Label htmlFor="docFile">Arquivo</Label>
              <Input
                id="docFile"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setDocumentForm((prev) => ({ ...prev, file }))
                }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDocumentModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-black hover:bg-gray-800">
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddHistoryModalOpen} onOpenChange={setIsAddHistoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Registro de Histórico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddHistory} className="space-y-4">
            <div>
              <Label htmlFor="historyType">Tipo</Label>
              <Select
                value={historyForm.type}
                onValueChange={(value: "positivo" | "negativo" | "neutro") =>
                  setHistoryForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positivo">Positivo</SelectItem>
                  <SelectItem value="negativo">Negativo</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="historyDescription">Descrição</Label>
              <Textarea
                id="historyDescription"
                value={historyForm.description}
                onChange={(e) => setHistoryForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddHistoryModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-black hover:bg-gray-800">
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
