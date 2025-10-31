import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OperationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operações</CardTitle>
        <CardDescription>Gerencie as operações do dia a dia</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode gerenciar seguros, gerentes, supervisores, parceiros e vendedores.</p>
      </CardContent>
    </Card>
  )
}
