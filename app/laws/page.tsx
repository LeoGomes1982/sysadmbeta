"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, FileText, Users, Shirt, Award, Gavel, Building2, AlertTriangle, Phone, Plus, Lock } from "lucide-react"

interface EditableLaw {
  id: string
  content: string
  type: "rule" | "item" | "text"
}

const saveLawsToStorage = (laws: any) => {
  localStorage.setItem("sysathos_laws", JSON.stringify(laws))

  // Sincronizar com página de sanções
  const existingRules = JSON.parse(localStorage.getItem("sysathos_sanction_rules") || "[]")
  const newRules = extractRulesFromLaws(laws)
  localStorage.setItem("sysathos_sanction_rules", JSON.stringify([...existingRules, ...newRules]))
}

const extractRulesFromLaws = (laws: any) => {
  const rules: string[] = []

  laws.forEach((section: any) => {
    if (section.id === "normas" && section.content) {
      Object.entries(section.content).forEach(([key, subsection]: [string, any]) => {
        if (subsection.items) {
          subsection.items.forEach((item: string, index: number) => {
            rules.push(`Art. 2º - ${item}`)
          })
        }
      })
    }

    if (section.id === "proibicoes" && section.content) {
      section.content.forEach((proibicao: string, index: number) => {
        rules.push(`Art. 12º - ${proibicao}`)
      })
    }
  })

  return rules
}

