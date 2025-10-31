import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SupervisorsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supervisores</CardTitle>
        <CardDescription>Gerenciamento de supervisores</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode adicionar, editar e visualizar informações sobre os supervisores da empresa.</p>
      </CardContent>
    </Card>
  )
}
