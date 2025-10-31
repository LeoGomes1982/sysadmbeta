"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, Lock, Plus, Bell, Settings, User } from "lucide-react"
import Image from "next/image"
import { admissionProgressOperations } from "@/lib/database/operations"
import { useToast } from "@/hooks/use-toast"

export default function PortalAdmissaoExterno() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const userIdentifier = "external-user"

  useEffect(() => {
    const auth = localStorage.getItem("portalExternoAuth")
    if (auth === "authenticated") {
      setIsAuthenticated(true)
      loadProgress()
    }
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)
      const progressData = await admissionProgressOperations.getByUserIdentifier(userIdentifier)

      if (progressData) {
        const steps = [progressData.step_1_completed || false]
        setCompletedSteps(steps)
        const completed = steps.filter(Boolean).length
        setProgress(completed * 100)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar progresso:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async (steps: boolean[]) => {
    try {
      const progressData = {
        user_identifier: userIdentifier,
        step_1_completed: steps[0] || false,
        step_2_completed: false,
        step_3_completed: false,
        step_4_completed: false,
        current_step: steps[0] ? 1 : 1,
        progress_percentage: steps[0] ? 100 : 0,
        process_started: true,
      }

      await admissionProgressOperations.upsert(progressData)
    } catch (error) {
      console.error("[v0] Erro ao salvar progresso:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar progresso. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleLogin = async () => {
    if (password === "250") {
      setIsAuthenticated(true)
      localStorage.setItem("portalExternoAuth", "authenticated")
      setError("")
      await loadProgress()
    } else {
      setError("Senha incorreta. Tente novamente.")
    }
  }

  const completeStep = async (stepIndex: number) => {
    const newSteps = [...completedSteps]
    newSteps[stepIndex] = true
    setCompletedSteps(newSteps)

    const completed = newSteps.filter(Boolean).length
    setProgress(completed * 100)

    await saveProgress(newSteps)

    toast({
      title: "Processo Iniciado",
      description: `Processo jurídico iniciado com sucesso!`,
    })
  }

  const steps = [
    {
      title: "Iniciar Processo",
      description: "Clique aqui para iniciar um novo processo jurídico",
      icon: <Plus className="h-12 w-12 text-blue-400" />,
      content: "Bem-vindo ao Portal Jurídico! Clique no botão abaixo para iniciar um novo processo.",
    },
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Portal Jurídico</CardTitle>
            <CardDescription>Digite a senha para acessar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <Button onClick={handleLogin} className="w-full">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando progresso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-black rounded flex items-center justify-center">
              <Image src="/images/logo-ga-sidebar.jpeg" alt="GA Logo" width={24} height={24} className="rounded" />
            </div>
            <span className="text-xl font-semibold text-gray-900">SysAthos</span>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="h-5 w-5 text-gray-500" />
            <Settings className="h-5 w-5 text-gray-500" />
            <User className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">Portal Jurídico</CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Gestão e acompanhamento de processos jurídicos
              </CardDescription>
            </div>
            <Button className="bg-black text-white hover:bg-gray-800 px-6 py-3 text-lg">
              {progress === 0 ? "▶ Iniciar" : `▶ ${progress.toFixed(0)}%`}
            </Button>
          </CardHeader>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Processos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const isCompleted = completedSteps[index]
            const canComplete = true

            return (
              <Card
                key={index}
                className={`relative transition-all duration-200 ${
                  isCompleted ? "border-green-200 bg-green-50" : "border-blue-200 bg-white hover:shadow-md"
                }`}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {isCompleted ? <CheckCircle className="h-12 w-12 text-green-500" /> : step.icon}
                  </div>

                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{step.title}</h3>

                  <p className="text-sm mb-4 text-gray-600">{step.description}</p>

                  {!isCompleted && canComplete && (
                    <Button onClick={() => completeStep(index)} className="w-full bg-blue-600 hover:bg-blue-700">
                      Iniciar Processo
                    </Button>
                  )}

                  {isCompleted && (
                    <div className="text-center">
                      <CheckCircle className="h-4 w-4 mx-auto mb-2 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Processo Iniciado</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