const lawSections = [
  {
    id: "cultura",
    title: "1. Cultura Empresarial",
    icon: <Building2 className="h-5 w-5" />,
    description: "Propósito, valores e princípios inegociáveis",
    content: {
      proposito: "Proporcionar tranquilidade, segurança e bem-estar às pessoas.",
      valores: [
        {
          nome: "Ética",
          descricao: "Fazer o certo, inclusive nos bastidores",
        },
        {
          nome: "Coragem",
          descricao: "Tomar decisões, tendo noção das consequências",
        },
        {
          nome: "Empatia, Cordialidade e Educação",
          descricao: "Transformar concreto em vidro, mudando o EU para NÓS",
        },
        {
          nome: "Determinação",
          descricao: "Atitudes que encantam e ao mesmo tempo resolvem",
        },
        {
          nome: "Proteção",
          descricao: "Zelar pelo patrimônio humano, familiar e material",
        },
      ],
      principios: "Caráter, Honestidade e Postura. Servir bem gerando mutuamente ética e civilidade.",
      observacao:
        "Esses são os princípios que a empresa não aceita negociar. O colaborador que infringir esses princípios não terá mediador a favor dele na empresa.",
    },
  },
  {
    id: "normas",
    title: "2. Normas da Empresa",
    icon: <FileText className="h-5 w-5" />,
    description: "Regulamento interno, deveres e obrigações",
    content: {
      integracao: {
        titulo: "2.1. Integração do Contrato Individual de Trabalho",
        items: [
          "O Regulamento Interno estabelece as regras para todos os colaboradores",
          "Este regulamento integra-se ao contrato individual conforme Art. 444 da CLT",
          "O descumprimento pode levar a punições disciplinares, incluindo demissão por justa causa",
        ],
      },
      deveres: {
        titulo: "2.2. Deveres, Obrigações e Responsabilidades dos Colaboradores",
        items: [
          "Cumprir o contrato de trabalho com zelo, atenção e competência profissional",
          "Obedecer às ordens e instruções dos superiores hierárquicos",
          "Sugerir medidas para maior eficiência do serviço",
          "Observar a máxima disciplina no local de trabalho",
          "Zelar pela ordem e asseio no local de trabalho",
          "Zelar pela boa conservação das instalações, equipamentos e máquinas",
          "Respeitar a honra, boa fama e integridade física de todas as pessoas",
          "Responder por prejuízos causados à empresa por dolo ou culpa",
        ],
      },
      uniforme: {
        titulo: "2.3. Uso do Uniforme",
        items: [
          "O uso do uniforme é OBRIGATÓRIO dentro das dependências da empresa",
          "Funcionário sem uniforme não poderá exercer suas funções",
          "O dia não trabalhado por falta de uniforme será descontado do salário",
          "A duração do uniforme é de 12 meses",
          "O uniforme deve estar sempre limpo e passado",
          "Uniformes danificados antes do prazo serão descontados do colaborador",
          "Os armários podem passar por inspeção mensal aleatória",
        ],
      },
      horario: {
        titulo: "2.4. Horário de Trabalho",
        items: [
          "O horário de trabalho deve ser cumprido rigorosamente por todos os colaboradores",
          "Os colaboradores devem estar nos respectivos lugares na hora inicial do trabalho",
          "Atrasos só são permitidos com justificativas em consonância com as normas internas",
          "O colaborador deve bater o ponto de entrada e saída uniformizado",
        ],
      },
      ausencias: {
        titulo: "2.5. Ausências e Atrasos",
        items: [
          "Colaboradores que se atrasarem, saírem antes do término ou faltarem devem justificar ao superior imediato",
          "A empresa pode descontar períodos de atrasos, saídas antecipadas e faltas do salário",
          "3 faltas não justificadas = perde 1 dia de férias",
          "5 faltas não justificadas = perde 3 dias de férias",
          "21 faltas não justificadas = perde 30 dias de férias",
        ],
      },
      pagamento: {
        titulo: "2.6. Pagamento",
        items: [
          "A empresa paga os salários no quinto dia útil de cada mês",
          "Cada colaborador deve ter conta bancária no SANTANDER",
          "Todos os benefícios são pagos conforme acordo sindical ou CLT",
          "Vale alimentação: pago após jornada no quinto dia útil, com desconto de 15%",
          "Vale transporte: dado em cartão, com desconto de 6% do salário base",
        ],
      },
      licencas: {
        titulo: "2.7. Licenças",
        items: [
          "A empresa concede licença de 3 dias corridos e consecutivos por motivo de:",
          "• Casamento (comunicar com 15 dias de antecedência)",
          "• Falecimento de cônjuge, ascendente, descendente ou dependente",
          "• Nascimento de filho",
        ],
      },
    },
  },
  {
    id: "proibicoes",
    title: "2.8. Proibições",
    icon: <Gavel className="h-5 w-5" />,
    description: "Atos expressamente proibidos - podem levar à demissão por justa causa",
    content: [
      "Ingressar ou permanecer em setores estranhos aos serviços",
      "Ocupar-se de atividades que prejudiquem os interesses do serviço",
      "Promover algazarra, brincadeiras e discussões durante a jornada",
      "Usar palavras ou gestos impróprios à moralidade e respeito",
      "Fumar em qualquer dependência da empresa",
      "Retirar equipamentos, objetos ou documentos sem autorização",
      "Propagar ou incitar insubordinação ao trabalho",
      "Introduzir pessoas estranhas sem autorização",
      "Divulgar assuntos de natureza privada da empresa",
      "Ingerir bebidas alcoólicas ou substâncias entorpecentes",
      "Envolvimento emocional afetivo entre colegas de trabalho",
      "Comer ou manusear alimentos fora da cozinha",
      "Usar rádio ou fone de ouvido para fins pessoais",
      "Usar telefone celular particular durante a jornada",
      "Amizade excessiva com contratantes",
      "Utilizar equipamentos do posto sem autorização",
      "Repassar informações da operação ao tomador do serviço",
      "Realizar reuniões privadas com representantes do tomador",
    ],
  },
  {
    id: "politicas",
    title: "3. Políticas Específicas",
    icon: <Phone className="h-5 w-5" />,
    description: "WhatsApp, dispensas, bebidas e comunicação interna",
    content: {
      whatsapp: {
        titulo: "3.1. Política de WhatsApp",
        items: [
          "É proibido o ingresso de fiscais ou setor administrativo em grupos não oficiais",
          "Ex-colaboradores NÃO devem ser tratados pelo WhatsApp e devem ser BLOQUEADOS",
          "Respostas para ex-colaboradores limitam-se apenas a informações de datas e assinaturas",
        ],
      },
      dispensas: {
        titulo: "3.2. Política de Dispensas e Benefícios",
        items: [
          "Dispensas concedidas pelo posto devem ser analisadas e autorizadas pela empresa",
          "Benefícios concedidos pelo posto devem ser pagos diretamente ao colaborador",
          "Se a empresa pagar via nota fiscal, será acrescido impostos + 30%",
        ],
      },
      bebidas: {
        titulo: "3.3. Bebidas e Cigarros",
        items: [
          "É PROIBIDO o uso de bebidas alcoólicas e cigarros em qualquer posto de serviço",
          "Colaboradores em serviço devem RECUSAR convites para consumo",
          "Em eventos do contratante, a norma permanece válida",
          "Dispensas em feriados prolongados só podem ser concedidas pelo Grupo Athos",
        ],
      },
      comunicacao: {
        titulo: "3.4. Comunicação Interna",
        items: [
          "A comunicação deve ser CALMA, OBJETIVA E TRANSPARENTE",
          "Documentos devem ser entregues via protocolo",
          "Entregas de brindes e elogios devem ser feitas em mãos ao colaborador",
          "É proibida a retirada de materiais do posto sem comunicação ao fiscal",
        ],
      },
    },
  },
  {
    id: "pontos",
    title: "4. Sistema de Pontuação",
    icon: <Award className="h-5 w-5" />,
    description: "Sistema de reconhecimento, contagem e desconto de pontos",
    content: {
      inicial: [
        "Cada funcionário inicia com 10 pontos gerais ao ser cadastrado no sistema",
        "Os pontos são gerenciados através do sistema Connectean",
        "A pontuação é atualizada mensalmente conforme desempenho e histórico",
        "Pontos podem ser convertidos em benefícios ou dinheiro (R$ 1,00 por ponto)",
      ],
      contabilizacao: [
        "Avaliação de Desempenho: Realizada mensalmente pelos supervisores",
        "Fiscalizações: Pontos adicionados/removidos conforme relatórios de fiscalização",
        "Histórico de Comportamento: Registros de pontualidade, assiduidade e conduta",
        "Feedback de Clientes: Elogios e reclamações impactam diretamente na pontuação",
        "Participação em Treinamentos: Colaboradores que participam ganham pontos extras",
      ],
      regras: [
        "Válido apenas para colaboradores no sistema Connectean",
        "Pontos são somados mensalmente e atualizados no perfil",
        "Podem ser trocados por vantagens ou dinheiro (R$ 1,00 por ponto)",
        "Prazo para troca em dinheiro: até 29 de dezembro",
        "Pontos não utilizados expiram, restando apenas 10 para o próximo ano",
      ],
      contagem: [
        "Pontualidade: +5 pontos por semana sem atrasos",
        "Assiduidade: +10 pontos por mês sem faltas",
        "Feedback positivo do cliente: +15 pontos",
        "Sugestões implementadas: +20 pontos",
        "Participação em treinamentos: +10 pontos",
        "Indicação de novos colaboradores: +25 pontos",
        "Avaliação de desempenho excelente: +30 pontos",
        "Fiscalização com resultado positivo: +20 pontos",
      ],
      desconto: [
        "Advertência: -10 pontos",
        "Suspensão de 1 dia: -20 pontos",
        "Suspensão de 3 dias: -30 pontos",
        "Suspensão de 5 dias ou mais: -50 pontos",
        "Atraso até 15 minutos: -2 pontos",
        "Atraso acima de 15 minutos: -5 pontos",
        "Falta não justificada: -10 pontos",
        "Reclamação do cliente: -20 pontos",
        "Não uso do uniforme: -10 pontos",
        "Avaliação de desempenho insatisfatória: -30 pontos",
        "Fiscalização com resultado negativo: -25 pontos",
      ],
      vantagens: [
        { item: "R$ 50,00", pontos: "100 pontos" },
        { item: "R$ 100,00", pontos: "250 pontos" },
        { item: "R$ 200,00", pontos: "300 pontos" },
        { item: "1 Folga", pontos: "250 pontos" },
        { item: "1 Boton", pontos: "100 pontos" },
        { item: "1 Homenagem", pontos: "300 pontos" },
      ],
    },
  },
  {
    id: "uniforme",
    title: "5. Manual de Uso do Uniforme",
    icon: <Shirt className="h-5 w-5" />,
    description: "Especificações e regras por função",
    content: {
      pecas: [
        "Camiseta Polo azul manga curta",
        "Camiseta azul ou branca manga curta",
        "Camisa de botão azul manga curta ou longa",
        "Calça social ou tática preta",
        "Sapato ou coturno preto",
        "Jaqueta preta",
        "Jaleco preto ou azul",
      ],
      portarias: [
        "Permitido maior liberdade, mas NÃO podem trabalhar com:",
        "• Calça de abrigo ou esporte",
        "• Tênis de cor que não seja preto",
        "• Calça jeans de outra cor que não preta",
        "• Touca ou cobertura de qualquer cor",
        "• Calçado aberto",
        "• Manta de qualquer cor que não preto",
      ],
      guardas: [
        "NÃO podem trabalhar com:",
        "• Calça de abrigo ou esporte",
        "• Tênis de cor que não seja preto",
        "• Touca com estampa e de outra cor que não preta",
        "• Jaqueta ou agasalho por cima da jaqueta da empresa",
        "• Boné com estampa e de outra cor que não preta",
        "• Calçado aberto",
      ],
    },
  },
  {
    id: "conduta",
    title: "6. Código de Conduta",
    icon: <Users className="h-5 w-5" />,
    description: "Postura executiva e cuidados pessoais",
    content: {
      postura: "A postura da empresa SEMPRE pende para uma postura EXECUTIVA.",
      cuidadosPessoais: {
        homens: [
          "Cabelos soltos (se liso, altura até o ombro)",
          "Barba, bigode ou cavanhaque mal aparado",
          "Barba estilo Hipster (maior que 6cm abaixo do queixo)",
          "Cabelos pintados de cores não naturais",
        ],
        mulheres: "Não há restrições quanto ao cuidado pessoal.",
      },
      maquiagem: {
        homens: "Não podem trabalhar com nenhum tipo de maquiagem.",
        mulheres: [
          "Lápis de olhos de cores vibrantes",
          "Batons na cor preta",
          "Pó branco aparentando branquidão",
          "Maquiagem temática (Halloween, etc.)",
        ],
      },
      aderecos: {
        homens: [
          "Tiaras no cabelo",
          "Brincos maiores que moeda de 10 centavos",
          "Correntes por cima do uniforme",
          "Piercing maiores que 1cm",
        ],
        mulheres: [
          "Tiaras ou presilhas com enfeites",
          "Brincos maiores que moeda de R$ 1,00",
          "Correntes por cima do uniforme",
          "Piercing maiores que 1cm",
          "Gargantilha no pescoço estilo coleira",
        ],
      },
      tatuagens: {
        homens: "Tatuagens no rosto e tatuagens remetentes a segmentos específicos",
        mulheres: "Tatuagens no rosto ou pescoço e tatuagens remetentes a segmentos específicos",
      },
    },
  },
]

