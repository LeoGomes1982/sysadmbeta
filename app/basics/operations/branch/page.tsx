import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BranchPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filial</CardTitle>
        <CardDescription>Gerenciamento de filiais</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode adicionar, editar e visualizar informações sobre as filiais da empresa.</p>
      </CardContent>
    </Card>
  )
}
