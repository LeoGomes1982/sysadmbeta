import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VehiclesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Veículos</CardTitle>
        <CardDescription>Gerenciamento de veículos segurados</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Nesta página, você pode gerenciar informações sobre os veículos segurados, incluindo detalhes como modelo, ano
          e características específicas.
        </p>
      </CardContent>
    </Card>
  )
}
