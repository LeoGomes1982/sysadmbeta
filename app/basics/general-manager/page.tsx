import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GeneralManagerPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerente Geral</CardTitle>
        <CardDescription>Gerenciamento de gerentes gerais</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode adicionar, editar e visualizar informações sobre os gerentes gerais da empresa.</p>
      </CardContent>
    </Card>
  )
}
