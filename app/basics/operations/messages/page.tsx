import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MessagesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensagens</CardTitle>
        <CardDescription>Gerenciamento de mensagens do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode gerenciar as mensagens utilizadas no sistema, como notificações e alertas.</p>
      </CardContent>
    </Card>
  )
}
