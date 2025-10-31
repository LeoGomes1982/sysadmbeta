import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ThemeSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tema de Cores</CardTitle>
        <CardDescription>Configuração do tema de cores do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode personalizar o tema de cores utilizado no sistema.</p>
      </CardContent>
    </Card>
  )
}
