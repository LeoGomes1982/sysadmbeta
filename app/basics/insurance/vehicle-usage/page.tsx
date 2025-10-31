import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VehicleUsagePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso Veículo</CardTitle>
        <CardDescription>Gerenciamento de categorias de uso de veículos</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode adicionar, editar e visualizar as diferentes categorias de uso de veículos para seguros.</p>
      </CardContent>
    </Card>
  )
}
