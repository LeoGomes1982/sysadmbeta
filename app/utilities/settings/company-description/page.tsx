import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CompanyDescriptionPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Descrição da Empresa</CardTitle>
        <CardDescription>Configuração da descrição da empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode editar e atualizar a descrição da empresa exibida no sistema.</p>
      </CardContent>
    </Card>
  )
}
