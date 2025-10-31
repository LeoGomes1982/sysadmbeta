import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReturnReasonPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Motivo da Devolução</CardTitle>
        <CardDescription>Gerenciamento de motivos de devolução</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Nesta página, você pode adicionar, editar e visualizar os motivos de devolução de propostas ou documentos.
        </p>
      </CardContent>
    </Card>
  )
}
