"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Trash2, Users, Plus, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { employeeOperations } from "@/lib/database/operations"

interface Funcionario {
  id: string
  nome: string
  cargo: string
  salario: string
  dataAdmissao: string
  empresa: string
  cpf: string
  telefone: string
  email: string
  endereco: string
  nivel: string
  status: string
  observacoes: string
  departamento?: string
  dataNascimento?: string
}

export default function UtilitiesPage() {
  const [nomesList, setNomesList] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const { toast } = useToast()

  const processNamesList = async () => {
    if (!nomesList.trim()) {
      toast({
        title: "Erro",
        description: "Cole os nomes dos funcionários no campo de texto.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Iniciando processamento da lista de nomes")
    setIsProcessing(true)

    try {
      // Dividir os nomes por quebra de linha e limpar espaços
      const nomes = nomesList
        .split("\n")
        .map((nome) => nome.trim())
        .filter((nome) => nome.length > 0)

      console.log("[v0] Nomes extraídos:", nomes)

      const funcionarios = await employeeOperations.getAll()
      console.log("[v0] Funcionários existentes:", funcionarios.length)

      let addedCount = 0
      let duplicateCount = 0

      for (const nome of nomes) {
        if (nome && nome.trim()) {
          const nomeFormatado = nome.trim()
          console.log("[v0] Processando nome:", nomeFormatado)

          const exists = funcionarios.some((f: any) => (f.nome?.toLowerCase() || "") === nomeFormatado.toLowerCase())

          if (!exists) {
            const novoFuncionario = {
              nome: nomeFormatado,
              cpf: "", // CPF será preenchido posteriormente
              cargo: "A definir",
              departamento: "A definir",
              data_admissao: new Date().toISOString().split("T")[0],
              empresa: "GA SERVIÇOS",
              salario: "0",
              telefone: "",
              email: "",
              endereco: "",
              observacoes: "Adicionado via lista em massa",
              data_nascimento: "",
              status: "ativo",
            }

            await employeeOperations.create(novoFuncionario)
            addedCount++
            console.log("[v0] Funcionário adicionado:", nomeFormatado)
          } else {
            duplicateCount++
            console.log("[v0] Funcionário já existe:", nomeFormatado)
          }
        }
      }

      toast({
        title: "Processamento Concluído",
        description: `${addedCount} funcionários adicionados, ${duplicateCount} duplicatas ignoradas.`,
      })

      console.log("[v0] Processamento concluído. Adicionados:", addedCount, "Duplicatas:", duplicateCount)

      // Limpar o campo de texto
      setNomesList("")
    } catch (error) {
      console.error("[v0] Erro ao processar lista de nomes:", error)
      toast({
        title: "Erro",
        description: `Erro ao processar lista de nomes: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const clearAllEmployees = async () => {
    const requiredPassword = "excluir todos os funcionários de uma só vez"

    if (deletePassword !== requiredPassword) {
      toast({
        title: "Senha Incorreta",
        description: "Digite a senha correta para confirmar a exclusão.",
        variant: "destructive",
      })
      return
    }

    if (confirm("Tem certeza que deseja excluir TODOS os funcionários? Esta ação não pode ser desfeita.")) {
      try {
        const funcionarios = await employeeOperations.getAll()

        for (const funcionario of funcionarios) {
          await employeeOperations.delete(funcionario.id)
        }

        toast({
          title: "Funcionários excluídos",
          description: "Todos os funcionários foram removidos do sistema.",
        })
        setDeletePassword("")
        setShowDeleteConfirmation(false)
      } catch (error) {
        console.error("[v0] Erro ao excluir funcionários:", error)
        toast({
          title: "Erro",
          description: `Erro ao excluir funcionários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          variant: "destructive",
        })
      }
    }
  }

  const toggleDeleteConfirmation = () => {
    setShowDeleteConfirmation(!showDeleteConfirmation)
    setDeletePassword("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestão de Funcionários em Massa
          </CardTitle>
          <CardDescription>Adicione funcionários em massa colando uma lista de nomes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adicionar Funcionários</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomes-list">Lista de Nomes dos Funcionários</Label>
                <Textarea
                  id="nomes-list"
                  placeholder="Cole aqui os nomes dos funcionários, um por linha:&#10;&#10;João Silva Santos&#10;Maria Oliveira Costa&#10;Carlos Eduardo Lima"
                  value={nomesList}
                  onChange={(e) => setNomesList(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Cole os nomes dos funcionários, um por linha. Nomes duplicados serão ignorados.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={processNamesList}
                  disabled={!nomesList.trim() || isProcessing}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {isProcessing ? "Processando..." : "Adicionar Funcionários"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-destructive">Zona de Perigo</h3>
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-sm text-muted-foreground mb-3">
                Esta ação irá remover TODOS os funcionários do sistema permanentemente.
              </p>

              {!showDeleteConfirmation ? (
                <Button
                  variant="outline"
                  onClick={toggleDeleteConfirmation}
                  className="flex items-center gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                >
                  <Lock className="h-4 w-4" />
                  Excluir Todos os Funcionários
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-password" className="text-sm font-medium">
                      Digite a senha para confirmar a exclusão:
                    </Label>
                    <Input
                      id="delete-password"
                      type="text"
                      placeholder="excluir todos os funcionários de uma só vez"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Senha: "excluir todos os funcionários de uma só vez"
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={clearAllEmployees}
                      className="flex items-center gap-2"
                      disabled={deletePassword !== "excluir todos os funcionários de uma só vez"}
                    >
                      <Trash2 className="h-4 w-4" />
                      Confirmar Exclusão
                    </Button>
                    <Button variant="outline" onClick={toggleDeleteConfirmation}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outras Ferramentas</CardTitle>
          <CardDescription>Ferramentas e utilitários adicionais do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Outras funcionalidades de utilitários serão adicionadas aqui conforme necessário.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
