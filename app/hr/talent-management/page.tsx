"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Search, Plus, Edit, Eye, User } from "lucide-react"

interface Candidate {
  id: string
  name: string
  phone: string
  resume: string | null
  resumeFileName?: string
  createdAt: string
  interviewAnswers?: Record<string, string>
  interviewScore?: number
  evaluations?: {
    punctuality: string
    presentation: string
    communication: string
    sociability: string
  }
}

const interviewQuestions = [
  "Como você se descreveria profissionalmente?",
  "Quais são seus principais pontos fortes?",
  "Qual é sua maior fraqueza e como trabalha para melhorá-la?",
  "Por que está interessado nesta posição?",
  "Onde você se vê em 5 anos?",
  "Como você lida com pressão e prazos apertados?",
  "Descreva uma situação desafiadora que enfrentou no trabalho.",
  "Como você trabalha em equipe?",
  "Qual foi sua maior conquista profissional?",
  "Como você se mantém atualizado em sua área?",
  "Qual é sua expectativa salarial?",
  "Por que está deixando seu emprego atual?",
  "Como você prioriza suas tarefas diárias?",
  "Descreva seu estilo de liderança.",
  "Como você lida com críticas construtivas?",
  "Qual tipo de ambiente de trabalho prefere?",
  "Como você resolve conflitos no trabalho?",
  "Quais são suas principais motivações profissionais?",
  "Como você lida com mudanças organizacionais?",
  "O que você espera aprender nesta função?",
]

