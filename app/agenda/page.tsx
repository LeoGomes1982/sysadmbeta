"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useAppointments } from "@/hooks/use-realtime"
import { appointmentOperations } from "@/lib/database/operations"

interface Compromisso {
  id: string
  titulo: string
  data: string
  hora: string
  tipo: string
  descricao: string
  responsaveis: string[]
  prioridade: "normal" | "importante"
}

export default function AgendaGeral() {
  const { data: compromissos, loading } = useAppointments()
  const [isSaving, setIsSaving] = useState(false)

  const [novoCompromisso, setNovoCompromisso] = useState({
    titulo: "",
    data: "",
    hora: "",
    tipo: "",
    descricao: "",
    responsaveis: [] as string[],
    prioridade: "normal" as "normal" | "importante",
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [compromissoExpandido, setCompromissoExpandido] = useState<string | null>(null)
  const [editandoCompromisso, setEditandoCompromisso] = useState<Compromisso | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const adicionarCompromisso = async () => {
    if (novoCompromisso.titulo && novoCompromisso.data && novoCompromisso.hora) {
      setIsSaving(true)

      console.log("[v0] Salvando novo compromisso:", novoCompromisso)

      try {
        await appointmentOperations.create({
          titulo: novoCompromisso.titulo,
          descricao: novoCompromisso.descricao,
          data: novoCompromisso.data,
          hora: novoCompromisso.hora,
          tipo: novoCompromisso.tipo,
          responsaveis: novoCompromisso.responsaveis,
          prioridade: novoCompromisso.prioridade,
        })

        console.log("[v0] Compromisso salvo com sucesso")

        setNovoCompromisso({
          titulo: "",
          data: "",
          hora: "",
          tipo: "",
          descricao: "",
          responsaveis: [],
          prioridade: "normal",
        })
        setDialogOpen(false)
      } catch (error) {
        console.error("[v0] Erro ao salvar compromisso:", error)
        alert("Erro ao salvar compromisso. Tente novamente.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  const editarCompromisso = async () => {
    if (editandoCompromisso) {
      setIsSaving(true)

      console.log("[v0] Atualizando compromisso:", editandoCompromisso.id)

      try {
        await appointmentOperations.update(editandoCompromisso.id, {
          titulo: editandoCompromisso.titulo,
          descricao: editandoCompromisso.descricao,
          data: editandoCompromisso.data,
          hora: editandoCompromisso.hora,
          tipo: editandoCompromisso.tipo,
          responsaveis: editandoCompromisso.responsaveis,
          prioridade: editandoCompromisso.prioridade,
        })

        console.log("[v0] Compromisso atualizado com sucesso")

        setEditandoCompromisso(null)
        setEditDialogOpen(false)
      } catch (error) {
        console.error("[v0] Erro ao atualizar compromisso:", error)
        alert("Erro ao atualizar compromisso. Tente novamente.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  const removerCompromisso = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este compromisso?")) {
      try {
        console.log("[v0] Removendo compromisso:", id)
        await appointmentOperations.delete(id)
        console.log("[v0] Compromisso removido com sucesso")
      } catch (error) {
        console.error("[v0] Erro ao remover compromisso:", error)
        alert("Erro ao remover compromisso. Tente novamente.")
      }
    }
  }

  const toggleResponsavel = (responsavel: string, isEdit = false) => {
    if (isEdit && editandoCompromisso) {
      const responsaveis = editandoCompromisso.responsaveis.includes(responsavel)
        ? editandoCompromisso.responsaveis.filter((r) => r !== responsavel)
        : [...editandoCompromisso.responsaveis, responsavel]
      setEditandoCompromisso({ ...editandoCompromisso, responsaveis })
    } else {
      const responsaveis = novoCompromisso.responsaveis.includes(responsavel)
        ? novoCompromisso.responsaveis.filter((r) => r !== responsavel)
        : [...novoCompromisso.responsaveis, responsavel]
      setNovoCompromisso({ ...novoCompromisso, responsaveis })
    }
  }

  const compromissosOrdenados = (compromissos || []).sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
  )

  const responsaveisDisponiveis = ["Leandro", "Aline", "Diego", "Thiago", "Sabrina", "Simone"]

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Agenda Geral</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Carregando compromissos...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-end"></div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">Agenda Geral</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4" />
                Novo Compromisso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Compromisso</DialogTitle>
                <DialogDescription>Adicione um novo compromisso à agenda geral</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={novoCompromisso.titulo}
                    onChange={(e) => setNovoCompromisso({ ...novoCompromisso, titulo: e.target.value })}
                    placeholder="Digite o título do compromisso"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={novoCompromisso.data}
                      onChange={(e) => setNovoCompromisso({ ...novoCompromisso, data: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hora">Hora</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={novoCompromisso.hora}
                      onChange={(e) => setNovoCompromisso({ ...novoCompromisso, hora: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={novoCompromisso.tipo}
                    onValueChange={(value) => setNovoCompromisso({ ...novoCompromisso, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                      <SelectItem value="entrevista">Entrevista</SelectItem>
                      <SelectItem value="treinamento">Treinamento</SelectItem>
                      <SelectItem value="evento">Evento</SelectItem>
                      <SelectItem value="audiencia">Audiência</SelectItem>
                      <SelectItem value="pessoal">Pessoal</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Responsáveis</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {responsaveisDisponiveis.map((responsavel) => (
                      <label key={responsavel} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={novoCompromisso.responsaveis.includes(responsavel)}
                          onChange={() => toggleResponsavel(responsavel)}
                          className="rounded"
                        />
                        <span className="text-sm">{responsavel}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="prioridade">Classificação</Label>
                  <Select
                    value={novoCompromisso.prioridade}
                    onValueChange={(value: "normal" | "importante") =>
                      setNovoCompromisso({ ...novoCompromisso, prioridade: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="importante">Importante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={novoCompromisso.descricao}
                    onChange={(e) => setNovoCompromisso({ ...novoCompromisso, descricao: e.target.value })}
                    placeholder="Descrição opcional do compromisso"
                  />
                </div>
                <Button onClick={adicionarCompromisso} className="w-full" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar Compromisso"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compromissos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!compromissosOrdenados || compromissosOrdenados.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum compromisso cadastrado</p>
            ) : (
              compromissosOrdenados.map((compromisso) => (
                <div
                  key={compromisso.id}
                  className={`border rounded-lg ${compromisso.prioridade === "importante" ? "bg-red-50 border-red-200" : ""}`}
                >
                  <div
                    className={`flex items-center justify-between p-4 cursor-pointer ${compromisso.prioridade === "importante" ? "hover:bg-red-100" : "hover:bg-gray-50"}`}
                    onClick={() =>
                      setCompromissoExpandido(compromissoExpandido === compromisso.id ? null : compromisso.id)
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <h3 className={`font-medium ${compromisso.prioridade === "importante" ? "text-red-800" : ""}`}>
                          {compromisso.titulo}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {compromisso.data.includes("T")
                            ? new Date(compromisso.data + "Z").toLocaleDateString("pt-BR")
                            : new Date(compromisso.data + "T00:00:00").toLocaleDateString("pt-BR")}{" "}
                          - {compromisso.hora}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {compromisso.tipo && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {compromisso.tipo}
                          </span>
                        )}
                        {compromisso.prioridade === "importante" && (
                          <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded font-medium">
                            Importante
                          </span>
                        )}
                        {compromisso.responsaveis && compromisso.responsaveis.length > 0 && (
                          <span className="text-sm text-gray-600">{compromisso.responsaveis.join(", ")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditandoCompromisso(compromisso)
                          setEditDialogOpen(true)
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => removerCompromisso(compromisso.id)}>
                        Remover
                      </Button>
                    </div>
                  </div>

                  {compromissoExpandido === compromisso.id && compromisso.descricao && (
                    <div
                      className={`px-4 pb-4 border-t ${compromisso.prioridade === "importante" ? "bg-red-100" : "bg-gray-50"}`}
                    >
                      <p className="text-sm text-gray-600 mt-2">{compromisso.descricao}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Compromisso</DialogTitle>
            <DialogDescription>Modifique as informações do compromisso</DialogDescription>
          </DialogHeader>
          {editandoCompromisso && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-titulo">Título</Label>
                <Input
                  id="edit-titulo"
                  value={editandoCompromisso.titulo}
                  onChange={(e) => setEditandoCompromisso({ ...editandoCompromisso, titulo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-data">Data</Label>
                  <Input
                    id="edit-data"
                    type="date"
                    value={editandoCompromisso.data}
                    onChange={(e) => setEditandoCompromisso({ ...editandoCompromisso, data: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hora">Hora</Label>
                  <Input
                    id="edit-hora"
                    type="time"
                    value={editandoCompromisso.hora}
                    onChange={(e) => setEditandoCompromisso({ ...editandoCompromisso, hora: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select
                  value={editandoCompromisso.tipo}
                  onValueChange={(value) => setEditandoCompromisso({ ...editandoCompromisso, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="entrevista">Entrevista</SelectItem>
                    <SelectItem value="treinamento">Treinamento</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="audiencia">Audiência</SelectItem>
                    <SelectItem value="pessoal">Pessoal</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsáveis</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {responsaveisDisponiveis.map((responsavel) => (
                    <label key={responsavel} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editandoCompromisso.responsaveis?.includes(responsavel) || false}
                        onChange={() => toggleResponsavel(responsavel, true)}
                        className="rounded"
                      />
                      <span className="text-sm">{responsavel}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-prioridade">Classificação</Label>
                <Select
                  value={editandoCompromisso.prioridade || "normal"}
                  onValueChange={(value: "normal" | "importante") =>
                    setEditandoCompromisso({ ...editandoCompromisso, prioridade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="importante">Importante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={editandoCompromisso.descricao}
                  onChange={(e) => setEditandoCompromisso({ ...editandoCompromisso, descricao: e.target.value })}
                />
              </div>
              <Button onClick={editarCompromisso} className="w-full" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
