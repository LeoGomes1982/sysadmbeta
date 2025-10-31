import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MovementsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimentações</CardTitle>
        <CardDescription>Acompanhamento de movimentações</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Nesta página, você pode visualizar e gerenciar todas as movimentações financeiras e operacionais.</p>
      </CardContent>
    </Card>
  )
}