export default function TalentManagementPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    resume: null as File | null,
  })
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({})
  const [evaluations, setEvaluations] = useState({
    punctuality: "",
    presentation: "",
    communication: "",
    sociability: "",
  })

  useEffect(() => {
    const savedCandidates = localStorage.getItem("talent_candidates")
    if (savedCandidates) {
      setCandidates(JSON.parse(savedCandidates))
    }
  }, [])

  const saveCandidates = (updatedCandidates: Candidate[]) => {
    setCandidates(updatedCandidates)
    localStorage.setItem("talent_candidates", JSON.stringify(updatedCandidates))
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      (candidate.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (candidate.phone || "").includes(searchTerm)
    return matchesSearch
  })

  const calculateInterviewScore = (answers: Record<string, string>, evals: any) => {
    const answeredQuestions = Object.keys(answers).length
    const totalQuestions = interviewQuestions.length

    // Base score from answered questions (40% weight)
    let score = (answeredQuestions / totalQuestions) * 40

    // Score from answer quality based on length and content (40% weight)
    const avgAnswerLength =
      Object.values(answers).reduce((sum, answer) => sum + answer.length, 0) / (answeredQuestions || 1)
    if (avgAnswerLength > 100) score += 40
    else if (avgAnswerLength > 50) score += 30
    else if (avgAnswerLength > 20) score += 20
    else if (avgAnswerLength > 0) score += 10

    // Score from behavioral evaluations (20% weight)
    const evalScores = {
      ruim: 0,
      regular: 1.25,
      bom: 2.5,
      ótimo: 5,
      calmo: 4,
      agitado: 2,
      nervoso: 1,
      paciente: 4.5,
      apático: 1,
      simpático: 5,
      sorridente: 5,
      sério: 3,
    }

    if (evals.punctuality) score += evalScores[evals.punctuality as keyof typeof evalScores] || 0
    if (evals.presentation) score += evalScores[evals.presentation as keyof typeof evalScores] || 0
    if (evals.communication) score += evalScores[evals.communication as keyof typeof evalScores] || 0
    if (evals.sociability) score += evalScores[evals.sociability as keyof typeof evalScores] || 0

    return Math.min(100, Math.max(0, Math.round(score)))
  }

  const generateSummary = (answers: Record<string, string>, evals: any) => {
    const answeredCount = Object.keys(answers).length
    const totalQuestions = interviewQuestions.length

    let summary = `Candidato respondeu ${answeredCount} de ${totalQuestions} perguntas. `

    const evalTexts = []
    if (evals.punctuality) evalTexts.push(`Pontualidade: ${evals.punctuality}`)
    if (evals.presentation) evalTexts.push(`Apresentação: ${evals.presentation}`)
    if (evals.communication) evalTexts.push(`Comunicação: ${evals.communication}`)
    if (evals.sociability) evalTexts.push(`Sociabilidade: ${evals.sociability}`)

    if (evalTexts.length > 0) {
      summary += `Avaliações Comportamentais: ${evalTexts.join(", ")}.`
    }

    // Simple assessment based on completion and evaluations
    const completionRate = (answeredCount / totalQuestions) * 100
    if (completionRate >= 80) {
      summary += " Candidato demonstrou boa participação na entrevista."
    } else if (completionRate >= 50) {
      summary += " Candidato respondeu a maioria das perguntas."
    } else {
      summary += " Candidato respondeu poucas perguntas da entrevista."
    }

    return summary
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let resumeData = null
    let resumeFileName = undefined

    if (formData.resume) {
      resumeFileName = formData.resume.name
      const reader = new FileReader()
      resumeData = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(formData.resume!)
      })
    }

    if (editingCandidate) {
      const updatedCandidates = candidates.map((candidate) =>
        candidate.id === editingCandidate.id
          ? { ...candidate, name: formData.name, phone: formData.phone, resume: resumeData, resumeFileName }
          : candidate,
      )
      saveCandidates(updatedCandidates)
    } else {
      const newCandidate: Candidate = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        resume: resumeData,
        resumeFileName,
        createdAt: new Date().toISOString(),
      }
      const updatedCandidates = [...candidates, newCandidate]
      saveCandidates(updatedCandidates)
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      resume: null,
    })
    setEditingCandidate(null)
    setIsModalOpen(false)
  }

  const handleEdit = (candidate: Candidate) => {
    setFormData({
      name: candidate.name,
      phone: candidate.phone,
      resume: null,
    })
    setEditingCandidate(candidate)
    setIsModalOpen(true)
  }

  const handleView = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsViewModalOpen(true)
  }

  const handleInterview = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setInterviewAnswers(candidate.interviewAnswers || {})
    setEvaluations(
      candidate.evaluations || {
        punctuality: "",
        presentation: "",
        communication: "",
        sociability: "",
      },
    )
    setIsInterviewModalOpen(true)
  }

  const handleSaveInterview = async () => {
    if (!selectedCandidate) return

    const score = calculateInterviewScore(interviewAnswers, evaluations)

    const updatedCandidates = candidates.map((candidate) =>
      candidate.id === selectedCandidate.id
        ? { ...candidate, interviewAnswers, interviewScore: score, evaluations }
        : candidate,
    )

    saveCandidates(updatedCandidates)
    setIsInterviewModalOpen(false)
    setSelectedCandidate(null)
    setInterviewAnswers({})
    setEvaluations({
      punctuality: "",
      presentation: "",
      communication: "",
      sociability: "",
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Talentos</h1>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Talento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCandidate ? "Editar" : "Novo"} Candidato</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="resume">Currículo (PDF)</Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setFormData((prev) => ({ ...prev, resume: file }))
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-black hover:bg-gray-800">
                    {editingCandidate ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{candidate.name}</h3>
                    <div className="mt-1">
                      <span className="bg-black text-white px-3 py-1 rounded-sm text-xs font-medium">Candidato</span>
                      {candidate.interviewScore && (
                        <span className={`ml-2 text-sm font-medium ${getScoreColor(candidate.interviewScore)}`}>
                          Pontuação: {candidate.interviewScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInterview(candidate)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Entrevista
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(candidate)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Resultado
                </Button>
              </div>
            </div>
          ))}
          {filteredCandidates.length === 0 && (
            <div className="p-8 text-center text-gray-500">Nenhum candidato encontrado</div>
          )}
        </div>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl border-2 border-gray-300 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultado da Entrevista - {selectedCandidate?.name}</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                  <p className="text-sm">{selectedCandidate.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-sm">{selectedCandidate.phone}</p>
                </div>
              </div>

              {selectedCandidate.resumeFileName && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Currículo</Label>
                  {selectedCandidate.resume ? (
                    <a
                      href={selectedCandidate.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      {selectedCandidate.resumeFileName}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">{selectedCandidate.resumeFileName}</p>
                  )}
                </div>
              )}

              {selectedCandidate.interviewAnswers && Object.keys(selectedCandidate.interviewAnswers).length > 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Resumo da Entrevista</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-line">
                      {generateSummary(selectedCandidate.interviewAnswers, selectedCandidate.evaluations || {})}
                    </div>
                  </div>

                  {selectedCandidate.interviewScore && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Pontuação Geral de Entrevista</h4>
                          <p className="text-sm text-gray-600">Baseada em respostas e avaliações comportamentais</p>
                        </div>
                        <div className={`text-3xl font-bold ${getScoreColor(selectedCandidate.interviewScore)}`}>
                          {selectedCandidate.interviewScore}/100
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false)
                    handleEdit(selectedCandidate)
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

      <Dialog open={isInterviewModalOpen} onOpenChange={setIsInterviewModalOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedCandidate?.name} - Entrevista
            </DialogTitle>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Telefone</Label>
                    <p className="text-sm">{selectedCandidate.phone}</p>
                  </div>
                  {selectedCandidate.resumeFileName && (
                    <div>
                      <Label className="text-sm font-medium">Currículo</Label>
                      {selectedCandidate.resume ? (
                        <a
                          href={selectedCandidate.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          {selectedCandidate.resumeFileName}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">{selectedCandidate.resumeFileName}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Avaliações Comportamentais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Pontualidade do Candidato</Label>
                    <RadioGroup
                      value={evaluations.punctuality}
                      onValueChange={(value) => setEvaluations((prev) => ({ ...prev, punctuality: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ruim" id="punct-ruim" />
                        <Label htmlFor="punct-ruim">Ruim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="regular" id="punct-regular" />
                        <Label htmlFor="punct-regular">Regular</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bom" id="punct-bom" />
                        <Label htmlFor="punct-bom">Bom</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ótimo" id="punct-otimo" />
                        <Label htmlFor="punct-otimo">Ótimo</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Apresentação</Label>
                    <RadioGroup
                      value={evaluations.presentation}
                      onValueChange={(value) => setEvaluations((prev) => ({ ...prev, presentation: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ruim" id="pres-ruim" />
                        <Label htmlFor="pres-ruim">Ruim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="regular" id="pres-regular" />
                        <Label htmlFor="pres-regular">Regular</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bom" id="pres-bom" />
                        <Label htmlFor="pres-bom">Bom</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ótimo" id="pres-otimo" />
                        <Label htmlFor="pres-otimo">Ótimo</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Comunicação</Label>
                    <RadioGroup
                      value={evaluations.communication}
                      onValueChange={(value) => setEvaluations((prev) => ({ ...prev, communication: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ruim" id="comm-ruim" />
                        <Label htmlFor="comm-ruim">Ruim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="regular" id="comm-regular" />
                        <Label htmlFor="comm-regular">Regular</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bom" id="comm-bom" />
                        <Label htmlFor="comm-bom">Bom</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ótimo" id="comm-otimo" />
                        <Label htmlFor="comm-otimo">Ótimo</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Sociabilidade</Label>
                    <RadioGroup
                      value={evaluations.sociability}
                      onValueChange={(value) => setEvaluations((prev) => ({ ...prev, sociability: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="calmo" id="soc-calmo" />
                        <Label htmlFor="soc-calmo">Calmo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="agitado" id="soc-agitado" />
                        <Label htmlFor="soc-agitado">Agitado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nervoso" id="soc-nervoso" />
                        <Label htmlFor="soc-nervoso">Nervoso</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paciente" id="soc-paciente" />
                        <Label htmlFor="soc-paciente">Paciente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="apático" id="soc-apatico" />
                        <Label htmlFor="soc-apatico">Apático</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="simpático" id="soc-simpatico" />
                        <Label htmlFor="soc-simpatico">Simpático</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sorridente" id="soc-sorridente" />
                        <Label htmlFor="soc-sorridente">Sorridente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sério" id="soc-serio" />
                        <Label htmlFor="soc-serio">Sério</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Perguntas da Entrevista</h3>
                  <div className="text-sm text-gray-600">
                    {Object.keys(interviewAnswers).length}/{interviewQuestions.length} respondidas
                  </div>
                </div>

                <div className="space-y-4">
                  {interviewQuestions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <Label className="text-sm font-medium mb-2 block">
                        {index + 1}. {question}
                      </Label>
                      <Textarea
                        value={interviewAnswers[index] || ""}
                        onChange={(e) =>
                          setInterviewAnswers((prev) => ({
                            ...prev,
                            [index]: e.target.value,
                          }))
                        }
                        placeholder="Digite a resposta do candidato..."
                        className="min-h-[80px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {selectedCandidate.interviewScore && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Pontuação da Entrevista</h4>
                      <p className="text-sm text-gray-600">Baseada nas respostas e avaliações comportamentais</p>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(selectedCandidate.interviewScore)}`}>
                      {selectedCandidate.interviewScore}/100
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveInterview} className="flex-1">
                  Salvar Entrevista
                </Button>
                <Button variant="outline" onClick={() => setIsInterviewModalOpen(false)}>
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
