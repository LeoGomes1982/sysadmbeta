import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BanksPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bancos</CardTitle>
        <CardDescription>Gerenciamento de informações bancárias</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Nesta página, você pode adicionar, editar e visualizar informações sobre bancos utilizados no sistema.</p>
      </CardContent>
    </Card>
  )
}
