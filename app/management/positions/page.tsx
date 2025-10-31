"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { usePositions } from "@/hooks/use-realtime"
import { positionOperations } from "@/lib/database/operations"

interface Position {
  id: string
  nome: string
  nivel: string
  salario_base?: number
  beneficios?: string
  requisitos?: string
  created_at: string
}

export default function PositionsPage() {
  const { data: positions, loading } = usePositions()
  const [view, setView] = useState<"list" | "form">("list")
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)

  const [formData, setFormData] = useState({
    nome: "",
    nivel: "",
    salario_base: "",
    beneficios: "",
    requisitos: "",
  })

  const salvarPosition = async () => {
    if (!formData.nome.trim() || !formData.nivel.trim()) return

    try {
      console.log("[v0] Salvando nova posição:", formData)
      await positionOperations.create({
        nome: formData.nome,
        nivel: formData.nivel,
        salario_base: formData.salario_base ? Number.parseFloat(formData.salario_base) : undefined,
        beneficios: formData.beneficios || undefined,
        requisitos: formData.requisitos || undefined,
      })

      setFormData({
        nome: "",
        nivel: "",
        salario_base: "",
        beneficios: "",
        requisitos: "",
      })
      setShowModal(false)
      console.log("[v0] Posição salva com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao salvar posição:", error)
      alert("Erro ao salvar posição. Tente novamente.")
    }
  }

  const salvarEdicao = async () => {
    if (!editingPosition) return

    try {
      console.log("[v0] Atualizando posição:", editingPosition.id)
      await positionOperations.update(editingPosition.id, {
        nome: editingPosition.nome,
        nivel: editingPosition.nivel,
        salario_base: editingPosition.salario_base,
        beneficios: editingPosition.beneficios,
        requisitos: editingPosition.requisitos,
      })
      setEditingPosition(null)
      console.log("[v0] Posição atualizada com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao atualizar posição:", error)
      alert("Erro ao atualizar posição. Tente novamente.")
    }
  }

  const removerPosition = async (id: string) => {
    const senha = prompt("Digite a senha para excluir esta posição:")
    if (senha !== "123456789") {
      alert("Senha incorreta!")
      return
    }

    try {
      console.log("[v0] Removendo posição:", id)
      await positionOperations.delete(id)
      console.log("[v0] Posição removida com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao remover posição:", error)
      alert("Erro ao remover posição. Tente novamente.")
    }
  }

  const selecionarPosition = (position: Position) => {
    setSelectedPosition(position)
    setView("form")
  }

  // Agrupar posições por cargo
  const positionsByJob = positions.reduce((acc: Record<string, Position[]>, position) => {
    if (!acc[position.nome]) {
      acc[position.nome] = []
    }
    acc[position.nome].push(position)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Carregando cargos...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === "list") {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Cargos e Salários</CardTitle>
            </div>
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Posição
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Posição</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Cargo</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Guarda Patrimonial"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nivel">Nível</Label>
                      <Input
                        id="nivel"
                        value={formData.nivel}
                        onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                        placeholder="Ex: I, II, III"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salario">Salário Base</Label>
                    <Input
                      id="salario"
                      type="number"
                      step="0.01"
                      value={formData.salario_base}
                      onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                      placeholder="Ex: 1500.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficios">Benefícios</Label>
                    <Textarea
                      id="beneficios"
                      value={formData.beneficios}
                      onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                      placeholder="Benefícios oferecidos nesta posição"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requisitos">Requisitos</Label>
                    <Textarea
                      id="requisitos"
                      value={formData.requisitos}
                      onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                      placeholder="Requisitos e qualificações necessárias"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={salvarPosition}>Salvar Posição</Button>
                    <Button variant="outline" onClick={() => setShowModal(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posições Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(positionsByJob).map(([jobName, jobPositions]) => (
                <div key={jobName} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">{jobName}</h3>
                  <div className="space-y-2">
                    {jobPositions
                      .sort((a, b) => a.nivel.localeCompare(b.nivel))
                      .map((position) => (
                        <div
                          key={position.id}
                          className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => selecionarPosition(position)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Nível {position.nivel}
                              </span>
                              {position.salario_base && (
                                <span className="text-sm font-medium text-green-600">
                                  R$ {position.salario_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                            {position.beneficios && (
                              <p className="text-sm text-gray-600 mt-1 truncate">{position.beneficios}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {positions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma posição cadastrada</p>
                  <p className="text-sm mt-1">Use o botão "Nova Posição" para adicionar a primeira posição</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedPosition) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              {selectedPosition.nome} - Nível {selectedPosition.nivel}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(!editMode)}>
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? "Cancelar Edição" : "Editar"}
            </Button>
            <Button variant="outline" onClick={() => setView("list")}>
              Voltar à Lista
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {editingPosition?.id === selectedPosition.id ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome do Cargo</Label>
                  <Input
                    value={editingPosition.nome}
                    onChange={(e) => setEditingPosition({ ...editingPosition, nome: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Nível</Label>
                  <Input
                    value={editingPosition.nivel}
                    onChange={(e) => setEditingPosition({ ...editingPosition, nivel: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Salário Base</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingPosition.salario_base || ""}
                  onChange={(e) =>
                    setEditingPosition({
                      ...editingPosition,
                      salario_base: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Benefícios</Label>
                <Textarea
                  value={editingPosition.beneficios || ""}
                  onChange={(e) => setEditingPosition({ ...editingPosition, beneficios: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Requisitos</Label>
                <Textarea
                  value={editingPosition.requisitos || ""}
                  onChange={(e) => setEditingPosition({ ...editingPosition, requisitos: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={salvarEdicao}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setEditingPosition(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div></div>
                <div className="flex gap-2">
                  {editMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPosition(selectedPosition)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removerPosition(selectedPosition.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Salário Base</Label>
                <p className="text-lg mt-1 font-bold">
                  {selectedPosition.salario_base
                    ? `R$ ${selectedPosition.salario_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "Não informado"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Benefícios</Label>
                  <p className="text-sm mt-1">{selectedPosition.beneficios || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Requisitos</Label>
                  <p className="text-sm mt-1">{selectedPosition.requisitos || "Não informado"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
