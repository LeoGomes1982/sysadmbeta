"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, EyeOff, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLoginCredentials } from "@/hooks/use-realtime"
import { loginCredentialOperations } from "@/lib/supabase/operations"

interface Login {
  id: string
  name: string
  login: string
  password: string
  created_at: string
  updated_at: string
}

export default function LoginsPage() {
  const { data: logins, loading } = useLoginCredentials()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(true)
  const [authPassword, setAuthPassword] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingLogin, setEditingLogin] = useState<Login | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: "",
    login: "",
    senha: "",
  })

  const validatePageAccess = () => {
    if (authPassword === "123456789") {
      setIsAuthenticated(true)
      setShowAuthModal(false)
      setAuthPassword("")
      toast({
        title: "Acesso concedido",
        description: "Bem-vindo à página de logins!",
      })
    } else {
      toast({
        title: "Erro",
        description: "Senha incorreta!",
        variant: "destructive",
      })
      setAuthPassword("")
    }
  }

  const handleAuthKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      validatePageAccess()
    }
  }

  const salvarLogin = async () => {
    console.log("[v0] Iniciando salvarLogin com dados:", formData)

    if (!formData.nome.trim() || !formData.login.trim() || !formData.senha.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      console.log("[v0] Tentando salvar no banco de dados...")

      if (editingLogin) {
        console.log("[v0] Atualizando login existente:", editingLogin.id)
        await loginCredentialOperations.update(editingLogin.id, {
          name: formData.nome,
          login: formData.login,
          password: formData.senha,
        })

        console.log("[v0] Login atualizado com sucesso!")
        toast({
          title: "Sucesso",
          description: "Login atualizado com sucesso!",
        })
      } else {
        console.log("[v0] Criando novo login...")
        const result = await loginCredentialOperations.create({
          name: formData.nome,
          login: formData.login,
          password: formData.senha,
        })

        console.log("[v0] Login criado com sucesso:", result)
        toast({
          title: "Sucesso",
          description: "Login cadastrado com sucesso!",
        })
      }

      setFormData({ nome: "", login: "", senha: "" })
      setEditingLogin(null)
      setShowModal(false)
    } catch (error) {
      console.error("[v0] Erro ao salvar login:", error)
      toast({
        title: "Erro",
        description: `Erro ao salvar login: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const editarLogin = (login: Login) => {
    setEditingLogin(login)
    setFormData({
      nome: login.name,
      login: login.login,
      senha: login.password,
    })
    setShowModal(true)
  }

  const removerLogin = async (id: string) => {
    const senha = prompt("Digite a senha para excluir este login:")
    if (senha !== "123456789") {
      toast({
        title: "Erro",
        description: "Senha incorreta!",
        variant: "destructive",
      })
      return
    }

    try {
      await loginCredentialOperations.delete(id)

      toast({
        title: "Sucesso",
        description: "Login removido com sucesso!",
      })
    } catch (error) {
      console.error("[v0] Erro ao remover login:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover login. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const resetModal = () => {
    setFormData({ nome: "", login: "", senha: "" })
    setEditingLogin(null)
    setShowModal(false)
  }

  if (!isAuthenticated) {
    return (
      <Dialog
        open={showAuthModal}
        onOpenChange={(open) => {
          if (!open) {
            // Usuário clicou no X para fechar, permitir fechar sem senha
            setShowAuthModal(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Acesso Restrito
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Esta página é protegida. Digite a senha para acessar.</p>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Senha</Label>
              <Input
                id="auth-password"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onKeyPress={handleAuthKeyPress}
                placeholder="Digite a senha"
                autoFocus
              />
            </div>
            <Button onClick={validatePageAccess} className="w-full">
              Acessar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando logins...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">Logins</CardTitle>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={() => resetModal()}>
                <Plus className="w-4 h-4" />
                Novo Login
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLogin ? "Editar Login" : "Novo Login"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Email do RH, Site do DP, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login">Login</Label>
                  <Input
                    id="login"
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    placeholder="Ex: usuario@empresa.com, admin123, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Digite a senha"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={salvarLogin} disabled={saving}>
                    {saving ? "Salvando..." : editingLogin ? "Atualizar" : "Salvar"}
                  </Button>
                  <Button variant="outline" onClick={resetModal} disabled={saving}>
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
          <CardTitle className="text-3xl">Logins Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {logins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum login cadastrado ainda.</p>
              <p className="text-sm mt-1">Clique em "Novo Login" para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logins.map((login) => (
                  <TableRow key={login.id}>
                    <TableCell className="font-medium">{login.name}</TableCell>
                    <TableCell>{login.login}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {showPasswords[login.id] ? login.password : "•".repeat(login.password.length)}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => togglePasswordVisibility(login.id)}>
                          {showPasswords[login.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => editarLogin(login)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removerLogin(login.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
