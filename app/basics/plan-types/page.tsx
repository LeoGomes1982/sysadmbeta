import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlanTypesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipo Plano</CardTitle>
        <CardDescription>Gerenciamento de tipos de planos de saúde</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode adicionar, editar e visualizar os diferentes tipos de planos de saúde disponíveis.</p>
      </CardContent>
    </Card>
  )
}
