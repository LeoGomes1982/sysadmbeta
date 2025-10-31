import "use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, CheckCircle2, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { declaracaoOperations } from "@/lib/database/operations"

export default function DeclaracaoPublicaPage() {
  const [etapa, setEtapa] = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form data
  const [ehColaborador, setEhColaborador] = useState<boolean | null>(null)
  const [querIdentificar, setQuerIdentificar] = useState<boolean | null>(null)
  const [nome, setNome] = useState("")
  const [querTelefone, setQuerTelefone] = useState<boolean | null>(null)
  const [telefone, setTelefone] = useState("")
  const [tipo, setTipo] = useState<"sugestao" | "elogio" | "reclamacao" | "denuncia" | "">("")
  const [data, setData] = useState<Date>()
  const [mensagem, setMensagem] = useState("")

  const handleProximaEtapa = () => {
    setEtapa(etapa + 1)
  }

  const handleVoltarEtapa = () => {
    setEtapa(etapa - 1)
  }

  const handleEnviar = async () => {
    setLoading(true)
    try {
      await declaracaoOperations.create({
        tipo: tipo as "sugestao" | "elogio" | "reclamacao" | "denuncia",
        data: data!,
        eh_colaborador: ehColaborador!,
        quer_contato: querIdentificar!,
        eh_anonimo: !querIdentificar,
        nome: querIdentificar ? nome : null,
        email: null,
        telefone: querTelefone && telefone ? telefone : null,
        mensagem,
      })
      setEnviado(true)
    } catch (error) {
      console.error("Erro ao enviar declaração:", error)
      alert("Erro ao enviar declaração. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const podeAvancar = () => {
    switch (etapa) {
      case 1:
        return ehColaborador !== null
      case 2:
        if (querIdentificar === null) return false
        if (querIdentificar && !nome.trim()) return false
        if (querIdentificar && querTelefone === null) return false
        if (querIdentificar && querTelefone && !telefone.trim()) return false
        return true
      case 3:
        if (!tipo) return false
        if (tipo === "denuncia" && !ehColaborador) return false
        return true
      case 4:
        return data !== undefined
      case 5:
        return mensagem.trim().length > 0
      default:
        return false
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Declaração Enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Sua declaração foi recebida com sucesso. Agradecemos por entrar em contato conosco.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Enviar Nova Declaração
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Fale Conosco</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Etapa {etapa} de 5</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(etapa / 5) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Etapa 1: É colaborador? */}
          {etapa === 1 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Você é colaborador da empresa?</Label>
              <RadioGroup
                value={ehColaborador === null ? "" : ehColaborador ? "sim" : "nao"}
                onValueChange={(value) => setEhColaborador(value === "sim")}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="sim" id="colaborador-sim" />
                  <Label htmlFor="colaborador-sim" className="flex-1 cursor-pointer">
                    Sim, sou colaborador
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="nao" id="colaborador-nao" />
                  <Label htmlFor="colaborador-nao" className="flex-1 cursor-pointer">
                    Não, sou externo
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Etapa 2: Identificação */}
          {etapa === 2 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Deseja se identificar?</Label>
              <RadioGroup
                value={querIdentificar === null ? "" : querIdentificar ? "sim" : "nao"}
                onValueChange={(value) => {
                  const identificar = value === "sim"
                  setQuerIdentificar(identificar)
                  if (!identificar) {
                    setNome("")
                    setQuerTelefone(null)
                    setTelefone("")
                  }
                }}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="sim" id="identificar-sim" />
                  <Label htmlFor="identificar-sim" className="flex-1 cursor-pointer">
                    Sim, quero me identificar
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="nao" id="identificar-nao" />
                  <Label htmlFor="identificar-nao" className="flex-1 cursor-pointer">
                    Não, prefiro permanecer anônimo
                  </Label>
                </div>
              </RadioGroup>

              {querIdentificar && (
                <>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="nome">Seu nome</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  {nome.trim() && (
                    <>
                      <Label className="text-base font-semibold">Deseja deixar um telefone para contato?</Label>
                      <RadioGroup
                        value={querTelefone === null ? "" : querTelefone ? "sim" : "nao"}
                        onValueChange={(value) => {
                          const tel = value === "sim"
                          setQuerTelefone(tel)
                          if (!tel) setTelefone("")
                        }}
                      >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="sim" id="telefone-sim" />
                          <Label htmlFor="telefone-sim" className="flex-1 cursor-pointer">
                            Sim, quero deixar meu telefone
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="nao" id="telefone-nao" />
                          <Label htmlFor="telefone-nao" className="flex-1 cursor-pointer">
                            Não, prefiro não informar
                          </Label>
                        </div>
                      </RadioGroup>

                      {querTelefone && (
                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input
                            id="telefone"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Etapa 3: Tipo de declaração */}
          {etapa === 3 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Qual o tipo da sua declaração?</Label>
              <RadioGroup value={tipo} onValueChange={(value: any) => setTipo(value)}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="sugestao" id="tipo-sugestao" />
                  <Label htmlFor="tipo-sugestao" className="flex-1 cursor-pointer">
                    Sugestão
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="elogio" id="tipo-elogio" />
                  <Label htmlFor="tipo-elogio" className="flex-1 cursor-pointer">
                    Elogio
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="reclamacao" id="tipo-reclamacao" />
                  <Label htmlFor="tipo-reclamacao" className="flex-1 cursor-pointer">
                    Reclamação
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex items-center space-x-2 p-4 border rounded-lg cursor-pointer",
                    ehColaborador ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed",
                  )}
                >
                  <RadioGroupItem value="denuncia" id="tipo-denuncia" disabled={!ehColaborador} />
                  <Label
                    htmlFor="tipo-denuncia"
                    className={cn("flex-1", ehColaborador ? "cursor-pointer" : "cursor-not-allowed")}
                  >
                    Denúncia {!ehColaborador && "(Apenas para colaboradores)"}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Etapa 4: Data */}
          {etapa === 4 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Quando ocorreu o fato?</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !data && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data} onSelect={setData} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Etapa 5: Mensagem */}
          {etapa === 5 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Descreva sua declaração</Label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Escreva aqui os detalhes da sua declaração..."
                className="min-h-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Todas as declarações são tratadas com seriedade e confidencialidade.
              </p>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex gap-3 pt-4">
            {etapa > 1 && (
              <Button variant="outline" onClick={handleVoltarEtapa} className="flex-1 bg-transparent">
                Voltar
              </Button>
            )}
            {etapa < 5 ? (
              <Button onClick={handleProximaEtapa} disabled={!podeAvancar()} className="flex-1">
                Próxima
              </Button>
            ) : (
              <Button onClick={handleEnviar} disabled={!podeAvancar() || loading} className="flex-1">
                {loading ? "Enviando..." : "Enviar Declaração"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
