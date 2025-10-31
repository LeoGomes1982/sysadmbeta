import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfessionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profissões</CardTitle>
        <CardDescription>Gerenciamento de profissões</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode gerenciar a lista de profissões utilizadas no sistema.</p>
      </CardContent>
    </Card>
  )
}
