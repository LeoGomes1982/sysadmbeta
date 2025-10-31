import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StandardTablePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabela Padrão</CardTitle>
        <CardDescription>Gerenciamento da tabela padrão</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode visualizar e editar a tabela padrão do sistema.</p>
      </CardContent>
    </Card>
  )
}