export default function LawsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [newLawContent, setNewLawContent] = useState("")
  const [customLawSections, setCustomLawSections] = useState(lawSections)

  useEffect(() => {
    const savedLaws = localStorage.getItem("sysathos_laws")
    if (savedLaws) {
      setCustomLawSections(JSON.parse(savedLaws))
    }
  }, [])

  const validatePassword = () => {
    if (password === "123456789") {
      setIsPasswordValid(true)
      return true
    }
    alert("Senha incorreta!")
    return false
  }

  const addNewLaw = (sectionId: string) => {
    if (!validatePassword()) return

    const updatedSections = customLawSections.map((section) => {
      if (section.id === sectionId) {
        const updatedSection = { ...section }

        if (sectionId === "proibicoes") {
          updatedSection.content = [...updatedSection.content, newLawContent]
        } else if (sectionId === "normas") {
          // Adicionar à primeira subsection disponível
          const firstKey = Object.keys(updatedSection.content)[0]
          updatedSection.content[firstKey].items.push(newLawContent)
        } else if (sectionId === "politicas") {
          // Adicionar à primeira subsection disponível
          const firstKey = Object.keys(updatedSection.content)[0]
          updatedSection.content[firstKey].items.push(newLawContent)
        }

        return updatedSection
      }
      return section
    })

    setCustomLawSections(updatedSections)
    saveLawsToStorage(updatedSections)
    setNewLawContent("")
    setEditingSection(null)
    setIsPasswordValid(false)
    setPassword("")
  }

  const filteredSections = customLawSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Regras e Normas da Empresa</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar normas, regulamentos ou políticas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map((section) => (
          <Card key={section.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">{section.icon}</div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent">
                      <FileText className="h-4 w-4 mr-2" />
                      Consultar Normas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {section.icon}
                        {section.title}
                      </DialogTitle>
                      <DialogDescription>{section.description}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="space-y-6">
                        {section.id === "cultura" && (
                          <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-lg mb-2 text-blue-800">Propósito da Empresa</h3>
                              <p className="text-blue-700 font-medium">{section.content.proposito}</p>
                            </div>

                            <div>
                              <h3 className="font-semibold text-lg mb-3">Valores da Empresa</h3>
                              <div className="space-y-3">
                                {section.content.valores.map((valor, index) => (
                                  <div key={index} className="border-l-4 border-blue-500 pl-4 bg-gray-50 p-3 rounded-r">
                                    <h4 className="font-medium text-blue-600">• {valor.nome}</h4>
                                    <p className="text-sm text-gray-700">{valor.descricao}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                              <h3 className="font-semibold text-lg mb-2 text-red-800">Princípios Inegociáveis</h3>
                              <p className="font-medium text-red-700 mb-2">{section.content.principios}</p>
                              <div className="bg-red-100 p-3 rounded border-l-4 border-red-500">
                                <p className="text-sm text-red-800 font-medium">IMPORTANTE:</p>
                                <p className="text-sm text-red-700">{section.content.observacao}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {section.id === "normas" && (
                          <div className="space-y-6">
                            {Object.entries(section.content).map(([key, subsection]) => (
                              <div key={key} className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-lg mb-3 text-gray-800">{subsection.titulo}</h3>
                                <ul className="space-y-2">
                                  {subsection.items.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-1 text-sm">•</span>
                                      <span className="text-sm text-gray-700">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}

                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Informações Importantes - Entrega de Atestados
                              </h4>
                              <ul className="text-sm text-yellow-700 space-y-1">
                                <li>• Informar a operação com maior tempo hábil possível</li>
                                <li>• Comunicação sempre por ligação telefônica</li>
                                <li>• WhatsApp aceito apenas dentro do horário comercial</li>
                                <li>
                                  • Para valer como atestado deve constar que o colaborador está DISPENSADO de suas
                                  atividades por XXX dias
                                </li>
                                <li>• Atestado de comparecimento de consulta NÃO é aceito</li>
                              </ul>
                              <p className="text-xs text-yellow-600 mt-2 font-medium">
                                Documento atualizado em setembro de 2023
                              </p>
                            </div>
                          </div>
                        )}

                        {section.id === "proibicoes" && (
                          <div className="space-y-4">
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <h3 className="font-semibold text-lg text-red-800">ATENÇÃO</h3>
                              </div>
                              <p className="text-sm text-red-700 font-medium">
                                A persistência nos atos abaixo pode acarretar até demissão por justa causa.
                              </p>
                            </div>

                            <div className="grid gap-2">
                              {section.content.map((proibicao, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-3 p-3 bg-red-50 rounded border-l-4 border-red-400"
                                >
                                  <Badge
                                    variant="destructive"
                                    className="mt-1 text-xs min-w-[24px] h-5 flex items-center justify-center"
                                  >
                                    {index + 1}
                                  </Badge>
                                  <span className="text-sm text-red-800">{proibicao}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.id === "politicas" && (
                          <div className="space-y-6">
                            {Object.entries(section.content).map(([key, subsection]) => (
                              <div key={key} className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-lg mb-3 text-gray-800">{subsection.titulo}</h3>
                                <ul className="space-y-2">
                                  {subsection.items.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-1 text-sm">•</span>
                                      <span className="text-sm text-gray-700">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.id === "pontos" && (
                          <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h3 className="font-semibold text-lg mb-3 text-blue-800">Pontuação Inicial</h3>
                              <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-blue-800">
                                    Cada funcionário inicia com 10 pontos gerais ao ser cadastrado no sistema
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-blue-800">
                                    Pontos podem ser adicionados ou subtraídos
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-blue-800">
                                    A pontuação é atualizada mensalmente conforme desempenho e histórico
                                  </span>
                                </li>
                              </ul>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                              <h3 className="font-semibold text-lg mb-3 text-purple-800">Como é Contabilizado</h3>
                              <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-purple-800">Históricos positivos valem 10 pontos</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-purple-800">
                                    Históricos negativos subtraem 10 pontos
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-purple-800">
                                    Fiscalizações e avaliações de desempenho somam em pontos o percentual da avaliação
                                    ou fiscalização
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-purple-800">
                                    Sanções disciplinares seguem a tabela: advertência diminuem 10 pontos; suspensões de
                                    1 dia diminuem 20 pontos; suspensões de 3 dias diminuam 30 pontos e suspensões de 5
                                    dias ou mais diminuam 50 pontos
                                  </span>
                                </li>
                              </ul>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                              <h3 className="font-semibold text-lg mb-3 text-amber-800">Regras Gerais</h3>
                              <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-amber-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-amber-800">
                                    Cada funcionário pode ter apenas uma avaliação de desempenho e uma fiscalização a
                                    cada 30 dias
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-amber-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-amber-800">
                                    Cada funcionário deve ter uma certa pontuação para ter sua promoção autorizada: para
                                    mudança de cargo a pontuação mínima é 80 e não ter no ano corrente nenhuma sanção
                                    disciplinar
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-amber-600 mt-1 text-sm">•</span>
                                  <span className="text-sm text-amber-800">
                                    Troca de posto e de jornada a pontuação mínima é 60 pontos
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {section.id === "uniforme" && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-semibold text-lg mb-3">Peças do Uniforme</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {section.content.pecas.map((peca, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                                    <Shirt className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm text-blue-800">{peca}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-3">Regras para Portarias</h4>
                                <ul className="space-y-1">
                                  {section.content.portarias.map((regra, index) => (
                                    <li key={index} className="text-sm text-gray-700">
                                      {regra}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-3">Regras para Guardas Externos/Vigias</h4>
                                <ul className="space-y-1">
                                  {section.content.guardas.map((regra, index) => (
                                    <li key={index} className="text-sm text-gray-700">
                                      {regra}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {section.id === "conduta" && (
                          <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h3 className="font-semibold text-blue-800 mb-2">Postura Geral</h3>
                              <p className="text-sm text-blue-700">{section.content.postura}</p>
                            </div>

                            <Tabs defaultValue="cuidados" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="cuidados">Cuidados Pessoais</TabsTrigger>
                                <TabsTrigger value="maquiagem">Maquiagem</TabsTrigger>
                                <TabsTrigger value="aderecos">Adereços</TabsTrigger>
                                <TabsTrigger value="tatuagens">Tatuagens</TabsTrigger>
                              </TabsList>

                              <TabsContent value="cuidados" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="border border-blue-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-3">
                                      HOMENS - NÃO podem trabalhar com:
                                    </h4>
                                    <ul className="space-y-1">
                                      {section.content.cuidadosPessoais.homens.map((item, index) => (
                                        <li key={index} className="text-sm text-blue-700">
                                          • {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="border border-pink-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-pink-800 mb-3">MULHERES</h4>
                                    <p className="text-sm text-pink-700">{section.content.cuidadosPessoais.mulheres}</p>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="maquiagem" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="border border-blue-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-3">HOMENS</h4>
                                    <p className="text-sm text-blue-700">{section.content.maquiagem.homens}</p>
                                  </div>
                                  <div className="border border-pink-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-pink-800 mb-3">
                                      MULHERES - NÃO podem trabalhar com:
                                    </h4>
                                    <ul className="space-y-1">
                                      {section.content.maquiagem.mulheres.map((item, index) => (
                                        <li key={index} className="text-sm text-pink-700">
                                          • {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="aderecos" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="border border-blue-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-3">
                                      HOMENS - NÃO podem trabalhar com:
                                    </h4>
                                    <ul className="space-y-1">
                                      {section.content.aderecos.homens.map((item, index) => (
                                        <li key={index} className="text-sm text-blue-700">
                                          • {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="border border-pink-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-pink-800 mb-3">
                                      MULHERES - NÃO podem trabalhar com:
                                    </h4>
                                    <ul className="space-y-1">
                                      {section.content.aderecos.mulheres.map((item, index) => (
                                        <li key={index} className="text-sm text-pink-700">
                                          • {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="tatuagens" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="border border-blue-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-3">
                                      HOMENS - NÃO podem trabalhar com:
                                    </h4>
                                    <p className="text-sm text-blue-700">{section.content.tatuagens.homens}</p>
                                  </div>
                                  <div className="border border-pink-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-pink-800 mb-3">
                                      MULHERES - NÃO podem trabalhar com:
                                    </h4>
                                    <p className="text-sm text-pink-700">{section.content.tatuagens.mulheres}</p>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Button
                  className="bg-black hover:bg-gray-800 text-white w-full"
                  onClick={() => setEditingSection(section.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Lei
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={editingSection !== null}
        onOpenChange={() => {
          setEditingSection(null)
          setIsPasswordValid(false)
          setPassword("")
          setNewLawContent("")
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Adicionar Nova Lei
            </DialogTitle>
            <DialogDescription>
              Digite a senha para adicionar uma nova lei em{" "}
              {editingSection && filteredSections.find((s) => s.id === editingSection)?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!isPasswordValid ? (
              <div>
                <Label htmlFor="password">Senha de Acesso</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite a senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button onClick={validatePassword} className="w-full mt-2">
                  Validar Senha
                </Button>
              </div>
            ) : (
              <div>
                <Label htmlFor="newLaw">Nova Lei/Norma</Label>
                <Textarea
                  id="newLaw"
                  placeholder="Digite o conteúdo da nova lei..."
                  value={newLawContent}
                  onChange={(e) => setNewLawContent(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => editingSection && addNewLaw(editingSection)}
                    disabled={!newLawContent.trim()}
                    className="flex-1"
                  >
                    Adicionar Lei
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingSection(null)
                      setIsPasswordValid(false)
                      setPassword("")
                      setNewLawContent("")
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {filteredSections.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma norma encontrada</h3>
          <p className="text-gray-500">Tente ajustar os termos de busca</p>
        </div>
      )}
    </div>
  )
}
