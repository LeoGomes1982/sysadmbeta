import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DriverProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil Condutor</CardTitle>
        <CardDescription>Gerencie os perfis de condutores para seguros</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode adicionar, editar e visualizar os perfis de condutores para seguros.</p>
      </CardContent>
    </Card>
  )
}
