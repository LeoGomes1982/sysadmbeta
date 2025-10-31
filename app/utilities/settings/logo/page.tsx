import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LogoSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo</CardTitle>
        <CardDescription>Configuração do logo da empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Nesta página, você pode fazer upload e gerenciar o logo da empresa utilizado no sistema.</p>
      </CardContent>
    </Card>
  )
}
