import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DriverProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil Condutor</CardTitle>
        <CardDescription>Gerenciamento de perfis de condutores</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode adicionar, editar e visualizar os diferentes perfis de condutores para seguros.</p>
      </CardContent>
    </Card>
  )
}
