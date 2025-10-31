"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react"

export default function DeleteRecordsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const supabase = createClient()

  const deleteLeandroRecords = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Deletar sanção disciplinar do Leandro
      const { error: sanctionError } = await supabase
        .from("employee_sanctions")
        .delete()
        .eq("employee_name", "Leandro Da Silva Gomes E Silva")

      if (sanctionError) throw sanctionError

      // Deletar avaliação de desempenho do Leandro
      const { error: evaluationError } = await supabase
        .from("employee_evaluations")
        .delete()
        .eq("employee_name", "Leandro Da Silva Gomes E Silva")

      if (evaluationError) throw evaluationError

      // Verificar se os registros foram deletados
      const { data: sanctions } = await supabase
        .from("employee_sanctions")
        .select("*")
        .eq("employee_name", "Leandro Da Silva Gomes E Silva")

      const { data: evaluations } = await supabase
        .from("employee_evaluations")
        .select("*")
        .eq("employee_name", "Leandro Da Silva Gomes E Silva")

      setResult({
        success: true,
        message: `Registros deletados com sucesso! Sanções restantes: ${sanctions?.length || 0}, Avaliações restantes: ${evaluations?.length || 0}`,
      })
    } catch (error) {
      console.error("Erro ao deletar registros:", error)
      setResult({
        success: false,
        message: `Erro ao deletar registros: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Deletar Registros do Leandro
          </CardTitle>
          <CardDescription>
            Este script irá deletar a sanção disciplinar e a avaliação de desempenho do funcionário Leandro Da Silva
            Gomes E Silva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">O que será deletado:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Sanção disciplinar (advertência de 19/10)</li>
              <li>Avaliação de desempenho (58% de 20/10)</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Após a execução, a pontuação de Leandro voltará para 10 pontos (apenas pontuação base).
            </p>
          </div>

          <Button onClick={deleteLeandroRecords} disabled={loading} className="w-full" variant="destructive">
            {loading ? "Deletando..." : "Executar Script"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
