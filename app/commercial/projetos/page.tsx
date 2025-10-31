"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Check, X, Eye, Edit } from "lucide-react"
import { useProjects } from "@/hooks/use-realtime"
import { projectOperations } from "@/lib/database/operations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Projeto {
  id: string
  nome: string
  cliente: string
  data_inicio: string
  data_fim?: string
  status: string
  valor?: number
  descricao?: string
  created_at?: string
}

export default function ProjetosPage() {
  const { data: projetos, loading } = useProjects()
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewingProject, setViewingProject] = useState<Projeto | null>(null)
  const [editingProject, setEditingProject] = useState<Projeto | null>(null)
  const [editNome, setEditNome] = useState("")
  const [editDescricao, setEditDescricao] = useState("")

  const adicionarProjeto = async () => {
    setIsSaving(true)

    console.log("[v0] Criando novo projeto")

    try {
      await projectOperations.create({
        nome: "Novo Projeto",
        cliente: "",
        data_inicio: new Date().toISOString().split("T")[0],
        status: "em_andamento",
        descricao: "",
      })

      console.log("[v0] Projeto criado com sucesso")
      setShowModal(false)
    } catch (error) {
      console.error("[v0] Erro ao criar projeto:", error)
      alert("Erro ao criar projeto. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const atualizarProjeto = async (id: string, campo: keyof Projeto, valor: string | number) => {
    console.log(`[v0] Atualizando projeto ${id}, campo ${campo}:`, valor)

    try {
      await projectOperations.update(id, { [campo]: valor })
      console.log("[v0] Projeto atualizado com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao atualizar projeto:", error)
      alert("Erro ao atualizar projeto. Tente novamente.")
    }
  }

  const removerProjeto = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este projeto?")) {
      try {
        console.log("[v0] Removendo projeto:", id)
        await projectOperations.delete(id)
        console.log("[v0] Projeto removido com sucesso")
        setShowViewModal(false)
        setViewingProject(null)
      } catch (error) {
        console.error("[v0] Erro ao remover projeto:", error)
        alert("Erro ao remover projeto. Tente novamente.")
      }
    }
  }

  const visualizarProjeto = (projeto: Projeto) => {
    setViewingProject(projeto)
    setShowViewModal(true)
  }

  const abrirModalEdicao = (projeto: Projeto) => {
    setEditingProject(projeto)
    setEditNome(projeto.nome)
    setEditDescricao(projeto.descricao || "")
    setShowEditModal(true)
  }

  const salvarEdicao = async () => {
    if (!editingProject) return

    setIsSaving(true)
    console.log("[v0] Salvando edição do projeto:", editingProject.id)

    try {
      await projectOperations.update(editingProject.id, {
        nome: editNome,
        descricao: editDescricao,
      })
      console.log("[v0] Projeto atualizado com sucesso")
      setShowEditModal(false)
      setEditingProject(null)
    } catch (error) {
      console.error("[v0] Erro ao atualizar projeto:", error)
      alert("Erro ao atualizar projeto. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const getCorStatus = (status: string) => {
    switch (status) {
      case "planejamento":
        return "bg-green-500"
      case "em_andamento":
        return "bg-yellow-500"
      case "revisao":
        return "bg-gradient-to-r from-green-500 to-yellow-500"
      case "concluido":
        return "bg-green-500"
      case "cancelado":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planejamento":
        return "Planejamento"
      case "em_andamento":
        return "Em Andamento"
      case "revisao":
        return "Em Revisão"
      case "concluido":
        return "Concluído"
      case "cancelado":
        return "Cancelado"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Carregando projetos...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Projetos</CardTitle>
            <CardDescription>
              Gerencie e acompanhe seus projetos comerciais
              <span className="ml-2 text-sm font-medium">
                ({projetos.length} projeto{projetos.length !== 1 ? "s" : ""})
              </span>
            </CardDescription>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4" />
                Novo projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Projeto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Um novo projeto será criado e adicionado à lista.</p>
                <Button onClick={adicionarProjeto} disabled={isSaving}>
                  {isSaving ? "Criando..." : "Criar Projeto"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projetos.map((projeto) => (
              <div
                key={projeto.id}
                className="grid gap-4 p-4 border rounded-lg items-center"
                style={{ gridTemplateColumns: "4fr 1fr 1fr 1fr 1.5fr 0.5fr" }}
              >
                <Button
                  variant="outline"
                  className="h-10 justify-start text-left font-normal bg-transparent"
                  onClick={() => abrirModalEdicao(projeto)}
                >
                  <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{projeto.nome}</span>
                </Button>
                <Input
                  type="date"
                  value={projeto.data_inicio}
                  onChange={(e) => atualizarProjeto(projeto.id, "data_inicio", e.target.value)}
                  className="h-10"
                />
                <Input
                  type="date"
                  value={projeto.data_fim || ""}
                  onChange={(e) => atualizarProjeto(projeto.id, "data_fim", e.target.value)}
                  className="h-10"
                />
                <Input
                  type="number"
                  placeholder="Valor (R$)"
                  value={projeto.valor || ""}
                  onChange={(e) => atualizarProjeto(projeto.id, "valor", Number.parseFloat(e.target.value) || 0)}
                  className="h-10"
                />
                <Select value={projeto.status} onValueChange={(value) => atualizarProjeto(projeto.id, "status", value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {projeto.status === "concluido" ? (
                          <>
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span>Concluído</span>
                          </>
                        ) : projeto.status === "cancelado" ? (
                          <>
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500">
                              <X className="w-3 h-3 text-white" />
                            </div>
                            <span>Cancelado</span>
                          </>
                        ) : projeto.status === "revisao" ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-yellow-500"></div>
                            <span>Em Revisão</span>
                          </>
                        ) : projeto.status === "planejamento" ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-green-500"></div>
                            <span>Planejamento</span>
                          </>
                        ) : projeto.status === "em_andamento" ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-yellow-500"></div>
                            <span>Em Andamento</span>
                          </>
                        ) : (
                          <span>{projeto.status}</span>
                        )}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejamento">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500"></div>
                        <span>Planejamento</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="em_andamento">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-yellow-500"></div>
                        <span>Em Andamento</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="revisao">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-yellow-500"></div>
                        <span>Em Revisão</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="concluido">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>Concluído</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelado">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500">
                          <X className="w-3 h-3 text-white" />
                        </div>
                        <span>Cancelado</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => visualizarProjeto(projeto)}
                    className="text-blue-600 hover:text-blue-700 h-10"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {projetos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum projeto criado ainda</p>
                <p className="text-sm mt-1">Use o botão "Novo projeto" para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Projeto</DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome do Projeto</label>
                  <p className="text-base mt-1">{viewingProject.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="text-base mt-1">{viewingProject.cliente || "Não informado"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                  <p className="text-base mt-1">
                    {viewingProject.data_inicio
                      ? new Date(viewingProject.data_inicio).toLocaleDateString("pt-BR")
                      : "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Final</label>
                  <p className="text-base mt-1">
                    {viewingProject.data_fim
                      ? new Date(viewingProject.data_fim).toLocaleDateString("pt-BR")
                      : "Não informado"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <p className="text-base mt-1">
                    {viewingProject.valor
                      ? `R$ ${viewingProject.valor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {viewingProject.status === "concluido" ? (
                      <>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span>Concluído</span>
                      </>
                    ) : viewingProject.status === "cancelado" ? (
                      <>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500">
                          <X className="w-4 h-4 text-white" />
                        </div>
                        <span>Cancelado</span>
                      </>
                    ) : viewingProject.status === "revisao" ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-yellow-500"></div>
                        <span>Em Revisão</span>
                      </>
                    ) : viewingProject.status === "planejamento" ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-green-500"></div>
                        <span>Planejamento</span>
                      </>
                    ) : viewingProject.status === "em_andamento" ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
                        <span>Em Andamento</span>
                      </>
                    ) : (
                      <span>{viewingProject.status}</span>
                    )}
                  </div>
                </div>
              </div>

              {viewingProject.descricao && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-base mt-1">{viewingProject.descricao}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Fechar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => removerProjeto(viewingProject.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Projeto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Projeto</label>
              <Textarea
                placeholder="Digite o nome do projeto..."
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
              <Textarea
                placeholder="Digite uma descrição detalhada do projeto..."
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={salvarEdicao} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
