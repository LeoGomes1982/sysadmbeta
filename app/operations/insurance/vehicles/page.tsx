import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VehiclesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Veículos</CardTitle>
        <CardDescription>Gerencie os veículos segurados</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Nesta página, você pode gerenciar informações sobre os veículos segurados.</p>
      </CardContent>
    </Card>
  )
}
